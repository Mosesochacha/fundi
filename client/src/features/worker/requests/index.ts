import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import client from "@/lib/axios";
import type { JobRequest, RequestFilter, RequestStats } from "./types";

export type * from "./types";
export { EMPTY_STATS } from "./types";

/* ─────────────────────────────────────────────────────────────────────────
   Service. Paths are written relative to the axios baseURL (`…/api/v1`),
   matching every other feature service (e.g. `/worker/dashboard`).
   ───────────────────────────────────────────────────────────────────────── */
export const requestsService = {
  list: (status?: RequestFilter) =>
    client.get("/worker/requests", {
      params: status && status !== "all" ? { status } : undefined,
    }),
  stats: () => client.get("/worker/requests/stats"),
  accept: (id: string) => client.patch(`/worker/requests/${id}/accept`),
  decline: (id: string) => client.patch(`/worker/requests/${id}/decline`),
  complete: (id: string) => client.patch(`/worker/requests/${id}/complete`),
};

/** Root key for every requests query — invalidating it refreshes lists + stats. */
const REQ_KEY = ["worker", "requests"] as const;

/* ── Queries ──────────────────────────────────────────────────────────────── */

/** List of requests, optionally narrowed to a single status tab. */
export function useGetRequests(status: RequestFilter = "all") {
  return useQuery({
    queryKey: [...REQ_KEY, status],
    queryFn: () => requestsService.list(status),
    select: (res): JobRequest[] => (res.data?.data ?? []) as JobRequest[],
    staleTime: 1000 * 60,
    // Poll every 2 minutes so new requests surface without a manual refresh.
    refetchInterval: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });
}

/** Counts for the stat strip + filter-tab badges. */
export function useGetRequestStats() {
  return useQuery({
    queryKey: [...REQ_KEY, "stats"],
    queryFn: () => requestsService.stats(),
    select: (res): RequestStats => res.data?.data as RequestStats,
    staleTime: 1000 * 60,
  });
}

/* ── Optimistic mutations ─────────────────────────────────────────────────── */

type StatField = keyof Omit<RequestStats, "total">;

/**
 * Optimistically flip one request to a new status across every cached list,
 * and shift the stat counters. Returns the snapshot for rollback.
 *
 * List queries cache the raw axios response (`res.data.data` holds the array),
 * so we patch that nested shape and leave the `select` transform untouched.
 */
async function optimisticTransition(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  next: JobRequest["status"],
  from: StatField,
  to: StatField,
) {
  await qc.cancelQueries({ queryKey: REQ_KEY });
  const snapshot = qc.getQueriesData({ queryKey: REQ_KEY });

  // Lists: keys are ["worker","requests", filter]; skip the "stats" sibling.
  qc.setQueriesData(
    {
      queryKey: REQ_KEY,
      predicate: (q) => q.queryKey.length === 3 && q.queryKey[2] !== "stats",
    },
    (old: unknown) => {
      const env = old as { data?: { data?: JobRequest[] } } | undefined;
      const list = env?.data?.data;
      if (!Array.isArray(list)) return old;
      const patched = list.map((r) =>
        r.id === id
          ? {
              ...r,
              status: next,
              ...(next === "active"
                ? { isToday: true, isMultiDay: false }
                : {}),
            }
          : r,
      );
      return { ...env, data: { ...env?.data, data: patched } };
    },
  );

  // Stats: shift one count from `from` to `to`.
  qc.setQueryData([...REQ_KEY, "stats"], (old: unknown) => {
    const env = old as { data?: { data?: RequestStats } } | undefined;
    const s = env?.data?.data;
    if (!s) return old;
    return {
      ...env,
      data: {
        ...env.data,
        data: { ...s, [from]: Math.max(0, s[from] - 1), [to]: s[to] + 1 },
      },
    };
  });

  return { snapshot };
}

function rollback(
  qc: ReturnType<typeof useQueryClient>,
  ctx: { snapshot: [QueryKey, unknown][] } | undefined,
) {
  ctx?.snapshot.forEach(([key, data]) => {
    qc.setQueryData(key, data);
  });
}

/** Accept a new request → it becomes an active job. */
export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestsService.accept(id),
    onMutate: (id) => optimisticTransition(qc, id, "active", "new", "active"),
    onError: (_e, _id, ctx) => rollback(qc, ctx),
    onSettled: () => qc.invalidateQueries({ queryKey: REQ_KEY }),
  });
}

/** Decline a new request. */
export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestsService.decline(id),
    onMutate: (id) =>
      optimisticTransition(qc, id, "declined", "new", "declined"),
    onError: (_e, _id, ctx) => rollback(qc, ctx),
    onSettled: () => qc.invalidateQueries({ queryKey: REQ_KEY }),
  });
}

/** Mark an active job complete. */
export function useMarkComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requestsService.complete(id),
    onMutate: (id) =>
      optimisticTransition(qc, id, "completed", "active", "completed"),
    onError: (_e, _id, ctx) => rollback(qc, ctx),
    onSettled: () => qc.invalidateQueries({ queryKey: REQ_KEY }),
  });
}
