import type { BrowseWorker, BrowseWorkersResponse } from "@/features/browse";
import { API_BASE } from "@/lib/apiBase";
import { serverFetch } from "@/lib/serverFetch";

export interface BrowseListing {
  workers: BrowseWorker[];
  total: number;
  response?: BrowseWorkersResponse;
}

/**
 * Server-side fetch of the public browse listing for a trade (+ optional
 * location). Used by the /browse SEO routes for the worker count, the ItemList
 * JSON-LD, and to seed the client grid. Revalidated hourly (ISR).
 */
export async function getBrowseListing(opts: {
  trade?: string;
  location?: string;
  limit?: number;
}): Promise<BrowseListing> {
  const params = new URLSearchParams({
    available: "false",
    verified: "false",
    minRating: "0",
    minRate: "0",
    maxRate: "0",
    sort: "best_match",
    page: "1",
    limit: String(opts.limit ?? 24),
  });
  if (opts.trade) params.set("trades", opts.trade);
  if (opts.location) params.set("location", opts.location);

  try {
    const res = await serverFetch(
      `${API_BASE}/browse/workers?${params.toString()}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return { workers: [], total: 0 };
    const json = await res.json();
    const data = json?.data as BrowseWorkersResponse | undefined;
    return {
      workers: data?.workers ?? [],
      total: data?.total ?? 0,
      response: data,
    };
  } catch {
    return { workers: [], total: 0 };
  }
}
