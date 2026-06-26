import type {
  AdminEmployer,
  AdminJob,
  AdminPayment,
  AdminPayout,
  AdminReport,
  AdminReview,
  AdminSettings,
  AdminUser,
  AdminWorker,
  DashboardData,
  EmailTemplate,
} from "./types";

const FIRST = [
  "Amina",
  "Brian",
  "Carol",
  "David",
  "Esther",
  "Felix",
  "Grace",
  "Hassan",
  "Irene",
  "James",
  "Kevin",
  "Lydia",
  "Mercy",
  "Noah",
  "Olivia",
  "Peter",
  "Quincy",
  "Ruth",
  "Samuel",
  "Tabitha",
  "Umar",
  "Violet",
  "Wycliffe",
  "Yvonne",
];
const LAST = [
  "Otieno",
  "Mwangi",
  "Achieng",
  "Kamau",
  "Wanjiku",
  "Omondi",
  "Njoroge",
  "Abdi",
  "Cheruiyot",
  "Mutua",
  "Kiplagat",
  "Were",
  "Barasa",
  "Maina",
  "Chebet",
  "Kibet",
  "Oduya",
  "Njuguna",
  "Wekesa",
  "Auma",
];
const TRADES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Mason",
  "Painter",
  "Welder",
  "Mechanic",
  "Tiler",
  "Roofer",
  "Gardener",
  "Cleaner",
  "Tailor",
];
const LOCATIONS = [
  "Nairobi, KE",
  "Mombasa, KE",
  "Kisumu, KE",
  "Nakuru, KE",
  "Eldoret, KE",
  "Thika, KE",
  "Lagos, NG",
  "Accra, GH",
  "Kampala, UG",
  "Dar es Salaam, TZ",
];
const JOB_TITLES = [
  "Kitchen sink installation",
  "Rewire two-bedroom flat",
  "Build garden deck",
  "Bathroom retiling",
  "Exterior house painting",
  "Gate welding repair",
  "Engine diagnostics",
  "Roof leak fixing",
  "Fence construction",
  "Office deep clean",
  "Wardrobe carpentry",
  "Ceiling board fitting",
];

const pick = <T>(arr: readonly T[], i: number): T => arr[i % arr.length];
const name = (i: number) => `${pick(FIRST, i)} ${pick(LAST, i * 3 + 1)}`;
export const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

const BASE = new Date("2026-06-26T10:00:00Z").getTime();
const isoDaysAgo = (d: number) => new Date(BASE - d * 86_400_000).toISOString();

const slug = (n: string) => n.toLowerCase().replace(/[^a-z]+/g, "-");

export const WORKERS: AdminWorker[] = Array.from({ length: 64 }, (_, i) => {
  const n = name(i);
  const verify =
    i % 5 === 0 ? "pending" : i % 7 === 0 ? "unverified" : "verified";
  const status =
    i % 11 === 0 ? "suspended" : verify === "pending" ? "pending" : "active";
  const trade = pick(TRADES, i);
  return {
    id: `usr_w${100 + i}`,
    name: n,
    email: `${slug(n)}@mail.com`,
    phone: `+2547${String(10_000_000 + i * 13_577).slice(0, 8)}`,
    role: "worker",
    trade,
    location: pick(LOCATIONS, i * 2),
    jobs: (i * 7) % 48,
    joined: isoDaysAgo(i * 3 + 2),
    status,
    avatarColor: "gold",
    emailVerified: i % 4 !== 0,
    phoneVerified: i % 3 !== 0,
    googleConnected: i % 2 === 0,
    profileComplete: verify === "verified",
    lastActive: i % 6 === 0 ? "3 days ago" : `${(i % 23) + 1}h ago`,
    totalLogins: 20 + ((i * 17) % 480),
    device: i % 2 === 0 ? "Android · Chrome" : "iOS · Safari",
    about: `Experienced ${trade.toLowerCase()} with a strong track record of reliable, on-time work across ${pick(LOCATIONS, i).split(",")[0]}.`,
    dailyRate: 1500 + ((i * 350) % 6000),
    currency: pick(LOCATIONS, i * 2).endsWith("NG")
      ? "NGN"
      : pick(LOCATIONS, i * 2).endsWith("GH")
        ? "GHS"
        : "KES",
    rating: 3.5 + ((i * 3) % 15) / 10,
    reviewCount: (i * 5) % 60,
    verify,
    responseRate: 70 + ((i * 7) % 30),
    profileViews: 50 + ((i * 41) % 2000),
    services: [trade, pick(TRADES, i + 4), pick(TRADES, i + 7)],
    portfolio: Array.from({ length: (i % 4) + 2 }, (_, k) => `photo-${i}-${k}`),
    certifications: [
      { name: `${trade} Level 2`, issuer: "NITA", year: 2022 + (i % 3) },
    ],
    experience: [
      { title: `Senior ${trade}`, org: "BuildCo", period: "2021 – Present" },
      { title: trade, org: "FixIt Ltd", period: "2018 – 2021" },
    ],
    idDocUrl: verify !== "unverified" ? `id-${i}` : undefined,
    selfieUrl: verify !== "unverified" ? `selfie-${i}` : undefined,
    nameMatch: i % 9 !== 0,
  };
});

