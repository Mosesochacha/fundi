
type AnyRec = Record<string, any>;

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  [key: string]: unknown;
}

export function paginated<T>(
  rows: T[],
  total: number,
  page: number,
  pageSize: number,
  extras: Record<string, unknown> = {},
): Paginated<T> {
  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    ...extras,
  };
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "—";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export type AccountStatus = "active" | "suspended" | "pending" | "banned";

/** Map User (+optional worker Profile) → the frontend account status. */
export function accountStatus(user: AnyRec, profile?: AnyRec | null): AccountStatus {
  if (user.bannedAt) return "banned";
  if (user.status === "suspended") return "suspended";
  if (profile && profile.idVerificationStatus === "pending") return "pending";
  return "active";
}

const fullName = (user: AnyRec, profile?: AnyRec | null) =>
  profile?.fullName ||
  [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
  user.email ||
  "Unknown";

export interface UserExtras {
  jobs?: number;
  totalLogins?: number;
  lastActive?: Date | string | null;
  device?: string | null;
}

export function shapeUser(user: AnyRec, profile: AnyRec | null, extras: UserExtras = {}) {
  const role: "worker" | "employer" =
    user.accountType === "employer" ? "employer" : "worker";
  return {
    id: user.id,
    name: fullName(user, profile),
    email: user.email,
    phone: user.phoneNumber || profile?.phone || "—",
    role,
    trade: role === "worker" ? profile?.profession || "—" : undefined,
    location: profile?.location || "—",
    jobs: extras.jobs ?? 0,
    joined: user.createdAt,
    status: accountStatus(user, profile),
    avatarColor: role === "worker" ? "gold" : "blue",
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.isPhoneVerified,
    googleConnected: false,
    profileComplete: !!user.isProfileComplete,
    lastActive: timeAgo(extras.lastActive ?? user.updatedAt),
    totalLogins: extras.totalLogins ?? 0,
    device: extras.device ?? "—",
    about: profile?.bio || undefined,
    dailyRate: user.dailyRate ?? undefined,
    currency: user.currency || "KES",
  };
}

export interface WorkerExtras extends UserExtras {
  rating?: number;
  reviewCount?: number;
  responseRate?: number;
}

export function shapeWorker(user: AnyRec, profile: AnyRec | null, extras: WorkerExtras = {}) {
  const base = shapeUser(user, profile, extras);
  return {
    ...base,
    role: "worker" as const,
    trade: profile?.profession || "—",
    rating: extras.rating ?? 0,
    reviewCount: extras.reviewCount ?? 0,
    dailyRate: user.dailyRate ?? 0,
    verify: (profile?.idVerificationStatus || "unverified") as
      | "verified"
      | "pending"
      | "unverified"
      | "rejected",
    responseRate: extras.responseRate ?? 0,
    profileViews: profile?.views ?? 0,
    services: Array.isArray(profile?.services) ? profile.services : [],
    portfolio: Array.isArray(profile?.workPhotos) ? profile.workPhotos : [],
    certifications: Array.isArray(profile?.certifications) ? profile.certifications : [],
    experience: Array.isArray(profile?.experience) ? profile.experience : [],
    idDocUrl: profile?.idDocUrl || undefined,
    selfieUrl: profile?.selfieUrl || undefined,
    nameMatch: profile?.idSelfieMatch ?? undefined,
  };
}

export interface EmployerExtras extends UserExtras {
  totalHires?: number;
  totalSpent?: number;
  avgRatingGiven?: number;
}

export function shapeEmployer(user: AnyRec, profile: AnyRec | null, extras: EmployerExtras = {}) {
  const base = shapeUser(user, profile, extras);
  return {
    ...base,
    role: "employer" as const,
    totalHires: extras.totalHires ?? 0,
    totalSpent: extras.totalSpent ?? 0,
    avgRatingGiven: extras.avgRatingGiven ?? 0,
  };
}

const JOB_STATUS: Record<string, "pending" | "active" | "completed" | "cancelled"> = {
  pending: "pending",
  accepted: "active",
  completed: "completed",
  cancelled: "cancelled",
  declined: "cancelled",
};

export function shapeJob(job: AnyRec, workerProfile?: AnyRec | null, employerProfile?: AnyRec | null) {
  const reviewVisible = job.reviewRating != null && !job.reviewRemoved && !job.reviewHidden;
  return {
    id: job.id,
    title: job.title,
    worker: workerProfile?.fullName || "—",
    workerId: workerProfile?.userId || job.workerId,
    employer: employerProfile?.fullName || "—",
    employerId: employerProfile?.userId || job.employerId,
    trade: workerProfile?.profession || (Array.isArray(job.tags) ? job.tags[0] : "") || "—",
    location: job.location,
    date: job.scheduledAt || job.createdAt,
    status: JOB_STATUS[job.status] || "pending",
    rate: job.agreedRate ?? 0,
    currency: "KES",
    description: job.description || undefined,
    duration: job.estimatedDuration || undefined,
    timeline: [
      { step: "Request sent", at: job.createdAt ?? null },
      { step: "Accepted", at: job.status === "pending" ? null : job.updatedAt ?? null },
      { step: "Started", at: job.status === "pending" ? null : job.scheduledAt ?? null },
      { step: "Completed", at: job.completedAt ?? null },
    ],
    workerRating: workerProfile?._rating ?? undefined,
    workerTrade: workerProfile?.profession || undefined,
    review: reviewVisible
      ? { rating: job.reviewRating, text: job.reviewText || "" }
      : null,
    conversationId: Array.isArray(job.conversations) && job.conversations[0]
      ? job.conversations[0].id
      : undefined,
  };
}

export function shapeReview(job: AnyRec, workerProfile?: AnyRec | null, employerProfile?: AnyRec | null) {
  const visibility = job.reviewRemoved
    ? "removed"
    : job.reviewHidden
      ? "hidden"
      : "visible";
  return {
    id: job.id,
    worker: workerProfile?.fullName || "—",
    workerId: workerProfile?.userId || job.workerId,
    workerTrade: workerProfile?.profession || "—",
    reviewer: employerProfile?.fullName || "—",
    reviewerId: employerProfile?.userId || job.employerId,
    rating: job.reviewRating ?? 0,
    text: job.reviewText || "",
    date: job.reviewedAt || job.updatedAt,
    flagged: !!job.reviewFlagged,
    flaggedBy: job.reviewFlaggedBy || undefined,
    flagReason: job.reviewFlagReason || undefined,
    visibility: visibility as "visible" | "hidden" | "removed",
    jobRef: job.id,
  };
}

const REPORT_TYPE_LABEL: Record<string, string> = {
  fake_profile: "Fake profile",
  harassment: "Harassment",
  inappropriate_review: "Inappropriate review",
  payment_dispute: "Payment dispute",
  spam: "Spam content",
  other: "Other",
};

export interface ReportExtras {
  reportedUserPriorReports?: number;
  filedByReportsCount?: number;
}

export function shapeReport(
  report: AnyRec,
  reportedUser?: AnyRec | null,
  reportedProfile?: AnyRec | null,
  filedBy?: AnyRec | null,
  filedByProfile?: AnyRec | null,
  extras: ReportExtras = {},
) {
  return {
    id: report.id,
    type: REPORT_TYPE_LABEL[report.type] || "Other",
    severity: report.severity as "high" | "medium" | "low",
    status: report.status as "open" | "in_review" | "resolved",
    reportedUser: reportedUser ? fullName(reportedUser, reportedProfile) : "—",
    reportedUserId: report.reportedUserId,
    reportedUserRole: (reportedUser?.accountType === "employer"
      ? "employer"
      : "worker") as "worker" | "employer",
    reportedUserStatus: reportedUser
      ? accountStatus(reportedUser, reportedProfile)
      : "active",
    reportedUserPriorReports: extras.reportedUserPriorReports ?? 0,
    filedBy: filedBy ? fullName(filedBy, filedByProfile) : "Unknown",
    filedById: report.filedById || "",
    filedByReportsCount: extras.filedByReportsCount ?? 0,
    date: report.createdAt,
    description: report.description,
    evidence: Array.isArray(report.evidence) ? report.evidence : [],
    relatedContent: report.relatedContent || undefined,
    notes: Array.isArray(report.notes) ? report.notes : [],
  };
}

export function shapePayment(
  payment: AnyRec,
  employerName?: string,
  workerName?: string,
  jobTitle?: string,
) {
  return {
    id: payment.id,
    reference: payment.reference,
    employer: employerName || "—",
    worker: workerName || "—",
    job: jobTitle || "—",
    amount: payment.amount,
    fee: payment.fee,
    currency: payment.currency || "KES",
    method: payment.method,
    status: payment.status as "completed" | "pending" | "refunded" | "failed",
    date: payment.createdAt,
  };
}

export function shapePayout(payout: AnyRec, workerName?: string) {
  return {
    id: payout.id,
    reference: payout.reference,
    worker: workerName || "—",
    workerId: payout.workerId || "",
    amount: payout.amount,
    currency: payout.currency || "KES",
    method: payout.method,
    destination: payout.destination || "—",
    status: payout.status as "pending" | "processing" | "paid" | "failed",
    requested: payout.createdAt,
  };
}

export function shapeRelatedJob(job: AnyRec, profile?: AnyRec | null, role: "worker" | "employer" = "worker") {
  return {
    id: job.id,
    title: job.title,
    counterparty: profile?.fullName || "—",
    date: job.scheduledAt || job.createdAt,
    status: JOB_STATUS[job.status] || "pending",
    amount: job.agreedRate ?? 0,
    rating: job.reviewRating ?? null,
    trade: profile?.profession || (Array.isArray(job.tags) ? job.tags[0] : "") || "—",
    role,
  };
}

export function shapeRelatedReview(job: AnyRec, profile?: AnyRec | null) {
  return {
    id: job.id,
    person: profile?.fullName || "—",
    rating: job.reviewRating ?? 0,
    text: job.reviewText || "",
    date: job.reviewedAt || job.updatedAt,
  };
}

export function shapeCompactReport(report: AnyRec) {
  return {
    id: report.id,
    severity: report.severity as "high" | "medium" | "low",
    title: REPORT_TYPE_LABEL[report.type] || "Other",
    date: report.createdAt,
    status: report.status as "open" | "in_review" | "resolved",
  };
}

export function shapeTimelineEvent(event: {
  id: string;
  text: string;
  at: Date | string | null | undefined;
  tone?: "blue" | "green" | "gold" | "red" | "purple" | "neutral";
}) {
  const dot = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    gold: "bg-gold",
    red: "bg-red-500",
    purple: "bg-purple-500",
    neutral: "bg-ink-3",
  }[event.tone || "neutral"];
  return {
    id: event.id,
    text: event.text,
    when: timeAgo(event.at),
    dot,
    at: event.at,
  };
}

/** Parse common list query params. */
export function parseListParams(query: AnyRec) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize, 10) || 20));
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    search: (query.search || "").toString().trim(),
    status: (query.status || "").toString().trim(),
    role: (query.role || "").toString().trim(),
    trade: (query.trade || "").toString().trim(),
    sort: (query.sort || "").toString().trim(),
    severity: (query.severity || "").toString().trim(),
    rating: query.rating ? parseInt(query.rating, 10) : undefined,
    flagged: query.flagged === "true" || query.flagged === "1",
  };
}
