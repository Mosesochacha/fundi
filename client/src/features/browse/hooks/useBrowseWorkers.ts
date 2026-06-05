import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { browseService } from "../services/browse.service";
import type { BrowseFilters, BrowseWorkersResponse } from "../types/browse.types";

/**
 * Browse workers with the current filters. Refetches automatically whenever the
 * filter object changes (it's part of the query key).
 */
export function useBrowseWorkers(
  filters: BrowseFilters,
  options?: { initialData?: BrowseWorkersResponse },
) {
  return useQuery({
    queryKey: ["browse", "workers", filters],
    queryFn: () => browseService.getWorkers(filters),
    select: (res) => res.data.data as BrowseWorkersResponse,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
    initialData: options?.initialData
      ? ({ data: { data: options.initialData } } as never)
      : undefined,
  });
}