export const EMPLOYERS: AdminEmployer[] = Array.from({ length: 38 }, (_, i) => {
  const n = name(i + 31);
  const status = i % 13 === 0 ? "suspended" : "active";
  return {
    id: `usr_e${200 + i}`,
    name: n,
    email: `${slug(n)}@company.com`,
    phone: `+2547${String(20_000_000 + i * 21_111).slice(0, 8)}`,
    role: "employer",
    location: pick(LOCATIONS, i * 3 + 1),
    jobs: (i * 4) % 30,
    joined: isoDaysAgo(i * 4 + 1),
    status,
    avatarColor: "blue",
    emailVerified: i % 3 !== 0,
    phoneVerified: i % 2 === 0,
    googleConnected: i % 2 !== 0,
    profileComplete: i % 5 !== 0,
    lastActive: `${(i % 12) + 1}h ago`,
    totalLogins: 10 + ((i * 11) % 200),
    device: i % 2 === 0 ? "Desktop · Chrome" : "Android · Chrome",
    about: "Property manager hiring skilled tradespeople for recurring jobs.",
    currency: "KES",
    totalHires: (i * 3) % 40,
    totalSpent: 4000 + ((i * 2350) % 90_000),
    avgRatingGiven: 3.6 + ((i * 4) % 14) / 10,
  };
});

export const USERS: AdminUser[] = [...WORKERS, ...EMPLOYERS].sort(
  (a, b) => +new Date(b.joined) - +new Date(a.joined),
);

const JOB_STATUSES = ["completed", "active", "cancelled", "pending"] as const;
export const JOBS: AdminJob[] = Array.from({ length: 56 }, (_, i) => {
  const worker = pick(WORKERS, i);
  const employer = pick(EMPLOYERS, i * 2);
  const status = pick(JOB_STATUSES, i);
  const completed = status === "completed";
  return {
    id: `job_${300 + i}`,
    title: pick(JOB_TITLES, i),
    worker: worker.name,
    workerId: worker.id,
    employer: employer.name,
    employerId: employer.id,
    trade: worker.trade,
    location: employer.location,
    date: isoDaysAgo(i * 2),
    status,
    rate: 2000 + ((i * 450) % 12_000),
    currency: "KES",
    description: `${pick(JOB_TITLES, i)} — full scope agreed with the client including materials and clean-up.`,
    duration: `${(i % 5) + 1} day(s)`,
    timeline: [
      { step: "Request sent", at: isoDaysAgo(i * 2 + 6) },
      { step: "Accepted", at: isoDaysAgo(i * 2 + 5) },
      {
        step: "Started",
        at: status === "pending" ? null : isoDaysAgo(i * 2 + 3),
      },
      { step: "Completed", at: completed ? isoDaysAgo(i * 2) : null },
    ],
    workerRating: worker.rating,
    workerTrade: worker.trade,
    review: completed
      ? { rating: 4 + (i % 2), text: "Great work, very professional and tidy." }
      : null,
  };
});

