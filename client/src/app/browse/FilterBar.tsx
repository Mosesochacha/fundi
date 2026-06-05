"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wrench,
  MapPin,
  Coins,
  SlidersHorizontal,
  CircleCheck,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { SEARCH_DEFAULTS, useSearchStore } from "@/store/searchStore";
import {
  TRADES,
  CITIES,
  RATING_OPTIONS,
  EXP_OPTIONS,
  BUDGET_PRESETS,
} from "./constants";

type OpenPanel = "trade" | "location" | "budget" | "more" | null;

export default function FilterBar() {
  const selectedTrades = useSearchStore((s) => s.selectedTrades);
  const location = useSearchStore((s) => s.location);
  const availableNow = useSearchStore((s) => s.availableNow);
  const verifiedOnly = useSearchStore((s) => s.verifiedOnly);
  const certified = useSearchStore((s) => s.certified);
  const minRate = useSearchStore((s) => s.minRate);
  const maxRate = useSearchStore((s) => s.maxRate);
  const minRating = useSearchStore((s) => s.minRating);
  const minExp = useSearchStore((s) => s.minExp);

  const toggleTrade = useSearchStore((s) => s.toggleTrade);
  const setFilter = useSearchStore((s) => s.setFilter);
  const resetFilters = useSearchStore((s) => s.resetFilters);

  const [open, setOpen] = useState<OpenPanel>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Click-outside closes any open panel.
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

  const toggle = (panel: OpenPanel) => setOpen((cur) => (cur === panel ? null : panel));

  // Active-filter detection — measured against the store's default config.
  const D = SEARCH_DEFAULTS;
  const tradeActive = selectedTrades.length > 0;
  const locActive = location !== D.location;
  const budgetActive = minRate !== D.minRate || maxRate !== D.maxRate;
  const moreActive =
    verifiedOnly !== D.verifiedOnly ||
    certified !== D.certified ||
    minRating !== D.minRating ||
    minExp !== D.minExp;
  const anyActive =
    tradeActive ||
    locActive ||
    budgetActive ||
    moreActive ||
    availableNow !== D.availableNow;

  const activePreset = BUDGET_PRESETS.find(
    (p) => p.min === minRate && p.max === maxRate,
  )?.label;

  return (
    <div className="filter-bar" ref={barRef}>
      <div className="filter-row">
        {/* TRADE */}
        <div className="fb-dd">
          <button
            type="button"
            className={`pill ${tradeActive ? "pill-active" : ""} ${open === "trade" ? "pill-open" : ""}`}
            onClick={() => toggle("trade")}
            aria-expanded={open === "trade"}
          >
            <Wrench size={14} aria-hidden />
            Trade
            {tradeActive && <span className="pill-badge">{selectedTrades.length}</span>}
            <ChevronDown size={14} className="pill-chev" aria-hidden />
          </button>
          {open === "trade" && (
            <div className="fb-panel fb-panel-trade">
              <p className="fb-panel-title">Select trade</p>
              <div className="fb-trade-grid">
                {TRADES.map((t) => {
                  const checked = selectedTrades.includes(t.name);
                  return (
                    <button
                      key={t.name}
                      type="button"
                      className={`fb-trade-item ${checked ? "checked" : ""}`}
                      onClick={() => toggleTrade(t.name)}
                    >
                      <span className="fb-trade-emoji" aria-hidden>{t.emoji}</span>
                      <span className="fb-trade-text">
                        <span className="fb-trade-name">{t.name}</span>
                        <span className="fb-trade-count">{t.count}</span>
                      </span>
                      <span className={`fb-check ${checked ? "on" : ""}`} aria-hidden>
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* LOCATION */}
        <div className="fb-dd">
          <button
            type="button"
            className={`pill ${locActive ? "pill-active" : ""} ${open === "location" ? "pill-open" : ""}`}
            onClick={() => toggle("location")}
            aria-expanded={open === "location"}
          >
            <MapPin size={14} aria-hidden />
            {locActive ? location : "Location"}
            <ChevronDown size={14} className="pill-chev" aria-hidden />
          </button>
          {open === "location" && (
            <div className="fb-panel fb-panel-loc">
              <p className="fb-panel-title">Popular locations</p>
              <ul className="fb-loc-list">
                {CITIES.map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      className={`fb-loc-item ${location === c.name ? "active" : ""}`}
                      onClick={() => {
                        setFilter("location", location === c.name ? "" : c.name);
                        setOpen(null);
                      }}
                    >
                      <span className="fb-loc-name">
                        <MapPin size={12} aria-hidden />
                        {c.name}
                      </span>
                      <span className="fb-loc-count">{c.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* BUDGET */}
        <div className="fb-dd">
          <button
            type="button"
            className={`pill ${budgetActive ? "pill-active" : ""} ${open === "budget" ? "pill-open" : ""}`}
            onClick={() => toggle("budget")}
            aria-expanded={open === "budget"}
          >
            <Coins size={14} aria-hidden />
            Budget
            <ChevronDown size={14} className="pill-chev" aria-hidden />
          </button>
          {open === "budget" && (
            <div className="fb-panel fb-panel-budget">
              <p className="fb-panel-title">Daily rate (KSh)</p>
              <div className="fb-rate-inputs">
                <input
                  type="number"
                  min={500}
                  max={10000}
                  step={100}
                  value={minRate}
                  onChange={(e) =>
                    setFilter("minRate", Math.min(Number(e.target.value) || 0, maxRate))
                  }
                  aria-label="Minimum daily rate"
                />
                <span className="fb-rate-sep">—</span>
                <input
                  type="number"
                  min={500}
                  max={10000}
                  step={100}
                  value={maxRate}
                  onChange={(e) =>
                    setFilter("maxRate", Math.max(Number(e.target.value) || 0, minRate))
                  }
                  aria-label="Maximum daily rate"
                />
              </div>
              <input
                type="range"
                className="fb-range"
                min={500}
                max={10000}
                step={100}
                value={maxRate}
                onChange={(e) => setFilter("maxRate", Number(e.target.value))}
                aria-label="Maximum daily rate slider"
              />
              <div className="fb-presets">
                {BUDGET_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={`fb-preset ${activePreset === p.label ? "active" : ""}`}
                    onClick={() => {
                      setFilter("minRate", p.min);
                      setFilter("maxRate", p.max);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MORE FILTERS */}
        <div className="fb-dd">
          <button
            type="button"
            className={`pill ${moreActive ? "pill-active" : ""} ${open === "more" ? "pill-open" : ""}`}
            onClick={() => toggle("more")}
            aria-expanded={open === "more"}
          >
            <SlidersHorizontal size={14} aria-hidden />
            More filters
            <ChevronDown size={14} className="pill-chev" aria-hidden />
          </button>
          {open === "more" && (
            <div className="fb-panel fb-panel-more">
              <p className="fb-panel-title">Trust &amp; verification</p>
              <label className="fb-toggle-row">
                <span>Verified only</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={verifiedOnly}
                  className={`fb-switch ${verifiedOnly ? "on" : ""}`}
                  onClick={() => setFilter("verifiedOnly", !verifiedOnly)}
                >
                  <span className="fb-switch-knob" />
                </button>
              </label>
              <label className="fb-toggle-row">
                <span>Certified</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={certified}
                  className={`fb-switch ${certified ? "on" : ""}`}
                  onClick={() => setFilter("certified", !certified)}
                >
                  <span className="fb-switch-knob" />
                </button>
              </label>

              <p className="fb-panel-title fb-panel-title-mt">Min rating</p>
              <div className="fb-seg">
                {RATING_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`fb-seg-pill ${minRating === o.value ? "active" : ""}`}
                    onClick={() => setFilter("minRating", o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <p className="fb-panel-title fb-panel-title-mt">Experience</p>
              <div className="fb-seg">
                {EXP_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`fb-seg-pill ${minExp === o.value ? "active" : ""}`}
                    onClick={() => setFilter("minExp", o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className="fb-divider" aria-hidden />

        {/* AVAILABLE NOW */}
        <button
          type="button"
          className={`pill ${availableNow ? "pill-active" : ""}`}
          onClick={() => setFilter("availableNow", !availableNow)}
          aria-pressed={availableNow}
        >
          <CircleCheck size={14} aria-hidden />
          Available now
        </button>
      </div>

      {/* ACTIVE FILTER TAGS */}
      <div className="fb-tags">
        {!anyActive && <span className="fb-no-filters">No filters applied</span>}

        {selectedTrades.map((t) => (
          <button key={t} type="button" className="fb-tag" onClick={() => toggleTrade(t)}>
            {t} <X size={11} aria-hidden />
          </button>
        ))}
        {locActive && (
          <button type="button" className="fb-tag" onClick={() => setFilter("location", "")}>
            {location} <X size={11} aria-hidden />
          </button>
        )}
        {budgetActive && (
          <button
            type="button"
            className="fb-tag"
            onClick={() => {
              setFilter("minRate", D.minRate);
              setFilter("maxRate", D.maxRate);
            }}
          >
            KSh {minRate.toLocaleString()}–{maxRate.toLocaleString()} <X size={11} aria-hidden />
          </button>
        )}
        {certified !== D.certified && (
          <button type="button" className="fb-tag" onClick={() => setFilter("certified", D.certified)}>
            Certified <X size={11} aria-hidden />
          </button>
        )}
        {verifiedOnly !== D.verifiedOnly && (
          <button type="button" className="fb-tag" onClick={() => setFilter("verifiedOnly", D.verifiedOnly)}>
            Verified only <X size={11} aria-hidden />
          </button>
        )}
        {minRating !== D.minRating && (
          <button type="button" className="fb-tag" onClick={() => setFilter("minRating", D.minRating)}>
            {minRating === 0 ? "Any rating" : `${minRating}+ stars`} <X size={11} aria-hidden />
          </button>
        )}
        {minExp !== D.minExp && (
          <button type="button" className="fb-tag" onClick={() => setFilter("minExp", D.minExp)}>
            {minExp}+ yrs exp <X size={11} aria-hidden />
          </button>
        )}
        {availableNow !== D.availableNow && (
          <button type="button" className="fb-tag" onClick={() => setFilter("availableNow", D.availableNow)}>
            Incl. unavailable <X size={11} aria-hidden />
          </button>
        )}

        {anyActive && (
          <button type="button" className="fb-clear" onClick={() => resetFilters()}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
