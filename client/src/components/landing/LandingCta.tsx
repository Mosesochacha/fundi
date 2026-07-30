import Link from "next/link";
import type { CSSProperties } from "react";
import { display, eyebrowText, sectionInner } from "./landingStyles";

const DOORS: {
  mark: string;
  title: string;
  desc: string;
  action: string;
  href: string;
  primary: boolean;
}[] = [
  {
    mark: "01",
    title: "I need work done",
    desc: "Browse finished jobs by trade and city, then message the person who did them.",
    action: "Browse the work",
    href: "/browse",
    primary: true,
  },
  {
    mark: "02",
    title: "I do the work",
    desc: "Put your last ten jobs somewhere they keep earning. Free, and free of commission.",
    action: "Create your profile",
    href: "/register",
    primary: false,
  },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function LandingCta() {
  return (
    <section className="relative overflow-hidden border-y border-gold/35 bg-gold-light px-5 py-20 md:px-8 md:py-28">
      {/* Closing arc — mirrors the hero so the page opens and shuts on the same mark */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -top-px left-0 h-32 w-full text-gold/45"
        viewBox="0 0 1440 128"
        preserveAspectRatio="none"
      >
        <path
          d="M0 12c280 52 620 86 1000 86s360-22 440-42"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      <div className={`relative ${sectionInner}`}>
        <div data-rise>
          <div className="flex items-center gap-3.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-gold-dark" />
            <span className={eyebrowText}>Two ways in</span>
          </div>
          <h2
            className={`mt-6 max-w-[17ch] text-[clamp(34px,5vw,62px)] leading-[1.02] ${display}`}
          >
            Find the fundi — or become the one they{" "}
            <em className="font-serif italic text-gold-dark">find first</em>.
          </h2>
        </div>

        <div className="mt-14 grid md:mt-16 md:grid-cols-2">
          {DOORS.map((door, i) => (
            <Link
              key={door.mark}
              href={door.href}
              className={`group relative flex flex-col justify-between gap-8 border-t border-gold/40 py-9 no-underline transition-colors duration-500 hover:bg-gold/[0.09] md:gap-12 md:py-11 ${
                i === 0
                  ? "md:pr-14"
                  : "md:border-l md:border-gold/40 md:pl-14 max-md:border-t"
              }`}
              data-rise
              style={d(i * 110)}
            >
              <div>
                <span className="font-serif text-[13px] leading-none font-light tabular-nums text-gold-deep">
                  {door.mark}
                </span>
                <h3 className="mt-5 font-serif text-[29px] leading-[1.1] font-light text-ink md:text-[36px]">
                  {door.title}
                </h3>
                <p className="mt-4 max-w-[38ch] text-[15px] leading-[1.7] text-ink-2">
                  {door.desc}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-3 self-start rounded-[3px] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] transition-all duration-300 ${
                  door.primary
                    ? "bg-gold text-navy group-hover:bg-gold-dark group-hover:text-white group-hover:shadow-[0_10px_24px_-10px_rgba(156,125,41,0.6)]"
                    : "border border-navy/25 text-navy group-hover:border-navy/50 group-hover:bg-white/60"
                }`}
              >
                {door.action}
                <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>

        <p
          className="mt-10 border-t border-gold/40 pt-6 text-[12px] font-bold uppercase tracking-[0.16em] text-gold-deep"
          data-rise
        >
          Free for workers · No commission on hires · No broker in the middle
        </p>
      </div>
    </section>
  );
}