export const REVIEWS: AdminReview[] = Array.from({ length: 48 }, (_, i) => {
  const worker = pick(WORKERS, i * 2);
  const reviewer = pick(EMPLOYERS, i);
  const flagged = i % 6 === 0;
  return {
    id: `rev_${400 + i}`,
    worker: worker.name,
    workerId: worker.id,
    workerTrade: worker.trade,
    reviewer: reviewer.name,
    reviewerId: reviewer.id,
    rating: 1 + (i % 5),
    text:
      i % 6 === 0
        ? "Terrible experience, never showed up and was rude on the phone. Avoid."
        : "Showed up on time, did a clean job and explained everything clearly. Recommended.",
    date: isoDaysAgo(i * 2 + 1),
    flagged,
    flaggedBy: flagged ? reviewer.name : undefined,
    flagReason: flagged ? "Abusive language / possibly fake" : undefined,
    visibility: i % 17 === 0 ? "hidden" : "visible",
    jobRef: `job_${300 + (i % 56)}`,
  };
});

const R_TYPES = [
  "Fake profile",
  "Harassment",
  "Inappropriate review",
  "Payment dispute",
  "Spam content",
  "Other",
] as const;
const R_SEV = ["high", "medium", "low"] as const;
const R_STATUS = ["open", "in_review", "resolved"] as const;
export const REPORTS: AdminReport[] = Array.from({ length: 27 }, (_, i) => {
  const reported = pick(USERS, i * 3);
  const reporter = pick(USERS, i * 5 + 2);
  return {
    id: `rpt_${500 + i}`,
    type: pick([...R_TYPES], i),
    severity: pick([...R_SEV], i),
    status: pick([...R_STATUS], i),
    reportedUser: reported.name,
    reportedUserId: reported.id,
    reportedUserRole: reported.role,
    reportedUserStatus: reported.status,
    reportedUserPriorReports: i % 4,
    filedBy: reporter.name,
    filedById: reporter.id,
    filedByReportsCount: (i % 3) + 1,
    date: isoDaysAgo(i + 1),
    description:
      "The user repeatedly sent unsolicited messages and used abusive language after the job was declined. Screenshots attached for review.",
    evidence: i % 2 === 0 ? ["screenshot-1", "screenshot-2"] : [],
    relatedContent: `Conversation thread with ${reported.name}`,
    notes:
      i % 3 === 0
        ? [
            {
              id: `note_${i}`,
              admin: "Moses O.",
              at: isoDaysAgo(i),
              text: "Reached out to both parties for clarification.",
            },
          ]
        : [],
  };
});

const P_STATUS = ["completed", "pending", "refunded", "failed"] as const;
export const PAYMENTS: AdminPayment[] = Array.from({ length: 44 }, (_, i) => {
  const employer = pick(EMPLOYERS, i);
  const worker = pick(WORKERS, i * 2);
  const amount = 2000 + ((i * 530) % 14_000);
  return {
    id: `pay_${600 + i}`,
    reference: `TX${String(80_421 + i * 37)}`,
    employer: employer.name,
    worker: worker.name,
    job: pick(JOB_TITLES, i),
    amount,
    fee: Math.round(amount * 0.1),
    currency: "KES",
    method: i % 2 === 0 ? "M-Pesa" : "Card",
    status: pick([...P_STATUS], i),
    date: isoDaysAgo(i),
  };
});

const PO_STATUS = ["pending", "processing", "paid", "failed"] as const;
export const PAYOUTS: AdminPayout[] = Array.from({ length: 31 }, (_, i) => {
  const worker = pick(WORKERS, i * 3);
  return {
    id: `po_${700 + i}`,
    reference: `PO${String(50_120 + i * 19)}`,
    worker: worker.name,
    workerId: worker.id,
    amount: 1800 + ((i * 610) % 12_000),
    currency: "KES",
    method: i % 2 === 0 ? "M-Pesa" : "Bank transfer",
    destination: i % 2 === 0 ? `+2547••••${100 + i}` : `••••${4000 + i}`,
    status: pick([...PO_STATUS], i),
    requested: isoDaysAgo(i),
  };
});

export const PENDING_PAYOUTS = PAYOUTS.filter(
  (p) => p.status === "pending",
).length;
export const OPEN_REPORTS = REPORTS.filter((r) => r.status === "open").length;

