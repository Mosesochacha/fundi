import type { ReactNode } from "react";
import { eyebrow, secTitle } from "./landingStyles";

const STEPS: { num: string; icon: ReactNode; title: string; desc: string }[] = [
  {
    num: "01",
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    title: "Search your trade",
    desc: "Tell us what you need - plumber, electrician, carpenter. Filter by location, rating, and availability. Find the right person in seconds.",
  },
  {
    num: "02",
    icon: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
    title: "Connect & confirm",
    desc: "Message directly, agree on price and time. No middlemen, no hidden fees. Every worker shows verified ratings from real past jobs.",
  },
  {
    num: "03",
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
    title: "Job done. Leave a review.",
    desc: "Rate the worker after the job. Your review helps the next employer and rewards great workers with more opportunities.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-cream-2 px-5 py-16 md:px-6 md:py-24">
      <div className="max-w-[1080px] mx-auto">
        <div className={eyebrow}>How it works</div>
        <h2 className={secTitle}>
          Three steps to
          <br />
          <em className="italic font-light text-gold-dark">a job done right</em>
        </h2>
        <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-px mt-14 bg-border border border-border rounded-xl overflow-hidden">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-cream px-6 py-8 md:px-8 md:py-10">
              <div className="font-serif text-5xl font-light text-cream-2 leading-none mb-5">
                {step.num}
              </div>
              <div className="w-10 h-10 rounded-lg bg-gold-light border border-gold/20 flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 stroke-gold-dark fill-none [stroke-width:1.5]"
                  aria-hidden="true"
                >
                  {step.icon}
                </svg>
              </div>
              <div className="text-base font-medium text-ink mb-2">
                {step.title}
              </div>
              <div className="text-sm text-ink-2 leading-[1.65] font-light">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
