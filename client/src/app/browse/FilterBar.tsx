"use client";

import { ChevronDown, MapPin, Sparkles, Wrench, X } from "lucide-react";
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

interface Props {
  onAskAi: () => void;
}

const FB_BTN =
  "flex items-center gap-[9px] rounded-[11px] border bg-white px-[15px] py-2.5 text-sm font-semibold text-ink-2 transition-colors duration-150 hover:border-ink-4";
const FB_MENU =
  "absolute left-0 top-[calc(100%+8px)] z-40 min-w-[200px] rounded-[14px] border border-border bg-white p-2.5 shadow-[0_16px_44px_rgba(33,28,20,0.18)]";
const FB_OPT =
  "flex w-full items-center gap-[11px] rounded-[9px] border-none bg-transparent px-2.5 py-2 text-left text-sm text-ink-2 cursor-pointer hover:bg-cream-2";
const FB_OPT_ROW = "justify-between";
const FB_TICK = "font-bold text-gold-dark";
const FB_CHIP =
  "flex items-center gap-[7px] rounded-full border border-border bg-white px-3 py-1.5 pl-[13px] text-sm font-semibold text-ink-2";
const FB_CHIP_BTN =
  "flex h-[18px] w-[18px] items-center justify-center rounded-full border-none bg-gold-light text-ink-3 cursor-pointer transition-all duration-150 hover:bg-navy hover:text-white";

