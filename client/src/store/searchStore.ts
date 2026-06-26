import { create } from "zustand";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export type ViewMode = "list" | "grid";

interface SearchState {
  selectedTrades: string[];
  location: string;
  availableNow: boolean;
  verifiedOnly: boolean;
  certified: boolean;
  minRate: number;
  maxRate: number;
  minRating: number;
  minExp: number;
  sortBy: string;
  viewMode: ViewMode;
  /** Display-only currency for the rates shown in the browse / search toolbar.
   * Not a filter - never reset by `resetFilters`. */
  displayCurrency: string;
  toggleTrade: (trade: string) => void;
  setFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => void;
  resetFilters: () => void;
  setSortBy: (sort: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setDisplayCurrency: (code: string) => void;
}

type SearchFilters = Pick<
  SearchState,
  | "selectedTrades"
  | "location"
  | "availableNow"
  | "verifiedOnly"
  | "certified"
  | "minRate"
  | "maxRate"
  | "minRating"
  | "minExp"
  | "sortBy"
  | "viewMode"
>;

/** Single source of truth for filter defaults - also used by the browse UI
 * to detect "active" filters and to reset individual filter tags. */
export const SEARCH_DEFAULTS: SearchFilters = {
  selectedTrades: [],
  location: "",
  availableNow: false,
  verifiedOnly: false,
  certified: false,
  minRate: 500,
  maxRate: 10000,
  minRating: 0,
  minExp: 0,
  sortBy: "best_match",
  viewMode: "grid",
};

const defaults = SEARCH_DEFAULTS;

export const useSearchStore = create<SearchState>((set) => ({
  ...defaults,
  displayCurrency: DEFAULT_CURRENCY,
  toggleTrade: (trade) =>
    set((s) => ({
      selectedTrades: s.selectedTrades.includes(trade)
        ? s.selectedTrades.filter((t) => t !== trade)
        : [...s.selectedTrades, trade],
    })),
  setFilter: (key, value) => set({ [key]: value } as Partial<SearchState>),
  resetFilters: () => set({ ...defaults }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (viewMode) => set({ viewMode }),
  setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
}));
