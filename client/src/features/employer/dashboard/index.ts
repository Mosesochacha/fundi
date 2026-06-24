import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";
import type { EmployerDashboard } from "./types";

const DASHBOARD_KEY = ["employer", "dashboard"] as const;

export interface HireWorkerInput {
  workerId: string;
  jobType: string;
  location: string;
  description?: string;
  /** ISO datetime. */
  scheduledAt?: string;
  /** Optional budget in KSh → maps to the job's agreedRate. */
  budget?: number;
}

export interface SubmitReviewInput {
  jobId: string;
  rating: number;
  text?: string;
}

export const employerDashboardService = {
  get: () => client.get("/employer/dashboard"),
  /** Send a hire request. The backend job's `title` is our `jobType`, `agreedRate` our `budget`. */
  hire: (data: HireWorkerInput) =>
    client.post("/jobs", {
      workerId: data.workerId,
      title: data.jobType,
      location: data.location,
      description: data.description,
      scheduledAt: data.scheduledAt,
      agreedRate: data.budget,
    }),
  complete: (jobId: string) => client.post(`/jobs/${jobId}/complete`),
  cancel: (jobId: string) => client.post(`/jobs/${jobId}/cancel`),
  review: (data: SubmitReviewInput) =>
    client.patch(`/jobs/${data.jobId}/review`, {
      rating: data.rating,
      text: data.text,
    }),
};

/** Aggregated data for the employer dashboard home. */
export function useGetEmployerDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: () => employerDashboardService.get(),
    select: (res) => res.data.data as EmployerDashboard,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 3,
    refetchOnWindowFocus: true,
  });
}

/**
 * Shared mutation factory - every employer action refreshes all employer
 * queries (dashboard aggregate + jobs lists) via the ["employer"] key prefix.
 */
function useDashboardMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employer"] }),
  });
}

export function useHireWorker() {
  return useDashboardMutation((data: HireWorkerInput) =>
    employerDashboardService.hire(data),
  );
}

export function useMarkComplete() {
  return useDashboardMutation((jobId: string) =>
    employerDashboardService.complete(jobId),
  );
}

export function useCancelJob() {
  return useDashboardMutation((jobId: string) =>
    employerDashboardService.cancel(jobId),
  );
}

export function useSubmitReview() {
  return useDashboardMutation((data: SubmitReviewInput) =>
    employerDashboardService.review(data),
  );
}

export type * from "./types";
