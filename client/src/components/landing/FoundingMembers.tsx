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

const SIDES: {
  mark: string;
  who: string;
  title: string;
  points: string[];
  cta: { label: string; href: string };
}[] = [
  {
    mark: "A",
    who: "For workers",
    title: "Your last ten jobs, working for you while you sleep.",
    points: [
      "A profile that opens with your photographs, not a paragraph about yourself",
      "Rates, service area and availability you set — and change whenever you like",
      "Reviews tied to jobs you actually finished, so the record is yours to keep",
      "Free while we are building. No listing fee, no commission on a hire.",
    ],
    cta: { label: "Create your profile", href: "/register" },
  },
  {
    mark: "B",
    who: "For employers",
    title: "Stop hiring on a recommendation you cannot verify.",
    points: [
      "Filter by trade, city and availability, then compare finished work side by side",
      "See rates before the first message instead of after the site visit",
      "Message the worker directly — no coordinator, no markup, no relay",
      "Leave a review that helps the next person hiring for the same job",
    ],
    cta: { label: "Find someone now", href: "/browse" },
  },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function FoundingMembers() {
  return (
    <section className={`bg-cream-2 ${sectionShell}`}>
      <div className={sectionInner}>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-end md:gap-16">
          <div data-rise>
            <div className="flex items-center gap-3.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
              <span className={eyebrowText}>Founding members</span>
            </div>
            <h2 className={`mt-6 max-w-[16ch] ${secTitle}`}>
              Built for both sides of the job.
            </h2>
          </div>
          <p
            className={`max-w-[42ch] ${lede} text-[15px]`}
            data-rise
            style={d(90)}
          >
            Early access keeps the product close to the people it serves —
            workers who want steady demand, and employers who need dependable
            skill on a specific Tuesday.
          </p>
        </div>

        <div className="mt-14 grid gap-x-16 gap-y-12 md:mt-20 md:grid-cols-2">
          {SIDES.map((side, i) => (
            <div
              key={side.mark}
              className={
                i === 1 ? "md:border-l md:border-gold/35 md:pl-16" : "md:pr-4"
              }
              data-rise
              style={d(i * 110)}
            >
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-[22px] leading-none font-light text-gold-dark">
                  {side.mark}
                </span>
                <span className={eyebrowText}>{side.who}</span>
              </div>

              <h3 className="mt-6 max-w-[19ch] font-serif text-[26px] leading-[1.15] font-light text-ink md:text-[31px]">
                {side.title}
              </h3>

              <ul className="mt-8">
                {side.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-4 border-t border-border py-4 text-[14px] leading-[1.65] text-ink-2"
                  >
                    <span
                      className="mt-[9px] h-1 w-1 shrink-0 rotate-45 bg-gold"
                      aria-hidden="true"
                    />
                    <span className="max-w-[44ch]">{point}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={side.cta.href}
                className={`${linkTravel} relative mt-8`}
              >
                {side.cta.label}
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
                <span className={linkTravelRule} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
