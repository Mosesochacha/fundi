"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SEARCH_DEFAULTS, useSearchStore } from "@/store/searchStore";
import {
  CITIES,
  EXP_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  TRADES,
} from "./constants";

type OpenPanel = "trade" | "location" | "exp" | "rating" | null;

/* ── Control vocabulary ───────────────────────────────────────────────
   Every control is a ruled field, not a pill: a hairline underline that
   turns gold when the filter is carrying a value. Nothing is boxed, so the
   strip reads as the head of a register rather than a toolbar of buttons. */

const FIELD =
  "group inline-flex items-center gap-2 border-b pb-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] cursor-pointer bg-transparent transition-colors duration-300";
const FIELD_OFF = "border-border text-ink-2 hover:border-gold hover:text-navy";
const FIELD_ON = "border-gold-dark text-gold-deep";

const MENU =
  "pop-in absolute left-0 top-[calc(100%+12px)] z-50 min-w-[224px] rounded-[3px] border border-border bg-white p-1 shadow-[0_28px_54px_-28px_rgba(34,29,22,0.5)]";
const OPT =
  "flex w-full cursor-pointer items-center justify-between gap-3 border-b border-border/60 bg-transparent px-3 py-2.5 text-left text-[13.5px] text-ink-2 transition-colors duration-200 last:border-b-0 hover:bg-cream-2 hover:text-navy";
const OPT_ON = "font-semibold text-navy";

const TAG =
  "inline-flex items-center gap-2 rounded-[2px] border border-gold/45 bg-gold-light px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-gold-deep";
const TAG_X =
  "flex h-3.5 w-3.5 cursor-pointer items-center justify-center bg-transparent text-gold-deep/70 transition-colors duration-200 hover:text-navy";

/** Small rotated square — the page's marker for "selected". */
function Mark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-[7px] w-[7px] flex-none rotate-45 transition-colors duration-200",
        on ? "bg-gold-dark" : "border border-ink-4 group-hover:border-gold",
      )}
    />
  );
}

