import { Response } from "express";
import { Op } from "sequelize";
import { AuthenticatedRequest } from "../../middleware/verifyJWT";
import db from "../../models";
import { asyncHandler, sendError, sendSuccess } from "../../utils/helpers";
import { HTTP_STATUS } from "../../utils/constants";
import { logAdminAction } from "../../services/audit.service";
import { paginated, parseListParams, shapeReview } from "../../utils/adminShape";

const Db = db as any;

const profileInclude = (alias: string) => ({
  model: Db.Profile,
  as: alias,
  required: false,
  attributes: ["id", "userId", "fullName", "profession", "location"],
});

class AdminReviewsController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const p = parseListParams(req.query);
    const where: any = { reviewRating: { [Op.ne]: null } };
    if (p.flagged) where.reviewFlagged = true;
    if (p.rating) where.reviewRating = p.rating;
    if (p.search) {
      where[Op.or] = [
        { "$worker.fullName$": { [Op.iLike]: `%${p.search}%` } },
        { "$employer.fullName$": { [Op.iLike]: `%${p.search}%` } },
      ];
    }

    const order: any =
      p.sort === "lowest"
        ? [["reviewRating", "ASC"]]
        : [["reviewedAt", "DESC"]];

    const { count, rows } = await Db.JobRequest.findAndCountAll({
      where,
      include: [profileInclude("worker"), profileInclude("employer")],
      order,
      offset: p.offset,
      limit: p.pageSize,
      distinct: true,
      subQuery: false,
    });

    const shaped = rows.map((j: any) => shapeReview(j, j.worker, j.employer));
    return sendSuccess(res, "Reviews", paginated(shaped, count, p.page, p.pageSize));
  });

  detail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id, {
      include: [profileInclude("worker"), profileInclude("employer")],
    });
    if (!job || job.reviewRating == null)
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Review not found");
    return sendSuccess(res, "Review detail", shapeReview(job, job.worker, job.employer));
  });

  hide = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id);
    if (!job || job.reviewRating == null)
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Review not found");
    await job.update({ reviewHidden: true });
    await logAdminAction(req, {
      action: "review_hidden",
      resourceType: "review",
      resourceId: job.id,
    });
    return sendSuccess(res, "Review hidden");
  });

  keep = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id);
    if (!job || job.reviewRating == null)
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Review not found");
    await job.update({ reviewHidden: false, reviewRemoved: false, reviewFlagged: false });
    await logAdminAction(req, {
      action: "review_kept",
      resourceType: "review",
      resourceId: job.id,
    });
    return sendSuccess(res, "Review kept and marked reviewed");
  });

  remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id);
    if (!job || job.reviewRating == null)
      return sendError(res, HTTP_STATUS.NOT_FOUND, "Review not found");
    await job.update({ reviewRemoved: true });
    await logAdminAction(req, {
      action: "review_removed",
      resourceType: "review",
      resourceId: job.id,
    });
    return sendSuccess(res, "Review removed");
  });

  warn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const job = await Db.JobRequest.findByPk(req.params.id);
    if (!job) return sendError(res, HTTP_STATUS.NOT_FOUND, "Review not found");
    await logAdminAction(req, {
      action: "reviewer_warned",
      resourceType: "review",
      resourceId: job.id,
      changes: { reason: req.body?.reason || null },
    });
    return sendSuccess(res, "Warning sent to reviewer");
  });
}

export default new AdminReviewsController();
