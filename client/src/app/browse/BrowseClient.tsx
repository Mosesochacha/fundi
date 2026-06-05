"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  ArrowRight,
} from "lucide-react";
import "@/app/landing.css";
import "./browse.css";
import LandingNav from "@/components/landing/LandingNav";
import { useAuth } from "@/features/auth";
import { useSearchStore } from "@/store/searchStore";
import {
  useBrowseWorkers,
  type BrowseFilters,
  type BrowseWorker,
  type BrowseWorkersResponse,
} from "@/features/browse";
import FilterBar from "./FilterBar";
import { WorkerCardGrid, WorkerCardList } from "./WorkerCard";
import { SORT_OPTIONS } from "./constants";

interface Props {
  initialData?: BrowseWorkersResponse;
}

export default function BrowseClient({ initialData }: Props) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // --- store filter state (selected individually) ---
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
  const viewMode = useSearchStore((s) => s.viewMode);
  const setFilter = useSearchStore((s) => s.setFilter);
  const setSortBy = useSearchStore((s) => s.setSortBy);
  const setViewMode = useSearchStore((s) => s.setViewMode);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  // --- local UI state ---
  const [limit, setLimit] = useState(12);
  const [nameInput, setNameInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [nameQuery, setNameQuery] = useState(""); // applied client-side
  const [sortOpen, setSortOpen] = useState(false);

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
      page: 1,
      limit,
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
      limit,
    ],
  );

  const { data, isLoading, isFetching } = useBrowseWorkers(filters, { initialData });

  const allWorkers = data?.workers ?? [];
  const total = data?.total ?? 0;

  // Client-side name/skill filter folded on top of the server result.
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

  const hasMore = allWorkers.length < total && !nameQuery.trim();

  // --- handlers ---
  const handleSearch = () => {
    setNameQuery(nameInput);
    setFilter("location", locInput.trim());
    setLimit(12);
  };

  const handleView = (w: BrowseWorker) => router.push(`/worker/${w.username}`);
  const handleHire = (w: BrowseWorker) => {
    if (isLoggedIn) router.push(`/worker/${w.username}`);
    else router.push("/register");
  };

  const activeSort = SORT_OPTIONS.find((s) => s.value === sortBy)?.label ?? "Best match";

  return (
    <div className="lp browse">
      <LandingNav />

      <main className="browse-main">
        {/* PAGE HEADER */}
        <header className="browse-header">
          <div className="bh-top">
            <div className="bh-titleblock">
              <p className="bh-eyebrow">Discover skilled professionals</p>
              <h1 className="bh-title">
                Find your <em>fundi.</em>
              </h1>
            </div>
            <div className="bh-stats">
              <div className="bh-stat">
                <span className="bh-stat-num">48K+</span>
                <span className="bh-stat-label">Workers</span>
              </div>
              <span className="bh-stat-div" aria-hidden />
              <div className="bh-stat">
                <span className="bh-stat-num">12</span>
                <span className="bh-stat-label">Countries</span>
              </div>
              <span className="bh-stat-div" aria-hidden />
              <div className="bh-stat">
                <span className="bh-stat-num">4.9★</span>
                <span className="bh-stat-label">Avg rating</span>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="bh-search">
            <div className="bh-search-field bh-search-main">
              <Search size={18} aria-hidden />
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
              <MapPin size={16} aria-hidden />
              <input
                type="text"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="City or location"
                aria-label="City or location"
              />
            </div>
            <button type="button" className="bh-search-btn" onClick={handleSearch}>
              Search
            </button>
          </div>
        </header>

        {/* STICKY FILTER BAR */}
        <FilterBar />

        {/* RESULTS COUNT BAR */}
        <div className="results-bar">
          <p className="results-count">
            <strong>{total.toLocaleString()}</strong> professionals found
          </p>
          <div className="results-controls">
            <div className="sort-dd">
              <button
                type="button"
                className={`pill ${sortOpen ? "pill-open" : ""}`}
                onClick={() => setSortOpen((o) => !o)}
                onBlur={() => setTimeout(() => setSortOpen(false), 120)}
                aria-expanded={sortOpen}
              >
                {activeSort}
                <ChevronDown size={14} className="pill-chev" aria-hidden />
              </button>
              {sortOpen && (
                <div className="sort-panel">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`sort-opt ${sortBy === o.value ? "active" : ""}`}
                      onMouseDown={() => {
                        setSortBy(o.value);
                        setSortOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="view-toggle">
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid size={15} aria-hidden />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
                aria-pressed={viewMode === "list"}
              >
                <ListIcon size={15} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <section className="results">
          {isLoading ? (
            <div className={viewMode === "grid" ? "grid-wrap" : "list-wrap"}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={viewMode === "grid" ? "wk-skel" : "wk-skel-row"} />
              ))}
            </div>
          ) : workers.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No workers match your filters</p>
              <p className="empty-sub">
                Try widening your budget, location, or trade selection.
              </p>
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => {
                  resetFilters();
                  setNameQuery("");
                  setNameInput("");
                  setLocInput("");
                }}
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid-wrap" aria-busy={isFetching}>
              {workers.map((w) => (
                <WorkerCardGrid key={w.id} worker={w} onView={handleView} onHire={handleHire} />
              ))}
            </div>
          ) : (
            <div className="list-wrap" aria-busy={isFetching}>
              {workers.map((w) => (
                <WorkerCardList key={w.id} worker={w} onView={handleView} onHire={handleHire} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="load-more-wrap">
              <button
                type="button"
                className="load-more"
                onClick={() => setLimit((l) => l + 12)}
                disabled={isFetching}
              >
                {isFetching ? "Loading…" : "Load more professionals"}
                <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
