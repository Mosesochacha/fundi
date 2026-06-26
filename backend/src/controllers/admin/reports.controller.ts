import { Response } from "express";
import { Op } from "sequelize";
import { randomUUID } from "crypto";
import { AuthenticatedRequest } from "../../middleware/verifyJWT";
import db from "../../models";
import { asyncHandler, sendError, sendSuccess } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import { logAdminAction } from "../../services/audit.service";
import { paginated, parseListParams, shapeReport } from "../../utils/adminShape";

const Db = db as any;
const SEV_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const userInclude = (alias: string) => ({
  model: Db.User,
  as: alias,
  required: false,
  attributes: ["id", "firstName", "lastName", "email", "accountType", "status", "bannedAt"],
  include: [{ model: Db.Profile, as: "profile", attributes: ["fullName", "location", "idVerificationStatus"], required: false }],
});

class AdminReportsController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = {};
    if (["open", "in_review", "resolved"].includes(p.status)) where.status = p.status;
    if (["high", "medium", "low"].includes(p.severity)) where.severity = p.severity;
    if (p.search) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${p.search}%` } },
        { "$reportedUser.firstName$": { [Op.iLike]: `%${p.search}%` } },
        { "$reportedUser.lastName$": { [Op.iLike]: `%${p.search}%` } },
        { "$filedByUser.firstName$": { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const order: any =
      p.sort === "oldest" ? [["createdAt", "ASC"]] : [["createdAt", "DESC"]];

    const { count, rows } = await Db.UserReport.findAndCountAll({
      where,
      include: [userInclude("reportedUser"), userInclude("filedByUser")],
      order,
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
      subQuery: false,
    });

    let shaped = rows.map((r: any) =>
      shapeReport(r, r.reportedUser, r.reportedUser?.profile, r.filedByUser, r.filedByUser?.profile),
    );
    if (p.sort === "severity")
      shaped = shaped.sort((a: any, b: any) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

    return sendSuccess(res, "Reports", paginated(shaped, count, p.page, p.pageSize));
  });

  detail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await Db.UserReport.findByPk(req.params.id, {
      include: [userInclude("reportedUser"), userInclude("filedByUser")],
    });
    if (!report) return sendError(res, HTTP_STATUS.NOT_FOUND, "Report not found");

    const [priorReports, filedCount] = await Promise.all([
      Db.UserReport.count({
        where: { reportedUserId: report.reportedUserId, id: { [Op.ne]: report.id } },
      }),
      report.filedById
        ? Db.UserReport.count({ where: { filedById: report.filedById } })
        : Promise.resolve(0),
    ]);

    const shaped = shapeReport(
      report,
      report.reportedUser,
      report.reportedUser?.profile,
      report.filedByUser,
      report.filedByUser?.profile,
      { reportedUserPriorReports: priorReports, filedByReportsCount: filedCount },
    );
    return sendSuccess(res, "Report detail", shaped);
  });

  addNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await Db.UserReport.findByPk(req.params.id);
    if (!report) return sendError(res, HTTP_STATUS.NOT_FOUND, "Report not found");
    const text = (req.body?.text || "").toString().trim();
    if (!text) return sendError(res, HTTP_STATUS.BAD_REQUEST, "Note text is required");

    const admin = await Db.User.findByPk(req.user?.id);
    const adminName = admin
      ? `${admin.firstName} ${admin.lastName}`.trim() || "Admin"
      : "Admin";
    const note = { id: randomUUID(), admin: adminName, at: new Date().toISOString(), text };
    const notes = Array.isArray(report.notes) ? [...report.notes, note] : [note];
    await report.update({ notes });

    await logAdminAction(req, {
      action: "report_note_added",
      resourceType: "report",
      resourceId: report.id,
    });
    return sendSuccess(res, "Note added", { note, notes });
  });

  resolve = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const report = await Db.UserReport.findByPk(req.params.id);
    if (!report) return sendError(res, HTTP_STATUS.NOT_FOUND, "Report not found");

    const { action, resolution, notifyReporter, status } = req.body || {};
    const nextStatus = ["open", "in_review", "resolved"].includes(status)
      ? status
      : "resolved";

    await report.update({
      status: nextStatus,
      resolution: resolution || null,
      resolutionAction: action || "none",
      resolvedAt: nextStatus === "resolved" ? new Date() : null,
    });

    // Apply the chosen penalty to the reported user.
    const reported = await Db.User.findByPk(report.reportedUserId);
    if (reported) {
      if (action === "suspended_7" || action === "suspended_30") {
        const days = action === "suspended_7" ? 7 : 30;
        await reported.update({
          status: "suspended",
          suspendedUntil: new Date(Date.now() + days * 86_400_000),
          suspensionReason: `Report resolution: ${resolution || action}`,
        });
      } else if (action === "banned") {
        await reported.update({
          status: "suspended",
          bannedAt: new Date(),
          suspensionReason: `Report resolution: ${resolution || "banned"}`,
        });
      }
    }

    await logAdminAction(req, {
      action: "report_resolved",
      resourceType: "report",
      resourceId: report.id,
      changes: { action, status: nextStatus, notifyReporter: !!notifyReporter },
    });
    return sendSuccess(res, "Resolution submitted");
  });
}

export default new AdminReportsController();
