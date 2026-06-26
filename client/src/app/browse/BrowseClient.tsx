"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LandingNav from "@/components/landing/LandingNav";
import {
  type BrowseFilters,
  type BrowseWorker,
  type BrowseWorkersResponse,
  useBrowseWorkers,
} from "@/features/browse";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/searchStore";
import AskAiModal from "./AskAiModal";
import FilterBar from "./FilterBar";
import { WorkerCardGrid } from "./WorkerCard";

interface Props {
  initialData?: BrowseWorkersResponse;
  fontClass?: string;
  /** Pre-seed the trade/location filters when arriving from an SEO route
   * (/browse/[trade]/[location]). Applied once on mount. */
  initialTrade?: string;
  initialLocation?: string;
}

const PAGE_SIZE = 12;

/** Numbered page list with ellipses, e.g. 1 … 4 5 6 … 20. */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

const PAGER_EDGE =
  "flex h-[38px] items-center gap-1.5 rounded-[10px] border border-border bg-white px-4 text-sm font-semibold text-ink-2 transition-colors duration-150 enabled:hover:border-gold-dark enabled:hover:text-ink disabled:cursor-not-allowed disabled:text-ink-4";

export default function BrowseClient({
  initialData,
  fontClass,
  initialTrade,
  initialLocation,
}: Props) {
  const router = useRouter();

  // --- store filter state ---
  const selectedTrades = useSearchStore((s) => s.selectedTrades);
  const location = useSearchStore((s) => s.location);
  const availableNow = useSearchStore((s) => s.availableNow);
  const verifiedOnly = useSearchStore((s) => s.verifiedOnly);
  const certified = useSearchStore((s) => s.certified);
  const minRate = useSearchStore((s) => s.minRate);
  const maxRate = useSearchStore((s) => s.maxRate);
  const minRating = useSearchStore((s) => s.minRating);
  const minExp = useSearchStore((s) => s.minExp);
  const sortBy = useSearchStore((s) => s.sortBy);
  const setFilter = useSearchStore((s) => s.setFilter);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  // --- local UI state ---
  const [page, setPage] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [nameQuery, setNameQuery] = useState(""); // applied client-side
  const [aiOpen, setAiOpen] = useState(false);

  // Seed filters from an SEO route (/browse/[trade]/[location]) once on mount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run-once seed
  useEffect(() => {
    if (initialTrade) setFilter("selectedTrades", [initialTrade]);
    if (initialLocation) {
      setFilter("location", initialLocation);
      setLocInput(initialLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any filter change resets pagination back to the first page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these filters are intentional reset triggers
  useEffect(() => {
    setPage(1);
  }, [
    selectedTrades,
    location,
    availableNow,
    minRating,
    minExp,
    sortBy,
    nameQuery,
  ]);

  const filters: BrowseFilters = useMemo(
    () => ({
      selectedTrades,
      location,
      minRate,
      maxRate,
      minRating,
      minExp,
      availableNow,
      verifiedOnly,
      certified,
      sortBy,
      page,
      limit: PAGE_SIZE,
    }),
    [
      selectedTrades,
      location,
      minRate,
      maxRate,
      minRating,
      minExp,
      availableNow,
      verifiedOnly,
      certified,
      sortBy,
      page,
    ],
  );

  const { data, isLoading, isFetching } = useBrowseWorkers(filters, {
    initialData: page === 1 ? initialData : undefined,
  });

  const allWorkers = data?.workers ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Client-side name/skill filter folded on top of the current page.
  const workers = useMemo(() => {
    if (!nameQuery.trim()) return allWorkers;
    const q = nameQuery.trim().toLowerCase();
    return allWorkers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.username.toLowerCase().includes(q) ||
        w.trade.toLowerCase().includes(q),
    );
  }, [allWorkers, nameQuery]);

  // --- handlers ---
  const handleSearch = () => {
    setNameQuery(nameInput);
    setFilter("location", locInput.trim());
  };

  const handleView = (w: BrowseWorker) => router.push(`/worker/${w.username}`);

  const clearAll = () => {
    resetFilters();
    setNameQuery("");
    setNameInput("");
    setLocInput("");
  };

  const goToPage = (p: number) => {
    setPage(p);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showPagination = !nameQuery.trim() && totalPages > 1;

  return (
    <div
      className={cn(
        "min-h-screen bg-cream text-ink font-sans overflow-x-hidden",
        fontClass,
      )}
    >
      <LandingNav />

      <main className="pb-[90px]">
        {/* HERO */}
        <header className="mx-auto max-w-[1240px] px-5 pt-[82px] md:px-10 md:pt-[116px]">
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.18em] text-ink-3">
            Discover skilled professionals
          </p>
          <h1 className="mt-3.5 font-serif text-[34px] font-medium leading-[1.06] tracking-[-0.02em] text-ink md:text-[clamp(40px,7vw,66px)] md:leading-[0.98]">
            Find your{" "}
            <em className="font-serif italic text-gold-dark">fundi.</em>
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-ink-2 md:mt-[18px] md:text-[17px]">
            Browse vetted tradespeople worldwide - every profile ID-verified,
            skill-assessed, and reviewed by real customers.
          </p>

          {/* SEARCH BAR */}
          <div className="mt-[22px] flex flex-wrap items-stretch rounded-[18px] border border-border bg-white p-2 shadow-[0_2px_10px_rgba(33,28,20,0.05)] md:mt-[30px] md:flex-nowrap">
            <div className="flex flex-[1_1_100%] items-center gap-3 px-[18px] text-ink-3 md:flex-1">
              <Search size={19} aria-hidden />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, skill, or profession…"
                aria-label="Search by name, skill or profession"
                className="flex-1 border-none bg-transparent py-[15px] text-[15.5px] text-ink outline-none placeholder:text-ink-4"
              />
            </div>
            <span className="my-2 hidden w-px bg-border md:block" aria-hidden />
            <div className="flex flex-[1_1_100%] items-center gap-3 px-[18px] text-ink-3 md:flex-[0_0_280px]">
              <MapPin size={17} aria-hidden />
              <input
                type="text"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="City or location"
                aria-label="City or location"
                className="flex-1 border-none bg-transparent py-[15px] text-[15.5px] text-ink outline-none placeholder:text-ink-4"
              />
            </div>
            <button
              type="button"
              className="flex-[1_1_100%] rounded-xl border-none bg-gold-dark py-[13px] text-[15px] font-semibold text-white transition-colors duration-[180ms] hover:bg-gold md:flex-none md:px-9 md:py-0"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </header>

        {/* FILTER TOOLBAR */}
        <FilterBar onAskAi={() => setAiOpen(true)} />

        {/* RESULTS */}
        <section
          className="mx-auto max-w-[1240px] px-5 pt-[26px] md:px-10"
          aria-busy={isFetching}
        >
          {isLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(244px,1fr))] gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton tiles
                  key={i}
                  className="h-[280px] animate-shimmer rounded-[18px]"
                />
              ))}
            </div>
          ) : workers.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-border bg-white px-6 py-[72px] text-center">
              <p className="m-0 font-serif text-2xl font-medium text-ink">
                No fundis match those filters
              </p>
              <p className="mb-5 mt-2.5 text-[15px] text-ink-3">
                Try widening your trade, location or rating filters.
              </p>
              <button
                type="button"
                className="rounded-full border-none bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors duration-[180ms] hover:bg-gold-dark"
                onClick={clearAll}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(244px,1fr))] gap-5">
                {workers.map((w) => (
                  <WorkerCardGrid key={w.id} worker={w} onView={handleView} />
                ))}
              </div>

              {showPagination && (
                <nav
                  className="mt-[38px] flex items-center justify-center gap-1.5"
                  aria-label="Pagination"
                >
                  <button
                    type="button"
                    className={PAGER_EDGE}
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </button>
                  {pageList(page, totalPages).map((p, i) =>
                    p === "…" ? (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis gaps have no stable id
                        key={`gap-${i}`}
                        className="w-6 text-center text-ink-4"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={cn(
                          "h-[38px] w-[38px] rounded-[10px] border text-sm font-semibold transition-colors duration-150",
                          p === page
                            ? "border-navy bg-navy font-bold text-white"
                            : "border-border bg-white text-ink-2 hover:border-gold-dark hover:text-ink",
                        )}
                        onClick={() => goToPage(p)}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className={PAGER_EDGE}
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next →
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>

      <AskAiModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
