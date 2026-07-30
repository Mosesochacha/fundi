import type { CSSProperties, ReactNode } from "react";
import {
  eyebrowText,
  lede,
  secTitle,
  sectionInner,
  sectionShell,
} from "./landingStyles";

const CHECKS: { ref: string; title: string; desc: string; icon: ReactNode }[] =
  [
    {
      ref: "V-01",
      title: "Identity verified",
      desc: "Profiles are tied to verified contact details, so an employer knows who is on the other end before the first message.",
      icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    },
    {
      ref: "V-02",
      title: "Reviews tied to real jobs",
      desc: "Ratings are attached to completed hires rather than anonymous drive-by feedback, so reputation stays connected to work.",
      icon: (
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      ),
    },
    {
      ref: "V-03",
      title: "Contact on your terms",
      desc: "Discovery happens on the profile; personal numbers stay private until both sides have context and choose to share them.",
      icon: (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      ),
    },
    {
      ref: "V-04",
      title: "Moderated, by people",
      desc: "Reports, duplicate listings and suspicious activity are reviewed by a human — and profile quality is held to a standard.",
      icon: (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
    },
  ];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Struck seal — the page's one ornamental mark, borrowed from a stamped record. */
function Seal() {
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden="true"
      className="h-full w-full fill-none stroke-gold-dark [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.2]"
    >
      <circle cx="40" cy="40" r="34" />
      <circle cx="40" cy="40" r="28" strokeDasharray="3 5" />
      <rect
        x="26"
        y="26"
        width="28"
        height="28"
        transform="rotate(45 40 40)"
        className="stroke-gold-dark/60"
      />
      <path d="M31 40.5l6.5 6.5L50 34" strokeWidth="1.8" />
    </svg>
  );
}

export default function TrustSafety() {
  return (
    <section id="trust" className={`scroll-mt-20 bg-cream ${sectionShell}`}>
      <div className={sectionInner}>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-end md:gap-16">
          <div data-rise>
            <div className="flex items-center gap-3.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
              <span className={eyebrowText}>Trust &amp; safety</span>
            </div>
            <h2 className={`mt-6 max-w-[18ch] ${secTitle}`}>
              Trust is the{" "}
              <em className="font-serif italic text-gold-dark">
                infrastructure
              </em>
              , not a badge.
            </h2>
          </div>
          <p
            className={`max-w-[42ch] ${lede} text-[15px]`}
            data-rise
            style={d(90)}
          >
            A directory is easy. What is hard — and what this is actually for —
            is making trust something a worker can earn, an employer can
            inspect, and both can improve after every job.
          </p>
        </div>

        {/* ── Verification record ──────────────────────────────────── */}
        <div
          className="relative mt-14 rounded-[4px] border border-border bg-white md:mt-20"
          data-rise
        >
          <div className="grain pointer-events-none absolute inset-0 rounded-[4px] opacity-60" />

          {/* pr-28 keeps the header label clear of the seal that overhangs the corner */}
          <div className="relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border px-6 py-4 md:px-10 md:pr-28">
            <span className="font-serif text-[19px] font-normal text-ink md:text-[22px]">
              What we check, and keep checking
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] tabular-nums text-ink-3">
              Record · 04 items
            </span>
          </div>

          {/* Seal breaks the panel edge so the record reads as stamped, not drawn */}
          <div className="pointer-events-none absolute -top-7 right-5 hidden h-[74px] w-[74px] rotate-[-9deg] md:block">
            <Seal />
          </div>

          <div className="relative grid md:grid-cols-2">
            {CHECKS.map((c, i) => (
              <article
                key={c.ref}
                className={`group px-6 py-8 md:px-10 md:py-10 ${
                  i % 2 === 0 ? "md:border-r md:border-border" : ""
                } ${i < 2 ? "border-b border-border" : "max-md:border-b max-md:border-border"} ${
                  i === 3 ? "max-md:border-b-0" : ""
                }`}
                data-rise
                style={d(i * 80)}
              >
                <div className="flex items-center gap-3.5">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-[22px] w-[22px] shrink-0 fill-none stroke-gold-dark [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.3] transition-transform duration-500 group-hover:-translate-y-0.5"
                  >
                    {c.icon}
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] tabular-nums text-ink-3">
                    {c.ref}
                  </span>
                  <span className="h-px flex-1 bg-border transition-colors duration-500 group-hover:bg-gold/50" />
                </div>

                <h3 className="mt-5 font-serif text-[21px] leading-[1.2] font-normal text-ink">
                  {c.title}
                </h3>
                <p className="mt-3 max-w-[42ch] text-[14px] leading-[1.7] text-ink-2">
                  {c.desc}
                </p>
              </article>
            ))}
          </div>

          <div className="relative border-t border-border px-6 py-4 text-[12px] leading-[1.6] text-ink-3 md:px-10">
            Tesilix is early. Where a protection is still being built we say so
            on the page rather than implying it exists.
          </div>
        </div>
      </div>
    </section>
  );
}
