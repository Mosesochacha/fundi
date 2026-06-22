import { useQuery } from "@tanstack/react-query";
import client from "@/lib/axios";
import type { WorkerDashboard } from "./types";

export const dashboardService = {
  get: () => client.get("/worker/dashboard"),
};

/** Aggregated data for the worker dashboard home. */
export function useGetWorkerDashboard() {
  return useQuery({
    queryKey: ["worker", "dashboard"],
    queryFn: () => dashboardService.get(),
    select: (res) => res.data.data as WorkerDashboard,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

export type * from "./types";
