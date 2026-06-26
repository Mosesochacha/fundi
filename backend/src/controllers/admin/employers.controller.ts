import { Response } from "express";
import { Op } from "sequelize";
import { AuthenticatedRequest } from "../../middleware/verifyJWT";
import db from "../../models";
import { asyncHandler, sendError, sendSuccess } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import { logAdminAction } from "../../services/audit.service";
import { paginated, parseListParams, shapeEmployer } from "../../utils/adminShape";

const Db = db as any;

interface EAgg {
  hires: number;
  ratingSum: number;
  ratingCount: number;
}

async function employerJobAggs(profileIds: string[]): Promise<Record<string, EAgg>> {
  const out: Record<string, EAgg> = {};
  if (!profileIds.length) return out;
  const rows = await Db.JobRequest.findAll({
    where: { employerId: profileIds },
    attributes: ["employerId", "status", "reviewRating"],
    raw: true,
  });
  for (const r of rows) {
    const a = (out[r.employerId] ||= { hires: 0, ratingSum: 0, ratingCount: 0 });
    if (r.status === "completed") a.hires += 1;
    if (r.reviewRating != null) {
      a.ratingSum += r.reviewRating;
      a.ratingCount += 1;
    }
  }
  return out;
}

async function employerSpend(userIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!userIds.length) return out;
  const rows = await Db.Payment.findAll({
    where: { employerId: userIds, status: "completed" },
    attributes: ["employerId", "amount"],
    raw: true,
  });
  for (const r of rows) out[r.employerId] = (out[r.employerId] || 0) + (r.amount || 0);
  return out;
}

const extrasFrom = (jobs?: EAgg, spent?: number) => ({
  totalHires: jobs?.hires ?? 0,
  totalSpent: spent ?? 0,
  avgRatingGiven: jobs && jobs.ratingCount ? Math.round((jobs.ratingSum / jobs.ratingCount) * 10) / 10 : 0,
});

class AdminEmployersController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = { accountType: "employer" };
    if (p.status === "suspended") where.status = "suspended";
    else if (p.status === "active") where.status = "active";

    if (p.search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${p.search}%` } },
        { lastName: { [Op.iLike]: `%${p.search}%` } },
        { email: { [Op.iLike]: `%${p.search}%` } },
        { "$profile.fullName$": { [Op.iLike]: `%${p.search}%` } },
        { "$profile.location$": { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const order: any =
      p.sort === "oldest" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]];

    const { count, rows } = await Db.User.findAndCountAll({
      where,
      include: [{ model: Db.Profile, as: "profile", required: false }],
      order,
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
      subQuery: false,
    });

    const profileIds = rows.map((u: any) => u.profile?.id).filter(Boolean);
    const userIds = rows.map((u: any) => u.id);
    const [jobAggs, spend] = await Promise.all([
      employerJobAggs(profileIds),
      employerSpend(userIds),
    ]);

    let shaped = rows.map((u: any) =>
      shapeEmployer(u, u.profile, extrasFrom(jobAggs[u.profile?.id], spend[u.id])),
    );
    if (p.sort === "hires") shaped = shaped.sort((a: any, b: any) => b.totalHires - a.totalHires);
    else if (p.sort === "spent") shaped = shaped.sort((a: any, b: any) => b.totalSpent - a.totalSpent);

    return sendSuccess(res, "Employers", paginated(shaped, count, p.page, p.pageSize));
  });

  detail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id, {
      include: [{ model: Db.Profile, as: "profile" }],
    });
    if (!user || user.accountType !== "employer")
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Employer not found");

    const [jobAggs, spend] = await Promise.all([
      user.profile ? employerJobAggs([user.profile.id]) : Promise.resolve({}),
      employerSpend([user.id]),
    ]);
    const shaped = shapeEmployer(
      user,
      user.profile,
      extrasFrom(user.profile ? (jobAggs as any)[user.profile.id] : undefined, spend[user.id]),
    );
    return sendSuccess(res, "Employer detail", shaped);
  });

  suspend = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "Employer not found");
    await user.update({
      status: "suspended",
      suspensionReason: req.body?.reason || null,
    });
    await logAdminAction(req, {
      action: "employer_suspended",
      resourceType: "employer",
      resourceId: user.id,
    });
    return sendSuccess(res, "Employer suspended");
  });

  unsuspend = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "Employer not found");
    await user.update({ status: "active", suspendedUntil: null, suspensionReason: null });
    await logAdminAction(req, {
      action: "employer_unsuspended",
      resourceType: "employer",
      resourceId: user.id,
    });
    return sendSuccess(res, "Employer reinstated");
  });
}

export default new AdminEmployersController();
