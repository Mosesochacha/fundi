import type { CSSProperties } from "react";
import {
  eyebrowText,
  lede,
  secTitle,
  sectionInner,
  sectionShell,
} from "./landingStyles";

const STEPS: { num: string; title: string; desc: string; aside: string }[] = [
  {
    num: "01",
    title: "Search by trade, place and week",
    desc: "Start where a referral would start — the job, the neighbourhood, the timing. What comes back is a searchable pool of profiles instead of three forwarded phone numbers.",
    aside: "No sign-up to look",
  },
  {
    num: "02",
    title: "Read the work before you read the pitch",
    desc: "Every profile leads with photographs of completed jobs, alongside rates, experience, availability and reviews attached to real hires. You shortlist on evidence.",
    aside: "Photo-led profiles",
  },
  {
    num: "03",
    title: "Message the worker. Nobody else.",
    desc: "Agree the scope and the price directly. When the job is finished the review attaches to that worker's profile, so good work compounds into the next hire.",
    aside: "Zero commission",
  },
];

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function HowItWorks() {
  return (
    <section id="how" className={`scroll-mt-20 bg-cream ${sectionShell}`}>
      <div className={sectionInner}>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] md:items-end md:gap-16">
          <div data-rise>
            <div className="flex items-center gap-3.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
              <span className={eyebrowText}>How it works</span>
            </div>
            <h2 className={`mt-6 ${secTitle}`}>
              Three steps, and
              <br />
              nobody in between.
            </h2>
          </div>
          <p
            className={`max-w-[46ch] ${lede} text-[15px]`}
            data-rise
            style={d(90)}
          >
            The informal labour market runs on forwarded contacts and vague
            promises. This is the same path, with the proof moved to the front.
          </p>
        </div>

        <ol className="mt-16 md:mt-20">
          {STEPS.map((step, i) => (
            <li key={step.num} className="group relative">
              <span
                className="block h-px w-full bg-border"
                data-draw
                style={d(i * 90)}
              />
              <div
                className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-5 gap-y-3 py-8 transition-colors duration-500 md:grid-cols-[110px_minmax(0,0.44fr)_minmax(0,0.56fr)] md:gap-x-10 md:py-12"
                data-rise
                style={d(i * 90 + 60)}
              >
                {/* gold (3.4:1) rather than ink-4 (~1.9:1): this is real text at
                    large size, so it has to clear the WCAG AA large-text floor */}
                <span className="font-serif text-[34px] leading-none font-light tabular-nums text-gold transition-colors duration-500 group-hover:text-gold-dark md:text-[64px]">
                  {step.num}
                </span>

                <h3 className="self-center font-serif text-[21px] leading-[1.15] font-normal text-ink md:self-start md:text-[27px]">
                  {step.title}
                </h3>

                <div className="col-start-2 md:col-start-3">
                  <p className="max-w-[54ch] text-[15px] leading-[1.7] text-ink-2">
                    {step.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-deep">
                    <span className="h-px w-6 bg-gold transition-[width] duration-500 group-hover:w-10" />
                    {step.aside}
                  </span>
                </div>
              </div>
            </li>
          ))}
          <li>
            <span
              className="block h-px w-full bg-border"
              data-draw
              style={d(270)}
            />
          </li>
        </ol>
      </div>
    </section>
  );
}
