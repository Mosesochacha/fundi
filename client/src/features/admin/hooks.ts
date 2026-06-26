"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type AdminMutateReq, adminService, type ListParams } from "./service";

const KEY = "admin";

export function useAdminBadges() {
  return useQuery({
    queryKey: [KEY, "badges"],
    queryFn: () => adminService.badges(),
    staleTime: 1000 * 60,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: [KEY, "dashboard"],
    queryFn: () => adminService.dashboard(),
  });
}

export function useAdminUsers(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "users", params],
    queryFn: () => adminService.users(params),
  });
}
export function useAdminUser(id: string) {
  return useQuery({
    queryKey: [KEY, "user", id],
    queryFn: () => adminService.user(id),
    enabled: !!id,
  });
}

export function useAdminWorkers(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "workers", params],
    queryFn: () => adminService.workers(params),
  });
}
export function useAdminWorker(id: string) {
  return useQuery({
    queryKey: [KEY, "worker", id],
    queryFn: () => adminService.worker(id),
    enabled: !!id,
  });
}

export function useAdminEmployers(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "employers", params],
    queryFn: () => adminService.employers(params),
  });
}
export function useAdminEmployer(id: string) {
  return useQuery({
    queryKey: [KEY, "employer", id],
    queryFn: () => adminService.employer(id),
    enabled: !!id,
  });
}

export function useAdminJobs(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "jobs", params],
    queryFn: () => adminService.jobs(params),
  });
}
export function useAdminJob(id: string) {
  return useQuery({
    queryKey: [KEY, "job", id],
    queryFn: () => adminService.job(id),
    enabled: !!id,
  });
}

export function useAdminReviews(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "reviews", params],
    queryFn: () => adminService.reviews(params),
  });
}
export function useAdminReview(id: string) {
  return useQuery({
    queryKey: [KEY, "review", id],
    queryFn: () => adminService.review(id),
    enabled: !!id,
  });
}

export function useAdminReports(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "reports", params],
    queryFn: () => adminService.reports(params),
  });
}
export function useAdminReport(id: string) {
  return useQuery({
    queryKey: [KEY, "report", id],
    queryFn: () => adminService.report(id),
    enabled: !!id,
  });
}

export function useAdminPayments(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "payments", params],
    queryFn: () => adminService.payments(params),
  });
}

export function useAdminPayouts(params: ListParams) {
  return useQuery({
    queryKey: [KEY, "payouts", params],
    queryFn: () => adminService.payouts(params),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: [KEY, "settings"],
    queryFn: () => adminService.settings(),
  });
}

export function useAdminEmailTemplates() {
  return useQuery({
    queryKey: [KEY, "email-templates"],
    queryFn: () => adminService.emailTemplates(),
  });
}

/**
 * Generic admin mutation. Pass an {@link AdminMutateReq} descriptor
 * (`{ method, url, body }`, usually from `adminEndpoints.*`) to hit the live
 * API; on success all admin queries are invalidated so lists/badges refetch.
 * Calls without a `url` (client-only actions like the email blast or the
 * settings danger-zone) simply resolve so existing toasts keep working.
 */
export function useAdminAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg?: AdminMutateReq | Record<string, unknown>) => {
      if (arg && typeof arg === "object" && "url" in arg && arg.url) {
        return adminService.mutate(arg as AdminMutateReq);
      }
      return Promise.resolve(null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
