import { useQuery } from "@tanstack/react-query";
import client from "@/lib/axios";
import type { WorkerReviews } from "./types";

export type * from "./types";

export const reviewsService = {
  get: () => client.get("/worker/reviews"),
};

/** All reviews for the signed-in worker, plus the rating summary. */
export function useGetWorkerReviews() {
  return useQuery({
    queryKey: ["worker", "reviews"],
    queryFn: () => reviewsService.get(),
    select: (res) => res.data.data as WorkerReviews,
    staleTime: 1000 * 60 * 2,
  });
}
