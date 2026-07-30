import { Response } from "express";
import { Op } from "sequelize";
import { AuthenticatedRequest } from "../../middleware/verifyJWT";
import db from "../../models";
import { asyncHandler, sendError, sendSuccess } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import { logAdminAction } from "../../services/audit.service";
import {
  paginated,
  parseListParams,
  shapeCompactReport,
  shapeRelatedJob,
  shapeRelatedReview,
  shapeWorker,
} from "../../utils/adminShape";

const Db = db as any;

interface Agg {
  jobs: number;
  ratingSum: number;
  ratingCount: number;
  received: number;
  responded: number;
}

/** Per-profile job + rating + response aggregates in one query. */
async function workerAggregates(profileIds: string[]): Promise<Record<string, Agg>> {
  const out: Record<string, Agg> = {};
  if (profileIds.length === 0) return out;
  const rows = await Db.JobRequest.findAll({
    where: { workerId: profileIds },
    attributes: ["workerId", "status", "reviewRating", "reviewRemoved"],
    raw: true,
  });
  for (const r of rows) {
    const a = (out[r.workerId] ||= { jobs: 0, ratingSum: 0, ratingCount: 0, received: 0, responded: 0 });
    a.received += 1;
    if (r.status !== "pending") a.responded += 1;
    if (r.status === "completed") a.jobs += 1;
    if (r.reviewRating != null && !r.reviewRemoved) {
      a.ratingSum += r.reviewRating;
      a.ratingCount += 1;
    }
  }
  return out;
}

const extrasFrom = (a?: Agg) => ({
  jobs: a?.jobs ?? 0,
  rating: a && a.ratingCount ? Math.round((a.ratingSum / a.ratingCount) * 10) / 10 : 0,
  reviewCount: a?.ratingCount ?? 0,
  responseRate: a && a.received ? Math.round((a.responded / a.received) * 100) : 0,
});

class AdminWorkersController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = { accountType: "worker" };
    const profileWhere: any = {};

    if (p.status === "suspended") where.status = "suspended";
    else if (["verified", "unverified", "pending", "rejected"].includes(p.status))
      profileWhere.idVerificationStatus = p.status;

    if (p.trade) profileWhere.profession = { [Op.iLike]: p.trade };

    if (p.search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${p.search}%` } },
        { lastName: { [Op.iLike]: `%${p.search}%` } },
        { "$profile.fullName$": { [Op.iLike]: `%${p.search}%` } },
        { "$profile.profession$": { [Op.iLike]: `%${p.search}%` } },
        { "$profile.location$": { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const order: any =
      p.sort === "oldest" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]];

    const { count, rows } = await Db.User.findAndCountAll({
      where,
      include: [
        {
          model: Db.Profile,
          as: "profile",
          required: true,
          where: Object.keys(profileWhere).length ? profileWhere : undefined,
        },
      ],
      order,
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
      subQuery: false,
    });

    const aggs = await workerAggregates(rows.map((u: any) => u.profile?.id).filter(Boolean));
    let shaped = rows.map((u: any) => shapeWorker(u, u.profile, extrasFrom(aggs[u.profile?.id])));

    if (p.sort === "rating") shaped = shaped.sort((a: any, b: any) => b.rating - a.rating);
    else if (p.sort === "jobs") shaped = shaped.sort((a: any, b: any) => b.jobs - a.jobs);
    else if (p.sort === "pending")
      shaped = shaped.sort((a: any, b: any) => (a.verify === "pending" ? 0 : 1) - (b.verify === "pending" ? 0 : 1));

    return sendSuccess(res, "Workers", paginated(shaped, count, p.page, p.pageSize));
  });

  detail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id, {
      include: [{ model: Db.Profile, as: "profile" }],
    });
    if (!user || user.accountType !== "worker" || !user.profile)
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Worker not found");

    const aggs = await workerAggregates([user.profile.id]);
    const [jobRows, reviewRows, reportRows] = await Promise.all([
      Db.JobRequest.findAll({
        where: { workerId: user.profile.id },
        include: [{ model: Db.Profile, as: "employer", required: false, attributes: ["id", "fullName", "profession"] }],
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
      Db.JobRequest.findAll({
        where: { workerId: user.profile.id, reviewRating: { [Op.ne]: null }, reviewRemoved: false },
        include: [{ model: Db.Profile, as: "employer", required: false, attributes: ["id", "fullName"] }],
        order: [["reviewedAt", "DESC"]],
        limit: 5,
      }),
      Db.UserReport.findAll({
        where: { reportedUserId: user.id },
        order: [["createdAt", "DESC"]],
        limit: 5,
        raw: true,
      }),
    ]);
    const shaped = shapeWorker(user, user.profile, extrasFrom(aggs[user.profile.id]));
    return sendSuccess(res, "Worker detail", {
      ...shaped,
      jobHistory: jobRows.map((j: any) => shapeRelatedJob(j, j.employer, "employer")),
      reviews: reviewRows.map((j: any) => shapeRelatedReview(j, j.employer)),
      reports: reportRows.map(shapeCompactReport),
    });
  });

  verify = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await Db.Profile.findOne({ where: { userId: req.params.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, "Worker not found");
    await profile.update({
      idVerificationStatus: "verified",
      idVerifiedAt: new Date(),
      idRejectionReason: null,
    });
    await logAdminAction(req, {
      action: "worker_verified",
      resourceType: "worker",
      resourceId: req.params.id,
    });
    return sendSuccess(res, "Verification approved");
  });

  rejectVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await Db.Profile.findOne({ where: { userId: req.params.id } });
    if (!profile) return sendError(res, HTTP_STATUS.NOT_FOUND, "Worker not found");
    await profile.update({
      idVerificationStatus: "rejected",
      idRejectionReason: req.body?.reason || "Document unclear — please resubmit.",
    });
    await logAdminAction(req, {
      action: "worker_verification_rejected",
      resourceType: "worker",
      resourceId: req.params.id,
      changes: { reason: req.body?.reason || null },
    });
    return sendSuccess(res, "Resubmission requested");
  });

  suspend = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "Worker not found");
    await user.update({
      status: "suspended",
      suspensionReason: req.body?.reason || null,
    });
    await logAdminAction(req, {
      action: "worker_suspended",
      resourceType: "worker",
      resourceId: user.id,
    });
    return sendSuccess(res, "Worker suspended");
  });
}

export default new AdminWorkersController();
