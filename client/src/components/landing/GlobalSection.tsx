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

/** Mirrors the city list already shipped on /browse so the two pages agree. */
const CITIES: {
  city: string;
  region: string;
  workers: number;
  live: boolean;
}[] = [
  { city: "Nairobi", region: "Kenya", workers: 142, live: true },
  { city: "Lagos", region: "Nigeria", workers: 98, live: true },
  { city: "London", region: "United Kingdom", workers: 87, live: true },
  { city: "Accra", region: "Ghana", workers: 63, live: true },
  { city: "Dubai", region: "United Arab Emirates", workers: 51, live: false },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function GlobalSection() {
  return (
    <section id="global" className={`scroll-mt-20 bg-cream ${sectionShell}`}>
      <div
        className={`${sectionInner} grid gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-20`}
      >
        <div className="lg:sticky lg:top-28 lg:self-start" data-rise>
          <div className="flex items-center gap-3.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <span className={eyebrowText}>Where it runs</span>
          </div>
          <h2 className={`mt-6 ${secTitle}`}>
            Local work.
            <br />
            <em className="font-serif italic text-gold-dark">Global</em>{" "}
            standard.
          </h2>
          <p className={`mt-6 max-w-[42ch] ${lede} text-[15px]`}>
            A tiler in Nairobi and a tiler in Manchester are judged the same way
            here: by the last thing they built. The reputation is portable, and
            it belongs to the worker — not to the platform, and not to a
            broker's contact list.
          </p>
          <Link href="/browse" className={`${linkTravel} relative mt-8`}>
            Open the directory
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
            <span className={linkTravelRule} />
          </Link>
        </div>

        {/* ── City index ───────────────────────────────────────────── */}
        <div>
          <div
            className="flex items-baseline justify-between gap-4 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3"
            data-rise
          >
            <span>City</span>
            <span>Workers listed</span>
          </div>

          <ul>
            {CITIES.map((c, i) => (
              <li key={c.city} className="group">
                <span
                  className="block h-px w-full bg-border"
                  data-draw
                  style={d(i * 70)}
                />
                <div
                  className="flex items-baseline justify-between gap-6 py-5 md:py-6"
                  data-rise
                  style={d(i * 70 + 50)}
                >
                  <div className="flex min-w-0 items-baseline gap-4">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 translate-y-[-3px] rotate-45 transition-colors duration-500 ${
                        c.live ? "bg-gold" : "bg-ink-4"
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <span className="font-serif text-[26px] leading-none font-light text-ink transition-colors duration-500 group-hover:text-gold-deep md:text-[32px]">
                        {c.city}
                      </span>
                      <span className="mt-2 block text-[12px] tracking-wide text-ink-3">
                        {c.region}
                        {!c.live && (
                          <span className="ml-2 text-gold-deep uppercase">
                            · opening soon
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 font-serif text-[26px] leading-none font-light tabular-nums text-navy md:text-[32px]">
                    {c.workers}
                  </span>
                </div>
              </li>
            ))}

            <li>
              <span
                className="block h-px w-full bg-border"
                data-draw
                style={d(350)}
              />
              <Link
                href="/register"
                className="group flex items-baseline justify-between gap-6 py-5 no-underline md:py-6"
                data-rise
                style={d(400)}
              >
                <span className="font-serif text-[22px] leading-none font-light text-ink-3 transition-colors duration-500 group-hover:text-gold-deep md:text-[26px]">
                  Somewhere else
                </span>
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-deep">
                  Add your city
                  <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
              <span
                className="block h-px w-full bg-border"
                data-draw
                style={d(430)}
              />
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