export const DASHBOARD: DashboardData = {
  stats: [
    {
      key: "users",
      label: "Total users",
      number: String(USERS.length + 1158),
      sub: "all registered accounts",
      trend: "↑ 42 this week",
      trendUp: true,
      accent: "gold",
    },
    {
      key: "workers",
      label: "Active workers",
      number: String(
        WORKERS.filter((w) => w.verify === "verified").length + 480,
      ),
      sub: "verified fundis",
      trend: "↑ 12 this week",
      trendUp: true,
      accent: "blue",
    },
    {
      key: "jobs",
      label: "Total jobs",
      number: "3,214",
      sub: "all-time completed",
      trend: "↑ 88 this week",
      trendUp: true,
      accent: "green",
    },
    {
      key: "reports",
      label: "Open reports",
      number: String(OPEN_REPORTS),
      sub: "needs attention now",
      trend: `↑ ${OPEN_REPORTS} new`,
      trendUp: false,
      accent: "red",
    },
    {
      key: "revenue",
      label: "Platform revenue",
      number: "KSh 284k",
      sub: "this month",
      trend: "↑ 9% this week",
      trendUp: true,
      accent: "purple",
    },
    {
      key: "new",
      label: "New today",
      number: "17",
      sub: "registrations today",
      trend: "↑ 5 this week",
      trendUp: true,
      accent: "gold",
    },
    {
      key: "jobsToday",
      label: "Jobs today",
      number: "23",
      sub: "job requests today",
      trend: "↑ 3 this week",
      trendUp: true,
      accent: "blue",
    },
    {
      key: "pendingVerify",
      label: "Pending verification",
      number: String(WORKERS.filter((w) => w.verify === "pending").length),
      sub: "workers awaiting ID check",
      accent: "green",
    },
  ],
  activity: [
    {
      id: "a1",
      type: "user_registered",
      text: "James Mwangi registered as a worker",
      time: "2m ago",
    },
    {
      id: "a2",
      type: "report_filed",
      text: "New harassment report against Kevin Omondi",
      time: "11m ago",
    },
    {
      id: "a3",
      type: "worker_verified",
      text: "Grace Achieng passed ID verification",
      time: "34m ago",
    },
    {
      id: "a4",
      type: "payment_received",
      text: "KSh 6,500 payment received for job #312",
      time: "1h ago",
    },
    {
      id: "a5",
      type: "review_flagged",
      text: "A review for Peter Kamau was flagged",
      time: "2h ago",
    },
    {
      id: "a6",
      type: "job_completed",
      text: "Bathroom retiling job marked completed",
      time: "3h ago",
    },
    {
      id: "a7",
      type: "account_suspended",
      text: "Felix Njoroge was suspended for 30 days",
      time: "4h ago",
    },
    {
      id: "a8",
      type: "user_registered",
      text: "Brightline Properties registered as an employer",
      time: "5h ago",
    },
    {
      id: "a9",
      type: "worker_verified",
      text: "Hassan Abdi passed ID verification",
      time: "6h ago",
    },
    {
      id: "a10",
      type: "payment_received",
      text: "KSh 3,200 payment received for job #309",
      time: "7h ago",
    },
    {
      id: "a11",
      type: "report_filed",
      text: "Spam content report filed against a profile",
      time: "8h ago",
    },
    {
      id: "a12",
      type: "job_completed",
      text: "Gate welding repair marked completed",
      time: "9h ago",
    },
    {
      id: "a13",
      type: "user_registered",
      text: "Mercy Mutua registered as a worker",
      time: "10h ago",
    },
    {
      id: "a14",
      type: "review_flagged",
      text: "A review for Lydia Were was flagged",
      time: "11h ago",
    },
    {
      id: "a15",
      type: "worker_verified",
      text: "Noah Maina passed ID verification",
      time: "12h ago",
    },
    {
      id: "a16",
      type: "account_suspended",
      text: "A worker account was suspended",
      time: "13h ago",
    },
    {
      id: "a17",
      type: "payment_received",
      text: "KSh 9,000 payment received for job #301",
      time: "15h ago",
    },
    {
      id: "a18",
      type: "job_completed",
      text: "Office deep clean marked completed",
      time: "17h ago",
    },
    {
      id: "a19",
      type: "user_registered",
      text: "Olivia Chebet registered as a worker",
      time: "19h ago",
    },
    {
      id: "a20",
      type: "report_filed",
      text: "Payment dispute opened on job #298",
      time: "21h ago",
    },
  ],
  reports: REPORTS.filter((r) => r.status === "open")
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      severity: r.severity,
      title: `${r.type} — ${r.reportedUser}`,
      reporter: r.filedBy,
      time: "today",
      status: r.status,
    })),
  newUsers: USERS.slice(0, 5).map((u) => ({
    id: u.id,
    name: u.name,
    initials: initialsOf(u.name),
    role: u.role,
    meta: u.role === "worker" ? `${u.trade} · ${u.location}` : u.location,
    time: u.lastActive,
  })),
  quick: {
    pendingVerification: WORKERS.filter((w) => w.verify === "pending").length,
    openReports: OPEN_REPORTS,
    pendingPayouts: PENDING_PAYOUTS,
  },
  health: [
    { key: "api", label: "API server", state: "operational" },
    { key: "db", label: "Database", state: "operational" },
    { key: "socket", label: "Messaging (Socket.io)", state: "operational" },
    { key: "email", label: "Email service", state: "degraded" },
    {
      key: "cloudinary",
      label: "Image uploads (Cloudinary)",
      state: "operational",
    },
    { key: "typesense", label: "Search (Typesense)", state: "operational" },
  ],
};

