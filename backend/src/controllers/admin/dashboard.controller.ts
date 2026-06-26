import { Response } from "express";
import { Op } from "sequelize";
import { AuthenticatedRequest } from "../../middleware/verifyJWT";
import db from "../../models";
import { asyncHandler, sendSuccess } from "../../utils/helpers";
import { timeAgo } from "../../utils/adminShape";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const HEALTH = [
  { key: "api", label: "API server", state: "operational" as const },
  { key: "db", label: "Database", state: "operational" as const },
  { key: "socket", label: "Messaging (Socket.io)", state: "operational" as const },
  { key: "email", label: "Email service", state: "operational" as const },
  { key: "cloudinary", label: "Image uploads (Cloudinary)", state: "operational" as const },
  { key: "typesense", label: "Search (Typesense)", state: "operational" as const },
];

class AdminDashboardController {
  health = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    return sendSuccess(res, "Platform health", HEALTH);
  });

  dashboard = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const Db = db as any;
    const today = startOfToday();
    const monthStart = startOfMonth();

    const [
      totalUsers,
      verifiedWorkers,
      completedJobs,
      openReports,
      newToday,
      jobsToday,
      pendingVerification,
      pendingPayouts,
    ] = await Promise.all([
      Db.User.count(),
      Db.Profile.count({ where: { idVerificationStatus: "verified" } }),
      Db.JobRequest.count({ where: { status: "completed" } }),
      Db.UserReport.count({ where: { status: "open" } }),
      Db.User.count({ where: { createdAt: { [Op.gte]: today } } }),
      Db.JobRequest.count({ where: { createdAt: { [Op.gte]: today } } }),
      Db.Profile.count({ where: { idVerificationStatus: "pending" } }),
      Db.Payout.count({ where: { status: "pending" } }),
    ]);

    const monthPayments = await Db.Payment.findAll({
      where: { status: "completed", createdAt: { [Op.gte]: monthStart } },
      attributes: ["fee", "amount"],
      raw: true,
    });
    const revenue = monthPayments.reduce(
      (s: number, p: any) => s + (p.fee || 0),
      0,
    );

    const stats = [
      { key: "users", label: "Total users", number: String(totalUsers), sub: "all registered accounts", trend: `↑ ${newToday} today`, trendUp: true, accent: "gold" },
      { key: "workers", label: "Active workers", number: String(verifiedWorkers), sub: "verified fundis", trend: "", trendUp: true, accent: "blue" },
      { key: "jobs", label: "Total jobs", number: String(completedJobs), sub: "all-time completed", trend: "", trendUp: true, accent: "green" },
      { key: "reports", label: "Open reports", number: String(openReports), sub: "needs attention now", trend: openReports ? `↑ ${openReports} open` : "", trendUp: false, accent: "red" },
      { key: "revenue", label: "Platform revenue", number: `KSh ${Math.round(revenue).toLocaleString("en-US")}`, sub: "fees this month", trend: "", trendUp: true, accent: "purple" },
      { key: "new", label: "New today", number: String(newToday), sub: "registrations today", trend: "", trendUp: true, accent: "gold" },
      { key: "jobsToday", label: "Jobs today", number: String(jobsToday), sub: "job requests today", trend: "", trendUp: true, accent: "blue" },
      { key: "pendingVerify", label: "Pending verification", number: String(pendingVerification), sub: "workers awaiting ID check", accent: "green" },
    ];

    // ── Activity feed: merge recent users / jobs / reports / payments ──
    const [recentUsers, recentJobs, recentReports, recentPayments] = await Promise.all([
      Db.User.findAll({ order: [["createdAt", "DESC"]], limit: 8, include: [{ model: Db.Profile, as: "profile" }] }),
      Db.JobRequest.findAll({ where: { status: "completed" }, order: [["completedAt", "DESC"]], limit: 8 }),
      Db.UserReport.findAll({ order: [["createdAt", "DESC"]], limit: 8 }),
      Db.Payment.findAll({ where: { status: "completed" }, order: [["createdAt", "DESC"]], limit: 8 }),
    ]);

    const activity: any[] = [];
    for (const u of recentUsers) {
      const nm = u.profile?.fullName || `${u.firstName} ${u.lastName}`.trim();
      activity.push({
        id: `u-${u.id}`,
        type: "user_registered",
        text: `${nm} registered as ${u.accountType === "employer" ? "an employer" : "a worker"}`,
        _at: u.createdAt,
        time: timeAgo(u.createdAt),
      });
    }
    for (const j of recentJobs) {
      activity.push({ id: `j-${j.id}`, type: "job_completed", text: `Job "${j.title}" marked completed`, _at: j.completedAt || j.updatedAt, time: timeAgo(j.completedAt || j.updatedAt) });
    }
    for (const r of recentReports) {
      activity.push({ id: `r-${r.id}`, type: "report_filed", text: `New ${String(r.type).replace(/_/g, " ")} report filed`, _at: r.createdAt, time: timeAgo(r.createdAt) });
    }
    for (const p of recentPayments) {
      activity.push({ id: `p-${p.id}`, type: "payment_received", text: `KSh ${(p.amount || 0).toLocaleString("en-US")} payment received`, _at: p.createdAt, time: timeAgo(p.createdAt) });
    }
    activity.sort((a, b) => +new Date(b._at) - +new Date(a._at));
    const activityOut = activity.slice(0, 20).map(({ _at, ...rest }) => rest);

    // ── Top open reports ──
    const openReportRows = await Db.UserReport.findAll({
      where: { status: "open" },
      order: [["createdAt", "DESC"]],
      limit: 5,
      include: [
        { model: Db.User, as: "reportedUser", include: [{ model: Db.Profile, as: "profile" }] },
        { model: Db.User, as: "filedByUser", include: [{ model: Db.Profile, as: "profile" }] },
      ],
    });
    const reports = openReportRows.map((r: any) => {
      const reported = r.reportedUser?.profile?.fullName || r.reportedUser?.firstName || "user";
      const reporter = r.filedByUser?.profile?.fullName || r.filedByUser?.firstName || "Unknown";
      return {
        id: r.id,
        severity: r.severity,
        title: `${String(r.type).replace(/_/g, " ")} — ${reported}`,
        reporter,
        time: timeAgo(r.createdAt),
        status: r.status,
      };
    });

    // ── New registrations ──
    const newUsers = recentUsers.slice(0, 5).map((u: any) => {
      const nm = u.profile?.fullName || `${u.firstName} ${u.lastName}`.trim();
      const role = u.accountType === "employer" ? "employer" : "worker";
      return {
        id: u.id,
        name: nm,
        initials: initialsOf(nm),
        role,
        meta: role === "worker" ? `${u.profile?.profession || "Worker"} · ${u.profile?.location || "—"}` : u.profile?.location || "—",
        time: timeAgo(u.createdAt),
      };
    });

    return sendSuccess(res, "Admin dashboard", {
      stats,
      activity: activityOut,
      reports,
      newUsers,
      quick: { pendingVerification, openReports, pendingPayouts },
      health: HEALTH,
    });
  });

  badges = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const Db = db as any;
    const [openReports, pendingPayouts] = await Promise.all([
      Db.UserReport.count({ where: { status: "open" } }),
      Db.Payout.count({ where: { status: "pending" } }),
    ]);
    return sendSuccess(res, "Admin badges", { openReports, pendingPayouts });
  });
}

export default new AdminDashboardController();
