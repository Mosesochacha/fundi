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
  shapeUser,
  timeAgo,
} from "../../utils/adminShape";

const Db = db as any;

/** Job count per Profile id, across both worker and employer sides. */
async function jobCounts(profileIds: string[]): Promise<Record<string, number>> {
  if (profileIds.length === 0) return {};
  const rows = await Db.JobRequest.findAll({
    where: { [Op.or]: [{ workerId: profileIds }, { employerId: profileIds }] },
    attributes: ["workerId", "employerId"],
    raw: true,
  });
  const counts: Record<string, number> = {};
  for (const r of rows) {
    if (profileIds.includes(r.workerId)) counts[r.workerId] = (counts[r.workerId] || 0) + 1;
    if (profileIds.includes(r.employerId)) counts[r.employerId] = (counts[r.employerId] || 0) + 1;
  }
  return counts;
}

class AdminUsersController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = {};
    const profileWhere: any = {};

    if (p.role === "worker") where.accountType = "worker";
    else if (p.role === "employer") where.accountType = "employer";

    if (p.status === "suspended") where.status = "suspended";
    else if (p.status === "unverified") where.emailVerified = false;
    else if (p.status === "pending") profileWhere.idVerificationStatus = "pending";

    if (p.search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${p.search}%` } },
        { lastName: { [Op.iLike]: `%${p.search}%` } },
        { email: { [Op.iLike]: `%${p.search}%` } },
        { phoneNumber: { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const order: any =
      p.sort === "oldest"
        ? [["createdAt", "ASC"]]
        : p.sort === "alpha"
          ? [["firstName", "ASC"]]
          : [["createdAt", "DESC"]];

    const { count, rows } = await Db.User.findAndCountAll({
      where,
      include: [
        {
          model: Db.Profile,
          as: "profile",
          required: Object.keys(profileWhere).length > 0,
          where: Object.keys(profileWhere).length ? profileWhere : undefined,
        },
      ],
      order,
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
    });

    const profileIds = rows.map((u: any) => u.profile?.id).filter(Boolean);
    const counts = await jobCounts(profileIds);

    const shaped = rows.map((u: any) =>
      shapeUser(u, u.profile, { jobs: u.profile ? counts[u.profile.id] || 0 : 0 }),
    );

    return sendSuccess(
      res,
      "Users",
      paginated(shaped, count, p.page, p.pageSize),
    );
  });

  detail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id, {
      include: [{ model: Db.Profile, as: "profile" }],
    });
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "User not found");

    const profileId = user.profile?.id;
    const [counts, totalLogins, lastLogin] = await Promise.all([
      profileId ? jobCounts([profileId]) : Promise.resolve({} as Record<string, number>),
      Db.LoginHistory.count({ where: { userId: user.id } }).catch(() => 0),
      Db.LoginHistory.findOne({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]],
      }).catch(() => null),
    ]);

    const shaped = shapeUser(user, user.profile, {
      jobs: profileId ? counts[profileId] || 0 : 0,
      totalLogins,
      lastActive: lastLogin?.createdAt ?? user.updatedAt,
    });
    return sendSuccess(res, "User detail", shaped);
  });

  suspend = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "User not found");
    const days = parseInt(req.body?.days, 10);
    const until = Number.isFinite(days) && days > 0
      ? new Date(Date.now() + days * 86_400_000)
      : null;
    await user.update({
      status: "suspended",
      suspendedUntil: until,
      suspensionReason: req.body?.reason || null,
    });
    await logAdminAction(req, {
      action: "user_suspended",
      resourceType: "user",
      resourceId: user.id,
      changes: { days: days || "indefinite", reason: req.body?.reason || null },
    });
    return sendSuccess(res, "Account suspended");
  });

  unsuspend = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "User not found");
    await user.update({
      status: "active",
      suspendedUntil: null,
      suspensionReason: null,
      bannedAt: null,
    });
    await logAdminAction(req, {
      action: "user_unsuspended",
      resourceType: "user",
      resourceId: user.id,
    });
    return sendSuccess(res, "Account reinstated");
  });

  ban = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "User not found");
    await user.update({
      bannedAt: new Date(),
      status: "suspended",
      suspensionReason: req.body?.reason || "Banned by admin",
    });
    await logAdminAction(req, {
      action: "user_banned",
      resourceType: "user",
      resourceId: user.id,
      changes: { reason: req.body?.reason || null },
    });
    return sendSuccess(res, "Account banned permanently");
  });

  remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await Db.User.findByPk(req.params.id);
    if (!user) return sendError(res, HTTP_STATUS.NOT_FOUND, "User not found");
    if (user.role === "admin") {
      return sendError(res, HTTP_STATUS.FORBIDDEN, "Cannot delete an admin account");
    }
    await logAdminAction(req, {
      action: "user_deleted",
      resourceType: "user",
      resourceId: user.id,
      changes: { email: user.email },
    });
    await user.destroy();
    return sendSuccess(res, "Account and all data deleted");
  });
}

export default new AdminUsersController();
