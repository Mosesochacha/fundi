import { useQuery } from "@tanstack/react-query";
import client from "@/lib/axios";

// Mutations live in ../dashboard and invalidate the whole ["employer"] key
// prefix, so they refresh these jobs lists too.
export {
  useMarkComplete,
  useCancelJob,
  useSubmitReview,
} from "../dashboard";

export type EmployerJobStatus =
  | "pending"
  | "accepted"
  | "completed"
  | "cancelled"
  | "declined";

export interface EmployerJob {
  id: string;
  workerId: string;
  workerName: string;
  workerUsername: string | null;
  trade: string;
  avatarUrl: string | null;
  jobType: string;
  location: string;
  description: string;
  status: EmployerJobStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  agreedRate: number | null;
  rating: number | null;
  reviewText: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export const employerJobsService = {
  list: (status?: string) =>
    client.get("/employer/jobs", { params: status ? { status } : undefined }),
};

/** All of the employer's jobs (optionally filtered by status). */
export function useGetEmployerJobs(status?: string) {
  return useQuery({
    queryKey: ["employer", "jobs", status ?? "all"],
    queryFn: () => employerJobsService.list(status),
    select: (res) => res.data.data.jobs as EmployerJob[],
    staleTime: 1000 * 60,
  });
}
