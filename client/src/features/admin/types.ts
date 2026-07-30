export type UserRole = "worker" | "employer";
export type AccountStatus = "active" | "suspended" | "pending" | "banned";
export type VerifyStatus = "verified" | "pending" | "unverified" | "rejected";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  /** Worker trade or employer location, for the table summary column. */
  trade?: string;
  location: string;
  jobs: number;
  joined: string;
  status: AccountStatus;
  avatarColor?: "gold" | "blue";
  emailVerified: boolean;
  phoneVerified: boolean;
  googleConnected: boolean;
  profileComplete: boolean;
  lastActive: string;
  totalLogins: number;
  device: string;
  about?: string;
  dailyRate?: number;
  currency: string;
  timeline?: TimelineEvent[];
  jobsHistory?: AdminRelatedJob[];
  reportsAgainst?: AdminCompactReport[];
  reportsFiled?: AdminCompactReport[];
  reviewStats?: AdminReviewStats;
}

export interface AdminWorker extends AdminUser {
  role: "worker";
  trade: string;
  rating: number;
  reviewCount: number;
  dailyRate: number;
  verify: VerifyStatus;
  responseRate: number;
  profileViews: number;
  services: string[];
  portfolio: string[];
  certifications: { name: string; issuer: string; year: number }[];
  experience: { title: string; org: string; period: string }[];
  idDocUrl?: string;
  selfieUrl?: string;
  nameMatch?: boolean;
  jobHistory?: AdminRelatedJob[];
  reviews?: AdminRelatedReview[];
  reports?: AdminCompactReport[];
}

