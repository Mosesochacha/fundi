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
  shapeEmployer,
  shapeRelatedJob,
  shapeRelatedReview,
} from "../../utils/adminShape";

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

    const profileId = user.profile?.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      jobAggs,
      spend,
      hireRows,
      reviewRows,
      reportsAgainst,
      reportsFiled,
      totalLogins,
      successfulLogins,
      recentLogins,
      profileViews,
      postCount,
      followerCount,
      followingCount,
      jobRowsForStats,
    ] = await Promise.all([
      user.profile ? employerJobAggs([user.profile.id]) : Promise.resolve({}),
      employerSpend([user.id]),
      user.profile
        ? Db.JobRequest.findAll({
            where: { employerId: user.profile.id },
            include: [{ model: Db.Profile, as: "worker", required: false, attributes: ["id", "fullName", "profession"] }],
            order: [["createdAt", "DESC"]],
            limit: 10,
          })
        : Promise.resolve([]),
      user.profile
        ? Db.JobRequest.findAll({
            where: { employerId: user.profile.id, reviewRating: { [Op.ne]: null } },
            include: [{ model: Db.Profile, as: "worker", required: false, attributes: ["id", "fullName", "profession"] }],
            order: [["reviewedAt", "DESC"]],
            limit: 5,
          })
        : Promise.resolve([]),
      Db.UserReport.findAll({
        where: { reportedUserId: user.id },
        order: [["createdAt", "DESC"]],
        limit: 5,
        raw: true,
      }),
      Db.UserReport.findAll({
        where: { filedById: user.id },
        order: [["createdAt", "DESC"]],
        limit: 5,
        raw: true,
      }),
      Db.LoginHistory.count({ where: { userId: user.id } }).catch(() => 0),
      Db.LoginHistory.count({ where: { userId: user.id, status: "success" } }).catch(() => 0),
      Db.LoginHistory.findAll({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]],
        limit: 6,
        raw: true,
        attributes: ["id", "ipAddress", "userAgent", "city", "country", "status", "createdAt"],
      }).catch(() => []),
      profileId
        ? Db.ProfileView.count({ where: { profileId } }).catch(() => user.profile?.views ?? 0)
        : Promise.resolve(0),
      profileId ? Db.Post.count({ where: { authorId: profileId } }).catch(() => 0) : Promise.resolve(0),
      profileId ? Db.Follow.count({ where: { followingId: profileId } }).catch(() => 0) : Promise.resolve(0),
      profileId ? Db.Follow.count({ where: { followerId: profileId } }).catch(() => 0) : Promise.resolve(0),
      profileId
        ? Db.JobRequest.findAll({
            where: { employerId: profileId },
            attributes: ["status", "createdAt", "updatedAt"],
            raw: true,
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const jobStats = (jobRowsForStats as any[]).reduce(
      (acc, job) => {
        acc.totalRequests += 1;
        if (job.status === "pending") acc.pending += 1;
        else if (job.status === "accepted") acc.active += 1;
        else if (job.status === "completed") acc.completed += 1;
        else if (job.status === "cancelled" || job.status === "declined") acc.cancelled += 1;
        if (new Date(job.createdAt) >= thirtyDaysAgo) acc.createdLast30Days += 1;
        return acc;
      },
      { totalRequests: 0, pending: 0, active: 0, completed: 0, cancelled: 0, createdLast30Days: 0 },
    );

    const shaped = shapeEmployer(
      user,
      user.profile,
      {
        ...extrasFrom(user.profile ? (jobAggs as any)[user.profile.id] : undefined, spend[user.id]),
        totalLogins,
        lastActive: recentLogins?.[0]?.createdAt ?? user.lastLoginAt ?? user.updatedAt,
        device: recentLogins?.[0]?.userAgent ?? "—",
      },
    );
    return sendSuccess(res, "Employer detail", {
      ...shaped,
      account: {
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.isPhoneVerified,
        profileComplete: !!user.isProfileComplete,
        onboarded: !!user.isOnboarded,
        onboardingCompletedAt: user.onboardingCompletedAt,
        isActive: !!user.isActive,
        status: user.status,
        bannedAt: user.bannedAt,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason,
        termsAccepted: !!user.termsAccepted,
        termsAcceptedAt: user.termsAcceptedAt,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: user.profile
        ? {
            id: user.profile.id,
            username: user.profile.username,
            fullName: user.profile.fullName,
            profession: user.profile.profession,
            location: user.profile.location,
            bio: user.profile.bio,
            tagline: user.profile.tagline,
            phone: user.profile.phone,
            avatarUrl: user.profile.avatarUrl,
            bannerUrl: user.profile.bannerUrl,
            services: Array.isArray(user.profile.services) ? user.profile.services : [],
            serviceAreas: Array.isArray(user.profile.serviceAreas) ? user.profile.serviceAreas : [],
            country: user.profile.country,
            timezone: user.profile.timezone,
            language: user.profile.language,
            profilePublic: !!user.profile.profilePublic,
            showPhone: !!user.profile.showPhone,
            showEmail: !!user.profile.showEmail,
            allowDirectMessages: !!user.profile.allowDirectMessages,
            allowFollowers: !!user.profile.allowFollowers,
            views: user.profile.views ?? 0,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      activityStats: {
        totalLogins,
        successfulLogins,
        failedLogins: Math.max(0, totalLogins - successfulLogins),
        profileViews,
        posts: postCount,
        followers: followerCount,
        following: followingCount,
        lastLoginAt: recentLogins?.find((l: any) => l.status === "success")?.createdAt ?? user.lastLoginAt ?? null,
        lastLoginIp: recentLogins?.find((l: any) => l.status === "success")?.ipAddress ?? null,
        lastLoginDevice: recentLogins?.find((l: any) => l.status === "success")?.userAgent ?? null,
      },
      jobStats,
      recentLogins,
      hires: hireRows.map((j: any) => shapeRelatedJob(j, j.worker, "worker")),
      reviewsGiven: reviewRows.map((j: any) => shapeRelatedReview(j, j.worker)),
      reportsAgainst: reportsAgainst.map(shapeCompactReport),
      reportsFiled: reportsFiled.map(shapeCompactReport),
    });
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
