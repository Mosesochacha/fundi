"use client";

import { ChevronDown, MapPin, Sparkles, Wrench, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

  return (
    <div className="fb" ref={barRef}>
      <div className="fb-toolbar">
        {/* LEFT — filter dropdowns */}
        <div className="fb-left">
          {/* TRADE */}
          <div className="fb-dd">
            <button
              type="button"
              className={`fb-btn ${tradeActive ? "is-active" : ""}`}
              onClick={() => toggle("trade")}
              aria-expanded={open === "trade"}
            >
              <Wrench size={15} aria-hidden />
              {tradeActive ? `Trade · ${selectedTrades.length}` : "Trade"}
              <ChevronDown size={13} className="fb-chev" aria-hidden />
            </button>
            {open === "trade" && (
              <div className="fb-menu fb-menu-trade">
                {TRADES.map((t) => {
                  const checked = selectedTrades.includes(t.name);
                  return (
                    <button
                      key={t.name}
                      type="button"
                      className="fb-opt"
                      onClick={() => toggleTrade(t.name)}
                    >
                      <span
                        className={`fb-box ${checked ? "on" : ""}`}
                        aria-hidden
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="fb-opt-label">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* LOCATION */}
          <div className="fb-dd">
            <button
              type="button"
              className={`fb-btn ${locActive ? "is-active" : ""}`}
              onClick={() => toggle("location")}
              aria-expanded={open === "location"}
            >
              <MapPin size={15} aria-hidden />
              {locActive ? location : "Location"}
              <ChevronDown size={13} className="fb-chev" aria-hidden />
            </button>
            {open === "location" && (
              <div className="fb-menu">
                <button
                  type="button"
                  className="fb-opt fb-opt-row"
                  onClick={() => {
                    setFilter("location", "");
                    setOpen(null);
                  }}
                >
                  <span className="fb-opt-label">All locations</span>
                  {!locActive && <span className="fb-tick">✓</span>}
                </button>
                {CITIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className="fb-opt fb-opt-row"
                    onClick={() => {
                      setFilter("location", location === c.name ? "" : c.name);
                      setOpen(null);
                    }}
                  >
                    <span className="fb-opt-label">{c.name}</span>
                    {location === c.name && <span className="fb-tick">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EXPERIENCE */}
          <div className="fb-dd">
            <button
              type="button"
              className={`fb-btn ${expActive ? "is-active" : ""}`}
              onClick={() => toggle("exp")}
              aria-expanded={open === "exp"}
            >
              {expActive ? expLabel : "Experience"}
              <ChevronDown size={13} className="fb-chev" aria-hidden />
            </button>
            {open === "exp" && (
              <div className="fb-menu">
                {EXP_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className="fb-opt fb-opt-row"
                    onClick={() => {
                      setFilter("minExp", o.value);
                      setOpen(null);
                    }}
                  >
                    <span className="fb-opt-label">{o.label}</span>
                    {minExp === o.value && <span className="fb-tick">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RATING */}
          <div className="fb-dd">
            <button
              type="button"
              className={`fb-btn ${ratingActive ? "is-active" : ""}`}
              onClick={() => toggle("rating")}
              aria-expanded={open === "rating"}
            >
              {ratingActive ? ratingLabel : "Rating"}
              <ChevronDown size={13} className="fb-chev" aria-hidden />
            </button>
            {open === "rating" && (
              <div className="fb-menu">
                {RATING_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className="fb-opt fb-opt-row"
                    onClick={() => {
                      setFilter("minRating", o.value);
                      setOpen(null);
                    }}
                  >
                    <span className="fb-opt-label">{o.label}</span>
                    {minRating === o.value && (
                      <span className="fb-tick">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AVAILABLE NOW */}
          <button
            type="button"
            className={`fb-avail ${availableNow ? "is-on" : ""}`}
            onClick={() => setFilter("availableNow", !availableNow)}
            aria-pressed={availableNow}
          >
            <span className="fb-avail-dot" />
            Available now
          </button>
        </div>

        {/* RIGHT — Ask AI + sort */}
        <div className="fb-right">
          <button type="button" className="fb-askai" onClick={onAskAi}>
            <Sparkles size={15} aria-hidden />
            Ask AI
          </button>
          <div className="fb-sort">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort workers"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="fb-sort-chev" aria-hidden />
          </div>
        </div>
      </div>

      {/* ACTIVE CHIPS */}
      {anyActive && (
        <div className="fb-chips">
          {selectedTrades.map((t) => (
            <span key={t} className="fb-chip">
              {t}
              <button
                type="button"
                onClick={() => toggleTrade(t)}
                aria-label={`Remove ${t}`}
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          ))}
          {locActive && (
            <span className="fb-chip">
              {location}
              <button
                type="button"
                onClick={() => setFilter("location", "")}
                aria-label="Remove location"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          {expActive && (
            <span className="fb-chip">
              {expLabel}
              <button
                type="button"
                onClick={() => setFilter("minExp", 0)}
                aria-label="Remove experience filter"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          {ratingActive && (
            <span className="fb-chip">
              {ratingLabel}
              <button
                type="button"
                onClick={() => setFilter("minRating", 0)}
                aria-label="Remove rating filter"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          {availableNow && (
            <span className="fb-chip">
              Available now
              <button
                type="button"
                onClick={() => setFilter("availableNow", false)}
                aria-label="Remove availability filter"
              >
                <X size={11} aria-hidden />
              </button>
            </span>
          )}
          <button
            type="button"
            className="fb-clear"
            onClick={() => resetFilters()}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
