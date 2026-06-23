"use client";

import { CheckCircle2, MapPin, Search, Star } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import {
  type BrowseFilters,
  type BrowseWorker,
  useBrowseWorkers,
} from "@/features/browse";
import { useSearchStore } from "@/store/searchStore";
import {
  bannerGradient,
  formatRate,
  SORT_OPTIONS,
  TRADES,
  tradeAccent,
} from "@/app/browse/constants";
import HireModal from "../dashboard/HireModal";
import "./search.css";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

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

type HireTarget = { id: string; name: string; trade: string };

export default function EmployerSearchPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useAuth();

  // Shared filter store (same one /browse uses).
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
  const toggleTrade = useSearchStore((s) => s.toggleTrade);
  const setFilter = useSearchStore((s) => s.setFilter);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [page, setPage] = useState(1);
  const [nameInput, setNameInput] = useState("");
  const [locInput, setLocInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [hireTarget, setHireTarget] = useState<HireTarget | null>(null);

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";
  const shellUser = { name, initials: initialsOf(name) };
  const employerLocation = profile?.location ?? "";

  // Any filter change resets to the first page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset triggers
  useEffect(() => {
    setPage(1);
  }, [selectedTrades, location, availableNow, sortBy, nameQuery]);

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

  const { data, isLoading } = useBrowseWorkers(filters);
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

  const handleSearch = () => {
    setNameQuery(nameInput);
    setFilter("location", locInput.trim());
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

  const hasActiveFilters =
    selectedTrades.length > 0 || !!location || availableNow || !!nameQuery;
  const showPagination = !nameQuery.trim() && totalPages > 1;

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <div className="es">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div>
          <div className="es-head-date">Hire a fundi</div>
          <h1 className="es-title">Find a fundi.</h1>
          <p className="es-sub">
            Browse verified tradespeople near you and send a hire request.
          </p>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div className="es-search">
          <div className="es-search-field">
            <Search size={17} aria-hidden />
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, skill or profession…"
              aria-label="Search by name, skill or profession"
            />
          </div>
          <div className="es-search-field">
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
          <button type="button" className="es-search-btn" onClick={handleSearch}>
            <Search size={15} /> Search
          </button>
        </div>

        {/* ── Filter toolbar ──────────────────────────────────────────── */}
        <div className="es-filters">
          <div className="es-chips">
            {TRADES.map((t) => {
              const active = selectedTrades.includes(t.name);
              return (
                <button
                  key={t.name}
                  type="button"
                  className={`es-chip${active ? " is-active" : ""}`}
                  onClick={() => toggleTrade(t.name)}
                >
                  <span aria-hidden>{t.emoji}</span> {t.name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`es-toggle${availableNow ? " is-active" : ""}`}
            onClick={() => setFilter("availableNow", !availableNow)}
          >
            Available now
          </button>
          <select
            className="es-select"
            value={sortBy}
            onChange={(e) => setFilter("sortBy", e.target.value)}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button type="button" className="es-clear" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="es-grid">
            {Array.from({ length: 9 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton tiles
              <div key={i} className="es-skel" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="es-empty">
            <div className="es-empty-title">No fundis match those filters</div>
            <p className="es-empty-sub">
              Try widening your trade, location or availability filters.
            </p>
            {hasActiveFilters && (
              <button type="button" className="es-clear" onClick={clearAll}>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="es-grid">
              {workers.map((w) => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  onView={() => router.push(`/worker/${w.username}`)}
                  onHire={() =>
                    setHireTarget({ id: w.id, name: w.name, trade: w.trade })
                  }
                />
              ))}
            </div>

            {showPagination && (
              <nav className="es-pager" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  ← Prev
                </button>
                {pageList(page, totalPages).map((p, i) =>
                  p === "…" ? (
                    // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis gaps have no stable id
                    <span key={`gap-${i}`} className="es-pager-gap">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={p === page ? "is-current" : ""}
                      onClick={() => goToPage(p)}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      <HireModal
        worker={hireTarget}
        defaultLocation={employerLocation}
        onClose={() => setHireTarget(null)}
      />
    </Shell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Worker card (employer-styled, with Hire action)
   ───────────────────────────────────────────────────────────────────────── */
function WorkerCard({
  worker,
  onView,
  onHire,
}: {
  worker: BrowseWorker;
  onView: () => void;
  onHire: () => void;
}) {
  const accent = tradeAccent(worker.trade);
  return (
    <article className="es-card">
      <div
        className="es-card-banner"
        style={{ background: bannerGradient(worker.trade) }}
      >
        <span
          className={`es-avail ${worker.isAvailable ? "is-avail" : "is-booked"}`}
        >
          <span className="es-avail-dot" />
          {worker.isAvailable ? "Available" : "Booked"}
        </span>
      </div>
      <div className="es-card-body">
        <span
          className="es-card-avatar"
          style={{ background: "var(--gold-light)", color: accent }}
        >
          {worker.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={worker.avatarUrl} alt="" />
          ) : (
            worker.initials || initialsOf(worker.name)
          )}
        </span>

        <div className="es-card-name">
          {worker.name}
          {worker.isVerified && (
            <span className="es-card-check" aria-label="Verified">
              <CheckCircle2 size={14} />
            </span>
          )}
        </div>

        <div className="es-card-trade" style={{ color: accent }}>
          <span className="es-card-dot" style={{ background: accent }} />
          {worker.trade}
        </div>

        {worker.location && (
          <p className="es-card-loc">
            <MapPin size={12} aria-hidden /> {worker.location}
          </p>
        )}

        <p className="es-card-bio">{worker.bio || "No bio yet."}</p>

        <div className="es-card-meta">
          {worker.reviewCount > 0 && (
            <span>
              <Star
                size={11}
                fill="currentColor"
                strokeWidth={0}
                style={{ color: "var(--gold)" }}
              />{" "}
              <strong>{worker.rating.toFixed(1)}</strong>
            </span>
          )}
          <span>
            <strong>{worker.jobsDone}</strong> jobs
          </span>
          <span className="es-card-rate">
            {formatRate(worker.currency, worker.dailyRate)}
          </span>
        </div>

        <div className="es-card-actions">
          <button type="button" className="es-btn es-btn-outline" onClick={onView}>
            Profile
          </button>
          <button type="button" className="es-btn es-btn-gold" onClick={onHire}>
            Hire
          </button>
        </div>
      </div>
    </article>
  );
}
