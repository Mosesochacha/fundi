import { Response } from "express";
import { Op } from "sequelize";
import { AuthenticatedRequest } from "../../middleware/verifyJWT";
import db from "../../models";
import { asyncHandler, sendError, sendSuccess } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import { logAdminAction } from "../../services/audit.service";
import { paginated, parseListParams, shapeJob } from "../../utils/adminShape";

const Db = db as any;

const STATUS_FILTER: Record<string, any> = {
  active: "accepted",
  completed: "completed",
  pending: "pending",
  cancelled: { [Op.in]: ["cancelled", "declined"] },
};

const profileInclude = (alias: string) => ({
  model: Db.Profile,
  as: alias,
  required: false,
  attributes: ["id", "userId", "fullName", "profession", "location"],
});

class AdminJobsController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = {};
    if (p.status && STATUS_FILTER[p.status] !== undefined)
      where.status = STATUS_FILTER[p.status];
    if (p.trade) where[Op.and] = [{ "$worker.profession$": { [Op.iLike]: p.trade } }];

    if (p.search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${p.search}%` } },
        { "$worker.fullName$": { [Op.iLike]: `%${p.search}%` } },
        { "$employer.fullName$": { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const { count, rows } = await Db.JobRequest.findAndCountAll({
      where,
      include: [profileInclude("worker"), profileInclude("employer")],
      order: [["createdAt", "DESC"]],
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
      subQuery: false,
    });

    const shaped = rows.map((j: any) => shapeJob(j, j.worker, j.employer));
    return sendSuccess(res, "Jobs", paginated(shaped, count, p.page, p.pageSize));
  });

  detail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id, {
      include: [profileInclude("worker"), profileInclude("employer")],
    });
    if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, "Job not found");

    if (job.worker) {
      const reviews = await Db.JobRequest.findAll({
        where: { workerId: job.worker.id, reviewRating: { [Op.ne]: null } },
        attributes: ["reviewRating"],
        raw: true,
      });
      const avg =
        reviews.length > 0
          ? Math.round((reviews.reduce((s: number, r: any) => s + r.reviewRating, 0) / reviews.length) * 10) / 10
          : 0;
      (job.worker as any)._rating = avg;
    }

    return sendSuccess(res, "Job detail", shapeJob(job, job.worker, job.employer));
  });

  cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id);
    if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, "Job not found");
    await job.update({ status: "cancelled" });
    await logAdminAction(req, {
      action: "job_cancelled",
      resourceType: "job",
      resourceId: job.id,
    });
    return sendSuccess(res, "Job cancelled");
  });

  flag = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id);
    if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, "Job not found");
    await logAdminAction(req, {
      action: "job_flagged",
      resourceType: "job",
      resourceId: job.id,
      changes: { note: req.body?.note || null },
    });
    return sendSuccess(res, "Job flagged for review");
  });
}

export default new AdminJobsController();
