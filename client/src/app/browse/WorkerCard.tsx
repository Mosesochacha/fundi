"use client";

import { MessageSquare, ShieldCheck } from "lucide-react";
import type { CSSProperties } from "react";
import { TRADE_DRAWINGS } from "@/components/landing/TradePlate";
import type { BrowseWorker } from "@/features/browse";
import { formatRate, tradePlateKey } from "./constants";

interface Props {
  worker: BrowseWorker;
  onView: (w: BrowseWorker) => void;
  onMessage: (w: BrowseWorker) => void;
  /** Catalogue number shown on the plate, 1-based across the whole result set. */
  plateNo?: number;
  /** Stagger delay for the load reveal, in ms. */
  delay?: number;
}

/**
 * A worker plate — the register's unit of evidence.
 *
 * Same anatomy as the landing page's TradePlate: the work photograph occupies
 * the top two-thirds, the caption strip carries the credit, and the figures sit
 * underneath as a ledger row. Where a worker has no portfolio image yet, the
 * plate falls back to the technical elevation of their trade on a blueprint
 * grid — never a grey box, so an empty portfolio still reads as a drawn plate.
 */
export function WorkerCardGrid({
  worker,
  onView,
  onMessage,
  plateNo,
  delay = 0,
}: Props) {
  const plate = tradePlateKey(worker.trade);
  const available = worker.isAvailable;
  const rated = worker.reviewCount > 0;

  return (
    <article
      className="reveal group flex flex-col overflow-hidden rounded-[4px] border border-border bg-white transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-gold/55 hover:shadow-[0_26px_50px_-26px_rgba(34,29,22,0.35)]"
      style={{ "--d": `${delay}ms` } as CSSProperties}
    >
      {/* ── The work ─────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-cream">
        {worker.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          // biome-ignore lint/performance/noImgElement: portfolio URLs are arbitrary external hosts
          <img
            src={worker.bannerUrl}
            alt={`Work by ${worker.name}, ${worker.trade}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
          />
        ) : (
          <>
            <div className="plate-grid absolute inset-0" />
            {plate ? (
              <svg
                viewBox="0 0 240 180"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.4] transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              >
                {TRADE_DRAWINGS[plate]}
              </svg>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-[74px] w-[74px] items-center justify-center border border-gold/55 font-serif text-[26px] font-light text-gold-dark transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]">
                  {worker.initials}
                </span>
              </span>
            )}
          </>
        )}

        {/* Availability, as a register stamp rather than a status pill */}
        <span
          className={`absolute top-3 right-3 z-10 inline-flex items-center gap-[7px] rounded-[2px] bg-white/94 px-2 py-[5px] text-[10px] font-bold tracking-[0.14em] uppercase backdrop-blur-[2px] ${
            available ? "text-gold-deep" : "text-ink-3"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-[6px] w-[6px] rotate-45 ${
              available ? "bg-gold" : "border border-ink-4"
            }`}
          />
          {available ? "Available" : "Booked"}
        </span>

        {/* Corner tick — the tell that this is a plate, not a stock crop */}
        <span className="absolute right-3 bottom-3 z-10 h-4 w-4 border-r border-b border-gold/60 transition-all duration-500 group-hover:h-6 group-hover:w-6" />
      </div>

      {/* ── The credit ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] font-bold tracking-[0.18em] text-gold-deep uppercase tabular-nums">
            {plateNo ? `Pl.${String(plateNo).padStart(2, "0")}` : "Plate"}
          </span>
          <span className="truncate text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
            {worker.trade}
          </span>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center overflow-hidden rounded-[3px] border border-border bg-gold-light font-serif text-[17px] font-light text-gold-dark">
            {worker.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              // biome-ignore lint/performance/noImgElement: avatar URLs are arbitrary external hosts
              <img
                src={worker.avatarUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              worker.initials
            )}
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 font-serif text-[19px] leading-[1.15] font-normal text-ink">
              <span className="truncate">{worker.name}</span>
              {worker.isVerified && (
                <ShieldCheck
                  size={14}
                  className="flex-none text-gold-dark"
                  role="img"
                  aria-label="Identity verified"
                />
              )}
            </h3>
            {worker.location && (
              <p className="mt-1 truncate text-[12.5px] leading-snug text-ink-3">
                {worker.location}
              </p>
            )}
          </div>
        </div>

        {worker.bio && (
          <p className="mt-3.5 line-clamp-2 text-[13.5px] leading-[1.6] text-ink-2">
            {worker.bio}
          </p>
        )}

        {/* Figures, tabulated — the same ledger row as the hero */}
        <dl className="mt-4 grid grid-cols-3 border-t border-border pt-3">
          <div className="pr-3">
            <dt className="text-[9.5px] font-bold tracking-[0.14em] text-ink-3 uppercase">
              Day rate
            </dt>
            <dd className="mt-1 truncate font-serif text-[17px] leading-none font-light tabular-nums text-gold-dark">
              {formatRate(worker.currency, worker.dailyRate)}
            </dd>
          </div>
          <div className="border-l border-border px-3">
            <dt className="text-[9.5px] font-bold tracking-[0.14em] text-ink-3 uppercase">
              Experience
            </dt>
            <dd className="mt-1 font-serif text-[17px] leading-none font-light tabular-nums text-navy">
              {worker.yearsExperience}
              <span className="ml-1 font-sans text-[11px] font-semibold text-ink-3">
                {worker.yearsExperience === 1 ? "yr" : "yrs"}
              </span>
            </dd>
          </div>
          <div className="border-l border-border pl-3">
            <dt className="text-[9.5px] font-bold tracking-[0.14em] text-ink-3 uppercase">
              {rated ? "Rated" : "Jobs"}
            </dt>
            <dd className="mt-1 font-serif text-[17px] leading-none font-light tabular-nums text-navy">
              {rated ? (
                <>
                  {worker.rating.toFixed(1)}
                  <span className="ml-1 font-sans text-[11px] font-semibold text-ink-3">
                    ({worker.reviewCount})
                  </span>
                </>
              ) : (
                <span className="font-sans text-[12px] font-semibold text-ink-3">
                  {worker.jobsDone > 0 ? `${worker.jobsDone} done` : "New here"}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Actions, as a ledger footer ──────────────────────────── */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] border-t border-border">
        <button
          type="button"
          className="group/act flex items-center justify-between gap-2 px-4 py-3 text-[11px] font-bold tracking-[0.14em] text-navy uppercase transition-colors duration-300 hover:bg-gold-light hover:text-gold-deep"
          onClick={() => onView(worker)}
        >
          View the work
          <span className="transition-transform duration-300 group-hover/act:translate-x-1">
            →
          </span>
        </button>
        <button
          type="button"
          className="flex items-center gap-2 border-l border-border px-4 py-3 text-[11px] font-bold tracking-[0.14em] text-ink-2 uppercase transition-colors duration-300 hover:bg-cream-2 hover:text-navy"
          onClick={() => onMessage(worker)}
        >
          <MessageSquare size={13} aria-hidden="true" />
          <span className="max-sm:sr-only">Message</span>
        </button>
      </div>
    </article>
  );
}