export interface AdminEmployer extends AdminUser {
  role: "employer";
  totalHires: number;
  totalSpent: number;
  avgRatingGiven: number;
  account?: {
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    profileComplete: boolean;
    onboarded: boolean;
    onboardingCompletedAt: string | null;
    isActive: boolean;
    status: string;
    bannedAt: string | null;
    suspendedUntil: string | null;
    suspensionReason: string | null;
    termsAccepted: boolean;
    termsAcceptedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  profile?: {
    id: string;
    username: string;
    fullName: string;
    profession: string;
    location: string;
    bio: string | null;
    tagline: string | null;
    phone: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    services: string[];
    serviceAreas: string[];
    country: string;
    timezone: string;
    language: string;
    profilePublic: boolean;
    showPhone: boolean;
    showEmail: boolean;
    allowDirectMessages: boolean;
    allowFollowers: boolean;
    views: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  activityStats?: {
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    profileViews: number;
    posts: number;
    followers: number;
    following: number;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
    lastLoginDevice: string | null;
  };
  jobStats?: {
    totalRequests: number;
    pending: number;
    active: number;
    completed: number;
    cancelled: number;
    createdLast30Days: number;
  };
  recentLogins?: {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    city: string | null;
    country: string | null;
    status: "success" | "failed";
    createdAt: string;
  }[];
  hires?: AdminRelatedJob[];
  reviewsGiven?: AdminRelatedReview[];
  reportsAgainst?: AdminCompactReport[];
  reportsFiled?: AdminCompactReport[];
}

export type JobStatus = "pending" | "active" | "completed" | "cancelled";

export interface AdminJob {
  id: string;
  title: string;
  worker: string;
  workerId: string;
  employer: string;
  employerId: string;
  trade: string;
  location: string;
  date: string;
  status: JobStatus;
  rate: number;
  currency: string;
  description?: string;
  duration?: string;
  timeline?: { step: string; at: string | null }[];
  workerRating?: number;
  workerTrade?: string;
  review?: { rating: number; text: string } | null;
  conversationId?: string;
}

export type ReviewVisibility = "visible" | "hidden" | "removed";

export interface AdminReview {
  id: string;
  worker: string;
  workerId: string;
  workerTrade: string;
  reviewer: string;
  reviewerId: string;
  rating: number;
  text: string;
  date: string;
  flagged: boolean;
  flaggedBy?: string;
  flagReason?: string;
  visibility: ReviewVisibility;
  jobRef?: string;
}

export type ReportSeverity = "high" | "medium" | "low";
export type ReportStatus = "open" | "in_review" | "resolved";
export type ReportType =
  | "Fake profile"
  | "Harassment"
  | "Inappropriate review"
  | "Payment dispute"
  | "Spam content"
  | "Other";

export interface ReportNote {
  id: string;
  admin: string;
  at: string;
  text: string;
}

export interface AdminReport {
  id: string;
  type: ReportType;
  severity: ReportSeverity;
  status: ReportStatus;
  reportedUser: string;
  reportedUserId: string;
  reportedUserRole: UserRole;
  reportedUserStatus: AccountStatus;
  reportedUserPriorReports: number;
  filedBy: string;
  filedById: string;
  filedByReportsCount: number;
  date: string;
  description: string;
  evidence?: string[];
  relatedContent?: string;
  notes: ReportNote[];
}

export type PaymentStatus = "completed" | "pending" | "refunded" | "failed";

export interface AdminPayment {
  id: string;
  reference: string;
  employer: string;
  worker: string;
  job: string;
  amount: number;
  fee: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  date: string;
}

export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export interface AdminPayout {
  id: string;
  reference: string;
  worker: string;
  workerId: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  status: PayoutStatus;
  requested: string;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminPaymentsData extends Paginated<AdminPayment> {
  stats: {
    totalProcessed: number;
    platformFees: number;
    refunded: number;
    pending: number;
  };
}

export interface AdminRelatedJob {
  id: string;
  title: string;
  counterparty: string;
  date: string;
  status: JobStatus;
  amount: number;
  rating: number | null;
  trade: string;
  role: UserRole;
}

export interface AdminRelatedReview {
  id: string;
  person: string;
  rating: number;
  text: string;
  date: string;
}

export interface AdminCompactReport {
  id: string;
  severity: ReportSeverity;
  title: string;
  date: string;
  status: ReportStatus;
}

export interface TimelineEvent {
  id: string;
  text: string;
  when: string;
  dot: string;
}

export interface AdminReviewStats {
  averageReceived: number;
  received: number;
  given: number;
}

export interface DashboardStat {
  key: string;
  label: string;
  number: string;
  sub: string;
  trend?: string;
  trendUp?: boolean;
  accent: "gold" | "blue" | "green" | "red" | "purple";
}

export type ActivityType =
  | "user_registered"
  | "report_filed"
  | "worker_verified"
  | "review_flagged"
  | "account_suspended"
  | "job_completed"
  | "payment_received";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  text: string;
  time: string;
}

export interface DashboardReport {
  id: string;
  severity: ReportSeverity;
  title: string;
  reporter: string;
  time: string;
  status: ReportStatus;
}

export interface DashboardNewUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  meta: string;
  time: string;
}

export type HealthState = "operational" | "degraded" | "down";
export interface HealthService {
  key: string;
  label: string;
  state: HealthState;
}

export interface DashboardData {
  stats: DashboardStat[];
  activity: ActivityEvent[];
  reports: DashboardReport[];
  newUsers: DashboardNewUser[];
  quick: {
    pendingVerification: number;
    openReports: number;
    pendingPayouts: number;
  };
  health: HealthService[];
  activeUsers?: {
    today: number;
    weekly: number;
    monthly: number;
    inactive30Days: number;
    totalUsers: number;
    byRole: {
      workers: number;
      employers: number;
    };
    series: { date: string; count: number }[];
  };
}

export interface AdminBadges {
  openReports: number;
  pendingPayouts: number;
}

export interface AdminSettings {
  general: {
    platformName: string;
    supportEmail: string;
    contactPhone: string;
    launchDate: string;
    maintenanceMode: boolean;
    registrationsOpen: boolean;
  };
  commission: {
    transactionFeePct: number;
    workerSubscription: number;
    featuredListing: number;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  verification: {
    requireId: boolean;
    requirePhone: boolean;
    minProfileStrength: number;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}