export const SETTINGS: AdminSettings = {
  general: {
    platformName: "Tesilix",
    supportEmail: "support@tesilix.com",
    contactPhone: "+254 700 000 000",
    launchDate: "2026-01-15",
    maintenanceMode: false,
    registrationsOpen: true,
  },
  commission: {
    transactionFeePct: 10,
    workerSubscription: 0,
    featuredListing: 1500,
  },
  notifications: { email: true, push: true, sms: false },
  verification: { requireId: true, requirePhone: true, minProfileStrength: 60 },
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome_worker",
    name: "Welcome email (worker)",
    subject: "Welcome to Tesilix, {{name}}!",
    body: "Hi {{name}},\n\nWelcome to Tesilix — set up your profile to start getting hired.\n\n— The Tesilix team",
  },
  {
    id: "welcome_employer",
    name: "Welcome email (employer)",
    subject: "Welcome to Tesilix",
    body: "Hi {{name}},\n\nFind trusted fundis near you. Post your first job today.\n\n— The Tesilix team",
  },
  {
    id: "verify_otp",
    name: "Email verification OTP",
    subject: "Your Tesilix verification code",
    body: "Your verification code is {{otp}}. It expires in 10 minutes.",
  },
  {
    id: "job_request",
    name: "Job request received",
    subject: "New job request from {{employer}}",
    body: "Hi {{name}},\n\nYou have a new job request: {{jobTitle}}.",
  },
  {
    id: "job_accepted",
    name: "Job accepted",
    subject: "{{worker}} accepted your job",
    body: "Good news — {{worker}} accepted your request for {{jobTitle}}.",
  },
  {
    id: "job_completed",
    name: "Job completed",
    subject: "Job completed — leave a review",
    body: "Your job {{jobTitle}} is complete. Please leave a review.",
  },
  {
    id: "review_received",
    name: "Review received",
    subject: "You received a new review",
    body: "Hi {{name}}, {{reviewer}} left you a {{rating}}-star review.",
  },
  {
    id: "account_suspended",
    name: "Account suspended",
    subject: "Your Tesilix account has been suspended",
    body: "Hi {{name}},\n\nYour account has been suspended. Reason: {{reason}}.",
  },
  {
    id: "id_approved",
    name: "ID verification approved",
    subject: "You're verified on Tesilix",
    body: "Congratulations {{name}}, your ID has been verified.",
  },
  {
    id: "id_rejected",
    name: "ID verification rejected",
    subject: "Action needed: resubmit your ID",
    body: "Hi {{name}},\n\nWe couldn't verify your ID. Reason: {{reason}}. Please resubmit.",
  },
  {
    id: "password_reset",
    name: "Password reset",
    subject: "Reset your Tesilix password",
    body: "Click the link to reset your password: {{link}}",
  },
];
