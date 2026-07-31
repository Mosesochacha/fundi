import Link from "next/link";
import type { CSSProperties } from "react";
import {
  btnGold,
  display,
  lede,
  linkTravel,
  linkTravelRule,
} from "./landingStyles";
import TradePlate, { type TradeKey } from "./TradePlate";

/** The opening portfolio wall. Swap in `photo` per plate as real work lands. */
const PLATES: {
  trade: TradeKey;
  index: string;
  title: string;
  credit: string;
}[] = [
  {
    trade: "carpenter",
    index: "01",
    title: "Walnut dovetail casework",
    credit: "Joinery · fitted over four days",
  },
  {
    trade: "electrician",
    index: "02",
    title: "Second-fix conduit run",
    credit: "Electrical · certified on completion",
  },
  {
    trade: "plumber",
    index: "03",
    title: "Riser and isolation valve",
    credit: "Plumbing · pressure-tested",
  },
  {
    trade: "mason",
    index: "04",
    title: "Stretcher-bond boundary wall",
    credit: "Masonry · 92 courses, plumb",
  },
];

/** Ledger figures. Kept qualitative or verifiable — no invented traction. */
const LEDGER: [string, string][] = [
  ["0%", "Commission taken on a hire"],
  ["100%", "Of the agreed fee stays with the worker"],
  ["12", "Trades covered at launch"],
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Hero() {
  return (
    <section className="bg-paper relative overflow-hidden px-5 pt-28 pb-16 md:px-8 md:pt-36 md:pb-24">
      {/* Brand arc, echoed from the Tesilix banner lockup — one hairline, no glow */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-px left-0 h-40 w-full text-gold/35"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0 148C280 96 620 62 1000 62s360 22 440 42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative mx-auto grid w-full max-w-[1180px] gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start lg:gap-16">
        {/* ── Argument ─────────────────────────────────────────────── */}
        <div className="lg:pt-4">
          <div className="reveal flex items-center gap-3.5" style={d(0)}>
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">
              Portfolio-first hiring
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <h1
            className={`reveal mt-7 text-[clamp(40px,5.6vw,72px)] leading-[1] ${display}`}
            style={d(70)}
          >
            Judge the work,
            <br />
            not the{" "}
            <em className="font-serif italic text-gold-dark">promise</em>.
          </h1>

          <p className={`reveal mt-7 max-w-[52ch] ${lede}`} style={d(150)}>
            Tesilix is a hiring network for skilled trades where every profile
            opens with photographs of finished jobs. Employers hire from the
            evidence, workers keep their reputation — and no broker sits in the
            middle taking a cut of both.
          </p>

          <div
            className="reveal mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7"
            style={d(220)}
          >
            <Link href="/browse" className={`${btnGold} max-sm:w-full`}>
              Browse the work
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link href="/register" className={`${linkTravel} relative`}>
              Join as a worker
              <span className={linkTravelRule} />
            </Link>
          </div>

          <dl
            className="reveal mt-12 grid max-w-[620px] grid-cols-3 border-t border-border pt-6"
            style={d(300)}
          >
            {LEDGER.map(([value, label], i) => (
              <div
                key={value}
                className={
                  i > 0 ? "border-l border-border pl-4 md:pl-6" : "pr-4 md:pr-6"
                }
              >
                <dt className="font-serif text-[30px] leading-none font-light tabular-nums text-navy md:text-[36px]">
                  {value}
                </dt>
                <dd className="mt-2.5 text-[12px] leading-[1.45] text-ink-3">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Portfolio wall ───────────────────────────────────────── */}
        <div className="reveal" style={d(180)}>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">
              Recent work
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] tabular-nums text-ink-3">
              04 plates
            </span>
          </div>
          <div className="h-px w-full bg-border" />

          <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-5">
            <div className="flex flex-col gap-3.5 sm:gap-5">
              {PLATES.filter((_, i) => i % 2 === 0).map((p) => (
                <TradePlate key={p.index} {...p} />
              ))}
            </div>
            {/* Offset column — breaks the grid so the wall reads as pinned
                prints rather than a card row. */}
            <div className="flex flex-col gap-3.5 pt-8 sm:gap-5 sm:pt-14">
              {PLATES.filter((_, i) => i % 2 === 1).map((p) => (
                <TradePlate key={p.index} {...p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
