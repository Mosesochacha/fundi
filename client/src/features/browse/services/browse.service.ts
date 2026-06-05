import client from "@/lib/axios";
import type { BrowseFilters } from "../types/browse.types";

/** Map the searchStore-shaped filters onto the /browse/workers query params. */
export function browseParams(filters: BrowseFilters) {
  return {
    trades: filters.selectedTrades.length
      ? filters.selectedTrades.join(",")
      : undefined,
    location: filters.location || undefined,
    minRate: filters.minRate,
    maxRate: filters.maxRate,
    minRating: filters.minRating,
    minExp: filters.minExp,
    available: filters.availableNow,
    verified: filters.verifiedOnly,
    certified: filters.certified,
    sort: filters.sortBy,
    page: filters.page ?? 1,
    limit: filters.limit ?? 12,
  };
}

export const browseService = {
  getWorkers: (filters: BrowseFilters) =>
    client.get("/browse/workers", { params: browseParams(filters) }),
};
