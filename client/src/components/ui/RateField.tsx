"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface RateFieldProps {
  /** Numeric rate as a string (controlled). */
  value: string;
  onValueChange: (v: string) => void;
  /** Currently selected currency code + symbol (auto-detected, overridable). */
  currency: string;
  symbol: string;
  /** Manual override from the "Wrong currency?" picker. */
  onCurrencyChange: (code: string, symbol: string) => void;
  label?: string;
  inputId?: string;
}

/**
 * Daily-rate input with an auto-detected, read-only currency badge and a
 * "Wrong currency?" manual override. No FX conversion — the chosen currency is
 * shown verbatim. A live hint previews how employers will see the rate.
 */
export function RateField({
  value,
  onValueChange,
  currency,
  symbol,
  onCurrencyChange,
  label = "Daily rate",
  inputId = "rate",
}: RateFieldProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  const showHint = !!value && numeric > 0;

  return (
    <div>
      <label
        className="block text-sm font-semibold text-ink-2 tracking-[0.02em] mb-2"
        htmlFor={inputId}
      >
        {label} <span className="font-normal text-ink-3">- optional</span>
      </label>

      <div className="flex gap-2">
        {/* Currency badge (read-only, auto-set) */}
        <span className="inline-flex items-center shrink-0 bg-cream-2 border border-border rounded-lg px-3 py-[9px] text-[13px] text-ink-2 whitespace-nowrap">
          {symbol} · {currency}
        </span>

        {/* Rate input */}
        <input
          id={inputId}
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="e.g. 2,500"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="flex-1 min-w-0 px-3.5 py-[9px] border border-border rounded-lg text-sm bg-cream text-ink font-sans outline-none transition-all placeholder:text-ink-3 focus:border-gold focus:bg-white"
        />
      </div>

      {/* Manual override */}
      <div className="relative mt-1.5" ref={wrapRef}>
        <button
          type="button"
          className="text-[11px] text-ink-3 underline underline-offset-2 hover:text-ink-2 cursor-pointer"
          onClick={() => setOpen((o) => !o)}
        >
          Wrong currency?
        </button>
        {open && (
          <div className="absolute left-0 top-[calc(100%+4px)] z-20 max-h-56 w-[230px] overflow-y-auto bg-white border border-border rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.1)] p-1">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-left hover:bg-cream-2",
                  c.code === currency
                    ? "text-gold-dark font-medium"
                    : "text-ink-2",
                )}
                onClick={() => {
                  onCurrencyChange(c.code, c.symbol);
                  setOpen(false);
                }}
              >
                <span className="w-10 shrink-0 text-ink-3">{c.symbol}</span>
                <span>
                  {c.code} — {c.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live hint */}
      {showHint && (
        <div className="text-[11px] text-ink-3 italic mt-1.5">
          Employers will see this as {symbol} {numeric.toLocaleString("en-US")}
          /day
        </div>
      )}
    </div>
  );
}
