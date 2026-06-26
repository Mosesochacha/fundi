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
  shapePayment,
  shapePayout,
} from "../../utils/adminShape";

const Db = db as any;

const nameOf = (u: any) =>
  u?.profile?.fullName ||
  [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
  "—";

const userInclude = (alias: string) => ({
  model: Db.User,
  as: alias,
  required: false,
  attributes: ["id", "firstName", "lastName"],
  include: [{ model: Db.Profile, as: "profile", attributes: ["fullName"], required: false }],
});

class AdminFinanceController {
  // ── Payments ──
  payments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = {};
    if (["completed", "pending", "refunded", "failed"].includes(p.status))
      where.status = p.status;
    if (p.search) {
      where[Op.or] = [
        { reference: { [Op.iLike]: `%${p.search}%` } },
        { "$employerUser.firstName$": { [Op.iLike]: `%${p.search}%` } },
        { "$workerUser.firstName$": { [Op.iLike]: `%${p.search}%` } },
        { "$job.title$": { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const { count, rows } = await Db.Payment.findAndCountAll({
      where,
      include: [
        userInclude("employerUser"),
        userInclude("workerUser"),
        { model: Db.JobRequest, as: "job", required: false, attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
      subQuery: false,
    });

    const shaped = rows.map((x: any) =>
      shapePayment(x, nameOf(x.employerUser), nameOf(x.workerUser), x.job?.title),
    );
    return sendSuccess(res, "Payments", paginated(shaped, count, p.page, p.pageSize));
  });

  // ── Payouts ──
  payouts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = {};
    if (["pending", "processing", "paid", "failed"].includes(p.status))
      where.status = p.status;
    if (p.search) {
      where[Op.or] = [
        { reference: { [Op.iLike]: `%${p.search}%` } },
        { "$workerUser.firstName$": { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const { count, rows } = await Db.Payout.findAndCountAll({
      where,
      include: [userInclude("workerUser")],
      order: [["createdAt", "DESC"]],
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
      subQuery: false,
    });

    const shaped = rows.map((x: any) => shapePayout(x, nameOf(x.workerUser)));
    return sendSuccess(res, "Payouts", paginated(shaped, count, p.page, p.pageSize));
  });

  markPayoutPaid = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payout = await Db.Payout.findByPk(req.params.id);
    if (!payout) return sendError(res, HTTP_STATUS.NOT_FOUND, "Payout not found");
    await payout.update({ status: "paid", processedAt: new Date() });
    await logAdminAction(req, {
      action: "payout_marked_paid",
      resourceType: "payout",
      resourceId: payout.id,
    });
    return sendSuccess(res, "Payout marked paid");
  });

  rejectPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payout = await Db.Payout.findByPk(req.params.id);
    if (!payout) return sendError(res, HTTP_STATUS.NOT_FOUND, "Payout not found");
    await payout.update({ status: "failed", processedAt: new Date() });
    await logAdminAction(req, {
      action: "payout_rejected",
      resourceType: "payout",
      resourceId: payout.id,
    });
    return sendSuccess(res, "Payout rejected");
  });

  processAllPending = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [updated] = await Db.Payout.update(
      { status: "processing" },
      { where: { status: "pending" } },
    );
    await logAdminAction(req, {
      action: "payouts_process_all",
      resourceType: "payout",
      changes: { count: updated },
    });
    return sendSuccess(res, `Processing ${updated} pending payout(s)`, { updated });
  });
}

export default new AdminFinanceController();