export default function FilterBar() {
  const selectedTrades = useSearchStore((s) => s.selectedTrades);
  const location = useSearchStore((s) => s.location);
  const availableNow = useSearchStore((s) => s.availableNow);
  const verifiedOnly = useSearchStore((s) => s.verifiedOnly);
  const minRating = useSearchStore((s) => s.minRating);
  const minExp = useSearchStore((s) => s.minExp);
  const sortBy = useSearchStore((s) => s.sortBy);

  const toggleTrade = useSearchStore((s) => s.toggleTrade);
  const setFilter = useSearchStore((s) => s.setFilter);
  const setSortBy = useSearchStore((s) => s.setSortBy);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [open, setOpen] = useState<OpenPanel>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (panel: OpenPanel) =>
    setOpen((cur) => (cur === panel ? null : panel));

  const D = SEARCH_DEFAULTS;
  const tradeActive = selectedTrades.length > 0;
  const locActive = location !== D.location;
  const expActive = minExp > 0;
  const ratingActive = minRating > 0;
  const anyActive =
    tradeActive ||
    locActive ||
    expActive ||
    ratingActive ||
    availableNow ||
    verifiedOnly;

  const expLabel = EXP_OPTIONS.find((o) => o.value === minExp)?.label;
  const ratingLabel = RATING_OPTIONS.find((o) => o.value === minRating)?.label;

  return (
    <div
      className="relative z-40 border-b border-border bg-cream/92 backdrop-blur-[10px] md:sticky md:top-16"
      ref={barRef}
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 md:px-8">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4 py-4">
          <span className="hidden items-center gap-2.5 pb-1.5 text-[10px] font-bold tracking-[0.2em] text-ink-3 uppercase lg:inline-flex">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rotate-45 bg-gold"
            />
            Refine
          </span>

          {/* Trade — multi-select */}
          <div className="relative">
            <button
              type="button"
              className={cn(FIELD, tradeActive ? FIELD_ON : FIELD_OFF)}
              onClick={() => toggle("trade")}
              aria-expanded={open === "trade"}
              aria-haspopup="true"
            >
              {tradeActive
                ? `Trade · ${String(selectedTrades.length).padStart(2, "0")}`
                : "Trade"}
              <ChevronDown
                size={12}
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-300",
                  open === "trade" && "rotate-180",
                )}
              />
            </button>
            {open === "trade" && (
              <div className={cn(MENU, "min-w-[246px]")}>
                {TRADES.map((t) => {
                  const checked = selectedTrades.includes(t.name);
                  return (
                    <button
                      key={t.name}
                      type="button"
                      className={cn(OPT, checked && OPT_ON)}
                      onClick={() => toggleTrade(t.name)}
                      aria-pressed={checked}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-[13px] w-[13px] flex-none rounded-[2px] border transition-colors duration-200",
                            checked
                              ? "border-gold-dark bg-gold-dark"
                              : "border-ink-4 bg-white",
                          )}
                        />
                        {t.name}
                      </span>
                      <span className="text-[11px] font-semibold tabular-nums text-ink-3">
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="relative">
            <button
              type="button"
              className={cn(FIELD, locActive ? FIELD_ON : FIELD_OFF)}
              onClick={() => toggle("location")}
              aria-expanded={open === "location"}
              aria-haspopup="true"
            >
              {locActive ? location : "Location"}
              <ChevronDown
                size={12}
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-300",
                  open === "location" && "rotate-180",
                )}
              />
            </button>
            {open === "location" && (
              <div className={MENU}>
                <button
                  type="button"
                  className={cn(OPT, !locActive && OPT_ON)}
                  onClick={() => {
                    setFilter("location", "");
                    setOpen(null);
                  }}
                >
                  Everywhere
                  {!locActive && <Mark on />}
                </button>
                {CITIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={cn(OPT, location === c.name && OPT_ON)}
                    onClick={() => {
                      setFilter("location", location === c.name ? "" : c.name);
                      setOpen(null);
                    }}
                  >
                    {c.name}
                    {location === c.name ? (
                      <Mark on />
                    ) : (
                      <span className="text-[11px] font-semibold tabular-nums text-ink-3">
                        {c.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="relative">
            <button
              type="button"
              className={cn(FIELD, expActive ? FIELD_ON : FIELD_OFF)}
              onClick={() => toggle("exp")}
              aria-expanded={open === "exp"}
              aria-haspopup="true"
            >
              {expActive ? expLabel : "Experience"}
              <ChevronDown
                size={12}
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-300",
                  open === "exp" && "rotate-180",
                )}
              />
            </button>
            {open === "exp" && (
              <div className={MENU}>
                {EXP_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={cn(OPT, minExp === o.value && OPT_ON)}
                    onClick={() => {
                      setFilter("minExp", o.value);
                      setOpen(null);
                    }}
                  >
                    {o.label}
                    {minExp === o.value && <Mark on />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="relative">
            <button
              type="button"
              className={cn(FIELD, ratingActive ? FIELD_ON : FIELD_OFF)}
              onClick={() => toggle("rating")}
              aria-expanded={open === "rating"}
              aria-haspopup="true"
            >
              {ratingActive ? ratingLabel : "Rating"}
              <ChevronDown
                size={12}
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-300",
                  open === "rating" && "rotate-180",
                )}
              />
            </button>
            {open === "rating" && (
              <div className={MENU}>
                {RATING_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={cn(OPT, minRating === o.value && OPT_ON)}
                    onClick={() => {
                      setFilter("minRating", o.value);
                      setOpen(null);
                    }}
                  >
                    {o.label}
                    {minRating === o.value && <Mark on />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Binary switches — marked, not filled */}
          <button
            type="button"
            className={cn(FIELD, availableNow ? FIELD_ON : FIELD_OFF)}
            onClick={() => setFilter("availableNow", !availableNow)}
            aria-pressed={availableNow}
          >
            <Mark on={availableNow} />
            Available now
          </button>

          <button
            type="button"
            className={cn(FIELD, verifiedOnly ? FIELD_ON : FIELD_OFF)}
            onClick={() => setFilter("verifiedOnly", !verifiedOnly)}
            aria-pressed={verifiedOnly}
          >
            <Mark on={verifiedOnly} />
            Verified only
          </button>

          {/* Order — right-aligned, same ruled field language */}
          <div className="relative ml-auto flex items-center gap-3">
            <label
              htmlFor="browse-sort"
              className="hidden text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase sm:block"
            >
              Ordered by
            </label>
            <div className="relative">
              <select
                id="browse-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer appearance-none border-b border-border bg-transparent pr-6 pb-1.5 text-[11.5px] font-bold tracking-[0.14em] text-navy uppercase outline-none transition-colors duration-300 hover:border-gold focus-visible:border-gold-dark"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                aria-hidden="true"
                className="pointer-events-none absolute right-0 bottom-2 text-ink-3"
              />
            </div>
          </div>
        </div>

        {anyActive && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/70 py-3">
            {selectedTrades.map((t) => (
              <span key={t} className={TAG}>
                {t}
                <button
                  type="button"
                  className={TAG_X}
                  onClick={() => toggleTrade(t)}
                  aria-label={`Remove ${t}`}
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            ))}
            {locActive && (
              <span className={TAG}>
                {location}
                <button
                  type="button"
                  className={TAG_X}
                  onClick={() => setFilter("location", "")}
                  aria-label="Remove location"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
            {expActive && (
              <span className={TAG}>
                {expLabel}
                <button
                  type="button"
                  className={TAG_X}
                  onClick={() => setFilter("minExp", 0)}
                  aria-label="Remove experience filter"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
            {ratingActive && (
              <span className={TAG}>
                {ratingLabel}
                <button
                  type="button"
                  className={TAG_X}
                  onClick={() => setFilter("minRating", 0)}
                  aria-label="Remove rating filter"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
            {availableNow && (
              <span className={TAG}>
                Available now
                <button
                  type="button"
                  className={TAG_X}
                  onClick={() => setFilter("availableNow", false)}
                  aria-label="Remove availability filter"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
            {verifiedOnly && (
              <span className={TAG}>
                Verified only
                <button
                  type="button"
                  className={TAG_X}
                  onClick={() => setFilter("verifiedOnly", false)}
                  aria-label="Remove verified filter"
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
            <button
              type="button"
              className="ml-1 cursor-pointer bg-transparent text-[10.5px] font-bold tracking-[0.14em] text-ink-3 uppercase underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-navy hover:decoration-gold"
              onClick={() => resetFilters()}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
