"use client";

import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import LandingNav from "@/components/landing/LandingNav";
import { btnGold, display } from "@/components/landing/landingStyles";
import { useAuth } from "@/features/auth";
import {
  type BrowseFilters,
  type BrowseWorker,
  type BrowseWorkersResponse,
  useBrowseWorkers,
} from "@/features/browse";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/searchStore";
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

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const pad = (n: number) => String(n).padStart(2, "0");

/** Search field: a ruled cell, hairline-separated from its neighbours. */
const FIELD_CELL = "flex flex-col gap-1 bg-white px-4 py-3 md:px-5 md:py-3.5";
const FIELD_LABEL =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3";
const FIELD_INPUT =
  "w-full border-none bg-transparent p-0 text-[15px] text-ink outline-none placeholder:text-ink-4";

const PAGER_EDGE =
  "group inline-flex items-center gap-2 bg-transparent text-[11px] font-bold uppercase tracking-[0.14em] text-navy transition-colors duration-300 enabled:cursor-pointer enabled:hover:text-gold-deep disabled:text-ink-4";

export default function BrowseClient({
  initialData,
  fontClass,
  initialTrade,
  initialLocation,
}: Props) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

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

  const [page, setPage] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: run-once seed
  useEffect(() => {
    if (initialTrade) setFilter("selectedTrades", [initialTrade]);
    if (initialLocation) {
      setFilter("location", initialLocation);
      setLocInput(initialLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: these filters are intentional reset triggers
  useEffect(() => {
    setPage(1);
  }, [
    selectedTrades,
    location,
    availableNow,
    verifiedOnly,
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

  const { data, isLoading, isPlaceholderData } = useBrowseWorkers(filters, {
    initialData: page === 1 ? initialData : undefined,
  });

  /* `isFetching` is true on the client's first render and false during SSR,
     which desynchronises hydration. `isPlaceholderData` is false on both and
     is the signal we actually want: the grid is showing the previous page
     while the next one loads. */
  const busy = isPlaceholderData;

  const allWorkers = data?.workers ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

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

  const handleSearch = () => {
    setNameQuery(nameInput);
    setFilter("location", locInput.trim());
  };

  const handleView = (w: BrowseWorker) => router.push(`/worker/${w.username}`);

  const handleMessage = (w: BrowseWorker) => {
    const profile = `/worker/${w.username}`;
    router.push(
      isLoggedIn ? profile : `/login?next=${encodeURIComponent(profile)}`,
    );
  };

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

  const searching = Boolean(nameQuery.trim());
  const showPagination = !searching && totalPages > 1;
  const firstOnPage = (page - 1) * PAGE_SIZE + 1;

  return (
    <div className={cn("min-h-screen bg-cream font-sans text-ink", fontClass)}>
      <LandingNav />

      <main className="pb-24">
        {/* ── Register head ──────────────────────────────────────── */}
        <header className="bg-paper relative overflow-hidden border-b border-border px-5 pt-24 pb-10 md:px-8 md:pt-32 md:pb-12">
          <div className="mx-auto w-full max-w-[1180px]">
            <div className="reveal flex items-center gap-3.5" style={d(0)}>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rotate-45 bg-gold"
              />
              <span className="text-[11px] font-bold tracking-[0.2em] text-gold-deep uppercase">
                The worker register
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-7">
              <h1
                className={`reveal ${display} text-[clamp(38px,5.2vw,64px)] leading-[1.02]`}
                style={d(70)}
              >
                Find your{" "}
                <em className="font-serif italic text-gold-dark">fundi</em>.
              </h1>
            </div>

            {/* Ruled search line — hairlines come from the grid gap */}
            <form
              className="reveal mt-9 grid gap-px overflow-hidden rounded-[3px] border border-border bg-border sm:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_auto]"
              style={d(210)}
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <div className={FIELD_CELL}>
                <label className={FIELD_LABEL} htmlFor="browse-q">
                  Trade or name
                </label>
                <input
                  id="browse-q"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Carpenter, welder, Amina…"
                  className={FIELD_INPUT}
                />
              </div>
              <div className={FIELD_CELL}>
                <label className={FIELD_LABEL} htmlFor="browse-loc">
                  Where
                </label>
                <input
                  id="browse-loc"
                  type="text"
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  placeholder="City or neighbourhood"
                  className={FIELD_INPUT}
                />
              </div>
              <button
                type="submit"
                className={cn(btnGold, "h-full w-full rounded-none px-10")}
              >
                Search
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </form>
          </div>
        </header>

        <FilterBar />

        {/* ── The plates ─────────────────────────────────────────── */}
        <section
          className="mx-auto w-full max-w-[1180px] px-5 pt-8 md:px-8 md:pt-10"
          aria-busy={busy}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-3">
            <p className="text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">
              {isLoading ? (
                "Drawing the register…"
              ) : searching ? (
                <>
                  <span className="tabular-nums text-navy">
                    {pad(workers.length)}
                  </span>{" "}
                  matching{" "}
                  <span className="text-[12px] normal-case text-navy">
                    “{nameQuery.trim()}”
                  </span>{" "}
                  on this page
                </>
              ) : total > 0 ? (
                <>
                  Plates{" "}
                  <span className="tabular-nums text-navy">
                    {pad(firstOnPage)}–{pad(firstOnPage + workers.length - 1)}
                  </span>{" "}
                  of{" "}
                  <span className="tabular-nums text-navy">
                    {total.toLocaleString()}
                  </span>
                </>
              ) : (
                "No plates"
              )}
            </p>
            {!isLoading && !searching && totalPages > 1 && (
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase tabular-nums">
                Page {pad(page)} / {pad(totalPages)}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton tiles
                  key={i}
                  className="overflow-hidden rounded-[4px] border border-border bg-white"
                >
                  <div className="relative aspect-[4/3] border-b border-border bg-cream">
                    <div className="plate-grid absolute inset-0 opacity-60" />
                    <div className="animate-shimmer absolute inset-0 opacity-70" />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="animate-shimmer h-3 w-1/3 rounded-[2px]" />
                    <div className="animate-shimmer h-5 w-2/3 rounded-[2px]" />
                    <div className="animate-shimmer h-3 w-full rounded-[2px]" />
                    <div className="animate-shimmer h-8 w-full rounded-[2px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : workers.length === 0 ? (
            <div className="relative mt-7 overflow-hidden rounded-[3px] border border-border bg-white px-6 py-20 text-center">
              <div
                className="plate-grid absolute inset-0 opacity-70"
                aria-hidden="true"
              />
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="mx-auto mb-6 block h-2 w-2 rotate-45 bg-gold"
                />
                <p className="font-serif text-[26px] leading-tight font-light text-ink">
                  Nothing filed under those filters.
                </p>
                <p className="mx-auto mt-3 max-w-[42ch] text-[14px] leading-[1.7] text-ink-2">
                  The register is still filling up. Widen the trade, the place
                  or the rating and the plates will come back.
                </p>
                <button
                  type="button"
                  className={cn(btnGold, "mt-8")}
                  onClick={clearAll}
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                key={`${page}-${sortBy}`}
                className={cn(
                  "mt-7 grid gap-x-6 gap-y-9 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3",
                  busy && "opacity-55",
                )}
              >
                {workers.map((w, i) => (
                  <WorkerCardGrid
                    key={w.id}
                    worker={w}
                    plateNo={searching ? i + 1 : firstOnPage + i}
                    delay={Math.min(i, 8) * 45}
                    onView={handleView}
                    onMessage={handleMessage}
                  />
                ))}
              </div>

              {showPagination && (
                <nav
                  className="mt-14 flex items-center justify-between gap-4 border-t border-border pt-6"
                  aria-label="Pagination"
                >
                  <button
                    type="button"
                    className={PAGER_EDGE}
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <span className="transition-transform duration-300 group-hover:-translate-x-1">
                      ←
                    </span>
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {pageList(page, totalPages).map((p, i) =>
                      p === "…" ? (
                        <span
                          // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis gaps have no stable id
                          key={`gap-${i}`}
                          className="w-5 text-center text-[13px] text-ink-4"
                        >
                          ·
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          className={cn(
                            "h-9 min-w-9 cursor-pointer border-b-2 bg-transparent px-2 text-[13px] font-semibold tabular-nums transition-colors duration-300",
                            p === page
                              ? "border-gold-dark text-navy"
                              : "border-transparent text-ink-3 hover:border-border hover:text-navy",
                          )}
                          onClick={() => goToPage(p)}
                          aria-current={p === page ? "page" : undefined}
                        >
                          {pad(p)}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    className={PAGER_EDGE}
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
