"use client";

import { MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import "@/app/landing.css";
import "./browse.css";
import LandingNav from "@/components/landing/LandingNav";
import {
  type BrowseFilters,
  type BrowseWorker,
  type BrowseWorkersResponse,
  useBrowseWorkers,
} from "@/features/browse";
import { useSearchStore } from "@/store/searchStore";
import AskAiModal from "./AskAiModal";
import FilterBar from "./FilterBar";
import { WorkerCardGrid } from "./WorkerCard";

interface Props {
  initialData?: BrowseWorkersResponse;
  fontClass?: string;
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

export default function BrowseClient({ initialData, fontClass }: Props) {
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
    <div className={`lp browse ${fontClass ?? ""}`}>
      <LandingNav />

      <main className="browse-main">
        {/* HERO */}
        <header className="bh">
          <p className="bh-eyebrow">Discover skilled professionals</p>
          <h1 className="bh-title">
            Find your <em>fundi.</em>
          </h1>
          <p className="bh-sub">
            Browse vetted tradespeople across Kenya — every profile ID-verified,
            skill-assessed, and reviewed by real customers.
          </p>

          {/* SEARCH BAR */}
          <div className="bh-search">
            <div className="bh-search-field bh-search-main">
              <Search size={19} aria-hidden />
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, skill, or profession…"
                aria-label="Search by name, skill or profession"
              />
            </div>
            <span className="bh-search-div" aria-hidden />
            <div className="bh-search-field bh-search-loc">
              <MapPin size={17} aria-hidden />
              <input
                type="text"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="City or location"
                aria-label="City or location"
              />
            </div>
            <button
              type="button"
              className="bh-search-btn"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </header>

        {/* FILTER TOOLBAR */}
        <FilterBar onAskAi={() => setAiOpen(true)} />

        {/* RESULTS */}
        <section className="results" aria-busy={isFetching}>
          {isLoading ? (
            <div className="wk-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton tiles
                <div key={i} className="wk-skel" />
              ))}
            </div>
          ) : workers.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No fundis match those filters</p>
              <p className="empty-sub">
                Try widening your trade, location or rating filters.
              </p>
              <button type="button" className="empty-btn" onClick={clearAll}>
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="wk-grid">
                {workers.map((w) => (
                  <WorkerCardGrid key={w.id} worker={w} onView={handleView} />
                ))}
              </div>

              {showPagination && (
                <nav className="pager" aria-label="Pagination">
                  <button
                    type="button"
                    className="pager-edge"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </button>
                  {pageList(page, totalPages).map((p, i) =>
                    p === "…" ? (
                      // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis gaps have no stable id
                      <span key={`gap-${i}`} className="pager-gap">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`pager-num ${p === page ? "is-current" : ""}`}
                        onClick={() => goToPage(p)}
                        aria-current={p === page ? "page" : undefined}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    className="pager-edge"
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
