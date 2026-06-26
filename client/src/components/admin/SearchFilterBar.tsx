import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterPill {
  label: string;
  value: string;
  /** Optional count shown after the label. */
  count?: number;
}

export interface SortOption {
  label: string;
  value: string;
}

interface SearchFilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  pills?: FilterPill[];
  activePill?: string;
  onPill?: (value: string) => void;
  sort?: string;
  sortOptions?: SortOption[];
  onSort?: (value: string) => void;
  /** Extra controls (date range, trade dropdown, toggles). */
  children?: ReactNode;
}

export function SearchFilterBar({
  search,
  onSearch,
  searchPlaceholder = "Search…",
  pills,
  activePill,
  onPill,
  sort,
  sortOptions,
  onSort,
  children,
}: SearchFilterBarProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-3 mb-4 flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white transition-all"
          />
        </div>
        {sortOptions && onSort && (
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            className="h-9 px-3 rounded-lg text-sm border border-border bg-cream text-ink-2 outline-none focus:border-gold focus:bg-white cursor-pointer"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {children}
      </div>
      {pills && onPill && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {pills.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPill(p.value)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-sm font-medium border transition-colors",
                activePill === p.value
                  ? "bg-navy text-white border-navy"
                  : "bg-cream border-border text-ink-2 hover:border-ink-3",
              )}
            >
              {p.label}
              {p.count !== undefined && (
                <span
                  className={cn(
                    "text-[10px] rounded-full px-1.5 py-px",
                    activePill === p.value
                      ? "bg-white/20 text-white"
                      : "bg-cream-2 text-ink-3",
                  )}
                >
                  {p.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
