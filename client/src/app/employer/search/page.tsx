"use client";

import { CheckCircle2, MapPin, Search, Star } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  bannerGradient,
  formatRate,
  SORT_OPTIONS,
  TRADES,
  tradeAccent,
} from "@/app/browse/constants";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import {
  type BrowseFilters,
  type BrowseWorker,
  useBrowseWorkers,
} from "@/features/browse";
import { useSearchStore } from "@/store/searchStore";
import HireModal from "../dashboard/HireModal";

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
      <div className="flex flex-col gap-4 text-ink-2">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div>
          <div className="text-xs text-ink-3">Hire a fundi</div>
          <h1 className="font-serif text-[26px] font-normal text-ink mt-0.5 leading-[1.15]">
            Find a fundi.
          </h1>
          <p className="text-[13px] text-ink-3 mt-1">
            Browse verified tradespeople near you and send a hire request.
          </p>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          <div className={SEARCH_FIELD}>
            <Search size={17} aria-hidden />
            <input
              type="text"
              className={SEARCH_INPUT}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, skill or profession…"
              aria-label="Search by name, skill or profession"
            />
          </div>
          <div className={SEARCH_FIELD}>
            <MapPin size={16} aria-hidden />
            <input
              type="text"
              className={SEARCH_INPUT}
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="City or location"
              aria-label="City or location"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-gold text-navy border border-gold rounded-[10px] px-[18px] py-2.5 text-[13px] font-medium cursor-pointer hover:bg-gold-dark hover:border-gold-dark"
            onClick={handleSearch}
          >
            <Search size={15} /> Search
          </button>
        </div>

        {/* ── Filter toolbar ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0 pb-0.5">
            {TRADES.map((t) => {
              const active = selectedTrades.includes(t.name);
              return (
                <button
                  key={t.name}
                  type="button"
                  className={`inline-flex items-center gap-[5px] whitespace-nowrap border rounded-full px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                    active
                      ? "bg-gold-light border-gold text-gold-dark font-semibold"
                      : "bg-white border-border text-ink-2 hover:border-gold"
                  }`}
                  onClick={() => toggleTrade(t.name)}
                >
                  <span aria-hidden>{t.emoji}</span> {t.name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 whitespace-nowrap border rounded-full px-3 py-1.5 text-xs cursor-pointer ${
              availableNow
                ? "bg-gold-light border-gold text-gold-dark font-semibold"
                : "bg-white border-border text-ink-2"
            }`}
            onClick={() => setFilter("availableNow", !availableNow)}
          >
            Available now
          </button>
          <select
            className="text-xs text-ink-2 bg-white border border-border rounded-full px-3 py-1.5 cursor-pointer"
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
            <button type="button" className={CLEAR_BTN} onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className={GRID}>
            {Array.from({ length: 9 }, (_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton tiles
                key={i}
                className="h-[232px] bg-border rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center text-center px-6 py-12 bg-white border border-border rounded-xl">
            <div className="text-sm font-medium text-ink-2">
              No fundis match those filters
            </div>
            <p className="text-[13px] text-ink-3 mt-1 max-w-[280px] leading-relaxed">
              Try widening your trade, location or availability filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className={`${CLEAR_BTN} mt-3`}
                onClick={clearAll}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={GRID}>
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
              <nav
                className="flex items-center justify-center gap-1 mt-2"
                aria-label="Pagination"
              >
                <button
                  type="button"
                  className={PAGER_BTN}
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  ← Prev
                </button>
                {pageList(page, totalPages).map((p, i) =>
                  p === "…" ? (
                    // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis gaps have no stable id
                    <span key={`gap-${i}`} className="text-ink-3 px-1">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`${PAGER_BTN} ${
                        p === page
                          ? "bg-gold border-gold text-navy font-semibold"
                          : ""
                      }`}
                      onClick={() => goToPage(p)}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className={PAGER_BTN}
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
    <article className="flex flex-col bg-white border border-border rounded-xl overflow-hidden">
      <div
        className="h-14 relative"
        style={{ background: bannerGradient(worker.trade) }}
      >
        <span
          className={`absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-white/85 ${
            worker.isAvailable ? "text-green-600" : "text-ink-3"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {worker.isAvailable ? "Available" : "Booked"}
        </span>
      </div>
      <div className="px-4 pb-4 -mt-[22px]">
        <span
          className="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center text-[15px] font-semibold overflow-hidden bg-gold-light"
          style={{ color: accent }}
        >
          {worker.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            // biome-ignore lint/performance/noImgElement: avatar URLs are arbitrary external hosts
            <img
              src={worker.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            worker.initials || initialsOf(worker.name)
          )}
        </span>

        <div className="flex items-center gap-[5px] text-sm font-semibold text-ink mt-2">
          {worker.name}
          {worker.isVerified && (
            <span
              className="text-gold-dark inline-flex"
              role="img"
              aria-label="Verified"
            >
              <CheckCircle2 size={14} />
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-[5px] text-xs font-medium mt-[3px]"
          style={{ color: accent }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accent }}
          />
          {worker.trade}
        </div>

        {worker.location && (
          <p className="flex items-center gap-1 text-[11px] text-ink-3 mt-[5px]">
            <MapPin size={12} aria-hidden /> {worker.location}
          </p>
        )}

        <p className="text-xs text-ink-2 leading-normal mt-2 line-clamp-2 min-h-9">
          {worker.bio || "No bio yet."}
        </p>

        <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-ink-3 mt-2.5 pt-2.5 border-t border-border [&_strong]:text-ink">
          {worker.reviewCount > 0 && (
            <span>
              <Star
                size={11}
                fill="currentColor"
                strokeWidth={0}
                className="text-gold"
              />{" "}
              <strong>{worker.rating.toFixed(1)}</strong>
            </span>
          )}
          <span>
            <strong>{worker.jobsDone}</strong> jobs
          </span>
          <span className="ml-auto bg-gold-light border border-gold/40 text-gold-dark text-[11px] font-semibold rounded-full px-2 py-px">
            {formatRate(worker.currency, worker.dailyRate)}
          </span>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            className={`${ES_BTN} ${ES_BTN_OUTLINE}`}
            onClick={onView}
          >
            Profile
          </button>
          <button
            type="button"
            className={`${ES_BTN} ${ES_BTN_GOLD}`}
            onClick={onHire}
          >
            Hire
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Shared class strings (ported from search.css) ──────────────────────── */
const GRID =
  "grid grid-cols-1 min-[640px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-3";
const SEARCH_FIELD =
  "flex items-center gap-2 flex-1 min-w-[180px] bg-white border border-border rounded-[10px] px-3 py-2.5 text-ink-3 focus-within:border-gold";
const SEARCH_INPUT =
  "border-0 outline-none bg-transparent text-[13px] text-ink w-full";
const CLEAR_BTN =
  "text-xs text-gold-dark bg-none border-0 cursor-pointer underline whitespace-nowrap";
const PAGER_BTN =
  "text-xs text-ink-2 bg-white border border-border rounded-lg px-[11px] py-1.5 cursor-pointer enabled:hover:border-gold disabled:opacity-50 disabled:cursor-not-allowed";
const ES_BTN =
  "flex-1 inline-flex items-center justify-center gap-1.5 font-medium text-xs px-3 py-2 rounded-lg border border-transparent cursor-pointer no-underline";
const ES_BTN_OUTLINE =
  "bg-white text-ink-2 border-border hover:border-gold hover:bg-gold-light hover:text-ink";
const ES_BTN_GOLD =
  "bg-gold text-navy border-gold hover:bg-gold-dark hover:border-gold-dark";
