// Live admin API client. Talks to the Express backend at `/api/v1/admin/*`
// via the shared axios instance (auth + refresh handled by the interceptor).
// Every reader unwraps the standard `{ success, data }` envelope to `data`.

import client from "@/lib/axios";
import type {
  AdminBadges,
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
  HealthService,
  Paginated,
} from "./types";

export interface ListParams {
  search?: string;
  status?: string;
  role?: string;
  trade?: string;
  sort?: string;
  flagged?: boolean;
  rating?: number;
  severity?: string;
  page?: number;
}

/** Build a query string from defined list params. */
function qs(p: ListParams = {}): string {
  const sp = new URLSearchParams();
  if (p.search) sp.set("search", p.search);
  if (p.status) sp.set("status", p.status);
  if (p.role) sp.set("role", p.role);
  if (p.trade) sp.set("trade", p.trade);
  if (p.sort) sp.set("sort", p.sort);
  if (p.flagged) sp.set("flagged", "true");
  if (p.rating) sp.set("rating", String(p.rating));
  if (p.severity) sp.set("severity", p.severity);
  if (p.page) sp.set("page", String(p.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const unwrap = <T>(r: { data: { data: T } }): T => r.data.data;
const get = <T>(url: string): Promise<T> => client.get(url).then(unwrap<T>);

export interface AdminMutateReq {
  method: "post" | "patch" | "delete" | "put";
  url: string;
  body?: unknown;
}

export const adminService = {
  // ── Overview ──
  dashboard: () => get<DashboardData>("/admin/dashboard"),
  health: () => get<HealthService[]>("/admin/health"),
  badges: () => get<AdminBadges>("/admin/badges"),

  // ── Users ──
  users: (p?: ListParams) => get<Paginated<AdminUser>>(`/admin/users${qs(p)}`),
  user: (id: string) => get<AdminUser>(`/admin/users/${id}`),

  // ── Workers ──
  workers: (p?: ListParams) =>
    get<Paginated<AdminWorker>>(`/admin/workers${qs(p)}`),
  worker: (id: string) => get<AdminWorker>(`/admin/workers/${id}`),

  // ── Employers ──
  employers: (p?: ListParams) =>
    get<Paginated<AdminEmployer>>(`/admin/employers${qs(p)}`),
  employer: (id: string) => get<AdminEmployer>(`/admin/employers/${id}`),

  // ── Jobs ──
  jobs: (p?: ListParams) => get<Paginated<AdminJob>>(`/admin/jobs${qs(p)}`),
  job: (id: string) => get<AdminJob>(`/admin/jobs/${id}`),

  // ── Reviews ──
  reviews: (p?: ListParams) =>
    get<Paginated<AdminReview>>(`/admin/reviews${qs(p)}`),
  review: (id: string) => get<AdminReview>(`/admin/reviews/${id}`),

  // ── Reports ──
  reports: (p?: ListParams) =>
    get<Paginated<AdminReport>>(`/admin/reports${qs(p)}`),
  report: (id: string) => get<AdminReport>(`/admin/reports/${id}`),

  // ── Finance ──
  payments: (p?: ListParams) =>
    get<Paginated<AdminPayment>>(`/admin/payments${qs(p)}`),
  payouts: (p?: ListParams) =>
    get<Paginated<AdminPayout>>(`/admin/payouts${qs(p)}`),

  // ── Settings ──
  settings: () => get<AdminSettings>("/admin/settings"),
  emailTemplates: () => get<EmailTemplate[]>("/admin/settings/email-templates"),

  // ── Generic mutation ── (callers pass a descriptor; see endpoints.ts helpers)
  mutate: (req: AdminMutateReq) =>
    client
      .request({ method: req.method, url: req.url, data: req.body })
      .then((r) => r.data?.data),
};
