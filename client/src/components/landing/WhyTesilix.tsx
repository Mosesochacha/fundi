import Link from "next/link";
import type { CSSProperties } from "react";
import {
  eyebrowText,
  lede,
  linkTravel,
  linkTravelRule,
  secTitle,
  sectionInner,
  sectionShell,
} from "./landingStyles";

const REASONS: { num: string; title: string; desc: string }[] = [
  {
    num: "01",
    title: "A profile for work that is usually invisible",
    desc: "Photographs, trade, rates, service area, availability and reviews in one place — instead of a reputation that only exists inside other people's phones.",
  },
  {
    num: "02",
    title: "Signals an employer can actually compare",
    desc: "Proof of skill, past jobs, response context and reliability, side by side, before anyone has to make an awkward first call.",
  },
  {
    num: "03",
    title: "A direct line, with the reputation attached",
    desc: "Both sides talk to each other, agree terms in the open, and stay accountable to a profile that follows them to the next job.",
  },
  {
    num: "04",
    title: "Every finished job makes the next hire easier",
    desc: "Completed work turns into reviews, repeat clients and a stronger profile. The market gets better at matching the longer it runs.",
  },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Shared axis for the two fee bars, so the comparison is honestly to scale. */
function Axis() {
  return (
    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] tabular-nums text-ink-3">
      <span>0%</span>
      <span>Of the agreed fee</span>
      <span>100%</span>
    </div>
  );
}

export default function WhyTesilix() {
  return (
    <section id="why" className={`scroll-mt-20 bg-cream-2 ${sectionShell}`}>
      <div className={sectionInner}>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-end md:gap-16">
          <div data-rise>
            <div className="flex items-center gap-3.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
              <span className={eyebrowText}>Why Tesilix</span>
            </div>
            <h2 className={`mt-6 max-w-[17ch] ${secTitle}`}>
              The broker was never the{" "}
              <em className="font-serif italic text-gold-dark">product</em>.
            </h2>
          </div>
          <p
            className={`max-w-[44ch] ${lede} text-[15px]`}
            data-rise
            style={d(90)}
          >
            Middlemen sold access to people they did not train and work they did
            not do. Tesilix replaces that access with a public record — and
            hands the fee back to the person holding the tools.
          </p>
        </div>

        {/* ── The fee diagram ──────────────────────────────────────── */}
        <figure
          className="mt-14 overflow-hidden rounded-[4px] border border-border bg-white md:mt-20"
          data-rise
        >
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border px-6 py-4 md:px-9">
            <span className="font-serif text-[19px] font-normal text-ink md:text-[22px]">
              Where the money lands
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
              Per completed job
            </span>
          </figcaption>

          <div className="px-6 pt-7 pb-8 md:px-9 md:pt-9 md:pb-10">
            <Axis />

            {/* Broker route */}
            <div className="mt-4">
              <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-ink-2">
                Hired through a broker
              </div>
              <div className="relative h-[58px] w-full overflow-hidden rounded-[3px] border border-border bg-cream">
                <div
                  className="absolute inset-y-0 left-0 w-[70%] bg-ink-4/45"
                  data-grow
                  style={d(120)}
                />
                <div
                  className="hatch-loss absolute inset-y-0 right-0 w-[30%] border-l border-ink-4"
                  data-rise
                  style={d(700)}
                />
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[13px] font-semibold tabular-nums text-ink-2">
                  60–80% to the worker
                </span>
                <span className="absolute top-1/2 right-4 hidden -translate-y-1/2 text-[12px] font-bold tracking-wide text-ink-3 uppercase sm:block">
                  20–40% cut
                </span>
              </div>
            </div>

            {/* Direct route */}
            <div className="mt-6">
              <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-gold-deep">
                Hired on Tesilix
              </div>
              <div className="relative h-[58px] w-full overflow-hidden rounded-[3px] border border-gold/50 bg-gold-light">
                <div
                  className="absolute inset-y-0 left-0 w-full bg-gold/45"
                  data-grow
                  style={d(320)}
                />
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-[13px] font-semibold tabular-nums text-navy">
                  100% to the worker
                </span>
                <span className="absolute top-1/2 right-4 hidden -translate-y-1/2 text-[12px] font-bold tracking-wide text-gold-deep uppercase sm:block">
                  No cut
                </span>
              </div>
            </div>

            <p className="mt-6 max-w-[62ch] text-[13px] leading-[1.6] text-ink-3">
              Tesilix takes nothing from the job itself. Employers pay the
              worker; the worker keeps what they agreed.
            </p>
          </div>
        </figure>

        {/* ── The argument, as ledger rows ─────────────────────────── */}
        <div className="mt-16 grid gap-x-14 md:mt-20 md:grid-cols-2">
          {REASONS.map((r, i) => (
            <article key={r.num} className="group">
              <span
                className="block h-px w-full bg-border"
                data-draw
                style={d((i % 2) * 80)}
              />
              <div
                className="grid grid-cols-[46px_minmax(0,1fr)] gap-x-4 py-7 md:py-9"
                data-rise
                style={d((i % 2) * 80 + 50)}
              >
                <span className="font-serif text-[19px] leading-none font-light tabular-nums text-gold-dark">
                  {r.num}
                </span>
                <div>
                  <h3 className="max-w-[26ch] font-serif text-[20px] leading-[1.2] font-normal text-ink md:text-[22px]">
                    {r.title}
                  </h3>
                  <p className="mt-3 max-w-[46ch] text-[14px] leading-[1.7] text-ink-2">
                    {r.desc}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div
          className="flex flex-col gap-5 border-t border-navy/15 pt-8 sm:flex-row sm:items-center sm:justify-between"
          data-rise
        >
          <p className="max-w-[46ch] font-serif text-[20px] leading-[1.3] font-light text-ink md:text-[24px]">
            Still hiring from a name someone forwarded you?
          </p>
          <Link href="/browse" className={`${linkTravel} relative shrink-0`}>
            Browse verified workers
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
            <span className={linkTravelRule} />
          </Link>
        </div>
      </div>
    </section>
  );
}