export default function FilterBar({ onAskAi }: Props) {
  const selectedTrades = useSearchStore((s) => s.selectedTrades);
  const location = useSearchStore((s) => s.location);
  const availableNow = useSearchStore((s) => s.availableNow);
  const minRating = useSearchStore((s) => s.minRating);
  const minExp = useSearchStore((s) => s.minExp);
  const sortBy = useSearchStore((s) => s.sortBy);

  const toggleTrade = useSearchStore((s) => s.toggleTrade);
  const setFilter = useSearchStore((s) => s.setFilter);
  const setSortBy = useSearchStore((s) => s.setSortBy);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [open, setOpen] = useState<OpenPanel>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Click-outside / Escape closes any open panel.
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
    tradeActive || locActive || expActive || ratingActive || availableNow;

  const expLabel = EXP_OPTIONS.find((o) => o.value === minExp)?.label;
  const ratingLabel = RATING_OPTIONS.find((o) => o.value === minRating)?.label;

  const fbBtnActive = "bg-gold-light border-gold hover:border-gold";
  const fbBtnBorder = "border-border";

  return (
    <div
      className="relative z-30 mx-auto max-w-[1240px] px-5 pt-[30px] md:px-10"
      ref={barRef}
    >
      <div className="flex flex-wrap items-start justify-between gap-3.5 md:items-center">
        {/* LEFT - filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* TRADE */}
          <div className="relative">
            <button
              type="button"
              className={cn(FB_BTN, tradeActive ? fbBtnActive : fbBtnBorder)}
              onClick={() => toggle("trade")}
              aria-expanded={open === "trade"}
            >
              <Wrench size={15} aria-hidden className="text-ink-3" />
              {tradeActive ? `Trade · ${selectedTrades.length}` : "Trade"}
              <ChevronDown size={13} className="text-ink-3" aria-hidden />
            </button>
            {open === "trade" && (
              <div className={cn(FB_MENU, "min-w-[236px]")}>
                {TRADES.map((t) => {
                  const checked = selectedTrades.includes(t.name);
                  return (
                    <button
                      key={t.name}
                      type="button"
                      className={FB_OPT}
                      onClick={() => toggleTrade(t.name)}
                    >
                      <span
                        className={cn(
                          "flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px] text-[11px] font-bold text-white",
                          checked
                            ? "border-gold-dark bg-gold-dark"
                            : "border-border bg-white",
                        )}
                        aria-hidden
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="flex-1">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* LOCATION */}
          <div className="relative">
            <button
              type="button"
              className={cn(FB_BTN, locActive ? fbBtnActive : fbBtnBorder)}
              onClick={() => toggle("location")}
              aria-expanded={open === "location"}
            >
              <MapPin size={15} aria-hidden className="text-ink-3" />
              {locActive ? location : "Location"}
              <ChevronDown size={13} className="text-ink-3" aria-hidden />
            </button>
            {open === "location" && (
              <div className={FB_MENU}>
                <button
                  type="button"
                  className={cn(FB_OPT, FB_OPT_ROW)}
                  onClick={() => {
                    setFilter("location", "");
                    setOpen(null);
                  }}
                >
                  <span className="flex-1">All locations</span>
                  {!locActive && <span className={FB_TICK}>✓</span>}
                </button>
                {CITIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className={cn(FB_OPT, FB_OPT_ROW)}
                    onClick={() => {
                      setFilter("location", location === c.name ? "" : c.name);
                      setOpen(null);
                    }}
                  >
                    <span className="flex-1">{c.name}</span>
                    {location === c.name && <span className={FB_TICK}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EXPERIENCE */}
          <div className="relative">
            <button
              type="button"
              className={cn(FB_BTN, expActive ? fbBtnActive : fbBtnBorder)}
              onClick={() => toggle("exp")}
              aria-expanded={open === "exp"}
            >
              {expActive ? expLabel : "Experience"}
              <ChevronDown size={13} className="text-ink-3" aria-hidden />
            </button>
            {open === "exp" && (
              <div className={FB_MENU}>
                {EXP_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={cn(FB_OPT, FB_OPT_ROW)}
                    onClick={() => {
                      setFilter("minExp", o.value);
                      setOpen(null);
                    }}
                  >
                    <span className="flex-1">{o.label}</span>
                    {minExp === o.value && <span className={FB_TICK}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RATING */}
          <div className="relative">
            <button
              type="button"
              className={cn(FB_BTN, ratingActive ? fbBtnActive : fbBtnBorder)}
              onClick={() => toggle("rating")}
              aria-expanded={open === "rating"}
            >
              {ratingActive ? ratingLabel : "Rating"}
              <ChevronDown size={13} className="text-ink-3" aria-hidden />
            </button>
            {open === "rating" && (
              <div className={FB_MENU}>
                {RATING_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={cn(FB_OPT, FB_OPT_ROW)}
                    onClick={() => {
                      setFilter("minRating", o.value);
                      setOpen(null);
                    }}
                  >
                    <span className="flex-1">{o.label}</span>
                    {minRating === o.value && (
                      <span className={FB_TICK}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AVAILABLE NOW */}
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-[11px] border px-4 py-2.5 text-sm font-semibold",
              availableNow
                ? "border-gold-dark bg-gold-dark text-white"
                : "border-border bg-white text-ink-2",
            )}
            onClick={() => setFilter("availableNow", !availableNow)}
            aria-pressed={availableNow}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                availableNow ? "bg-white" : "bg-green-500",
              )}
            />
            Available now
          </button>
        </div>

        {/* RIGHT - Ask AI + sort */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2.5 md:w-auto md:justify-start">
          <button
            type="button"
            className="flex items-center gap-2 rounded-[11px] border border-navy bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-[180ms] hover:border-gold-dark hover:bg-gold-dark"
            onClick={onAskAi}
          >
            <Sparkles size={15} aria-hidden />
            Ask AI
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort workers"
              className="cursor-pointer appearance-none rounded-[11px] border border-border bg-white py-2.5 pl-3.5 pr-[38px] text-sm text-ink-2 outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2 text-ink-3"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* ACTIVE CHIPS */}
      {anyActive && (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {selectedTrades.map((t) => (
            <span key={t} className={FB_CHIP}>
              {t}
              <button
                type="button"
                className={FB_CHIP_BTN}
                onClick={() => toggleTrade(t)}
                aria-label={`Remove ${t}`}
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))}
          {locActive && (
            <span className={FB_CHIP}>
              {location}
              <button
                type="button"
                className={FB_CHIP_BTN}
                onClick={() => setFilter("location", "")}
                aria-label="Remove location"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          {expActive && (
            <span className={FB_CHIP}>
              {expLabel}
              <button
                type="button"
                className={FB_CHIP_BTN}
                onClick={() => setFilter("minExp", 0)}
                aria-label="Remove experience filter"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          {ratingActive && (
            <span className={FB_CHIP}>
              {ratingLabel}
              <button
                type="button"
                className={FB_CHIP_BTN}
                onClick={() => setFilter("minRating", 0)}
                aria-label="Remove rating filter"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          {availableNow && (
            <span className={FB_CHIP}>
              Available now
              <button
                type="button"
                className={FB_CHIP_BTN}
                onClick={() => setFilter("availableNow", false)}
                aria-label="Remove availability filter"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          <button
            type="button"
            className="border-none bg-transparent px-2 py-1.5 text-sm font-semibold text-gold-dark cursor-pointer"
            onClick={() => resetFilters()}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
