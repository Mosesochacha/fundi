import type { CSSProperties } from "react";

const globalStats = [
  {
    num: "Global",
    label:
      "Connecting skilled workers and the people who need them, worldwide.",
  },
  {
    num: "Founding",
    label: "Join the first cohort of workers shaping what Tesilix becomes.",
  },
  {
    num: "$0",
    label:
      "Cost to join as a worker. Free, always - no subscriptions, no fees.",
  },
];

const mapDots = [
  { left: "52%", top: "55%", navy: false },
  { left: "42%", top: "48%", navy: false },
  { left: "47%", top: "42%", navy: true },
  { left: "55%", top: "38%", navy: false },
  { left: "60%", top: "44%", navy: true },
  { left: "48%", top: "60%", navy: false },
  { left: "38%", top: "52%", navy: true },
  { left: "65%", top: "50%", navy: false },
];

export default function GlobalSection() {
  return (
    <section
      id="global"
      className="scroll-mt-20 bg-cream-2 px-5 py-16 md:px-6 md:py-24"
    >
      <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="reveal">
          <div className="text-[11px] tracking-[0.12em] uppercase text-gold-deep font-medium mb-4">
            Global by design
          </div>
          <h2 className="font-serif text-[clamp(30px,4vw,50px)] font-normal tracking-[-0.025em] leading-[1.1] text-ink">
            Built for workers
            <br />
            <em className="italic font-light text-gold-dark">everywhere</em>
          </h2>
          <p className="text-[15px] text-ink-2 leading-[1.7] font-light max-w-[480px] mt-4">
            Connecting skilled tradespeople with the people who need them, in
            every city. Join early and grow with us from day one.
          </p>
          <div className="flex flex-col gap-3.5 mt-10">
            {globalStats.map((s) => (
              <div
                key={s.num}
                className="flex items-center gap-4 p-4 bg-white border border-border rounded-lg"
              >
                <div className="font-serif text-[22px] font-medium text-navy min-w-16">
                  {s.num}
                </div>
                <div className="text-sm text-ink-2 leading-[1.5]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="reveal relative bg-white border border-border rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-[length:24px_24px]" />
          {mapDots.map((d) => (
            <span
              key={`${d.left}-${d.top}`}
              className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 ${d.navy ? "bg-navy" : "bg-gold"}`}
              style={{ left: d.left, top: d.top } as CSSProperties}
            />
          ))}
          <div className="relative z-[2] text-center">
            <div className="font-serif text-[32px] font-normal text-navy">
              Worldwide
            </div>
            <div className="text-sm text-ink-3 tracking-[0.08em] uppercase mt-1">
              Now in early access
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
