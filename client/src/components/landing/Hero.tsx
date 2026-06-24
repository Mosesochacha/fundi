import Link from "next/link";
import { btnGold, btnOutlineNavy } from "./landingStyles";

const STATS = [
  { num: "Free", label: "For workers, always" },
  { num: "0%", label: "Broker commission" },
  { num: "Direct", label: "No middleman" },
  { num: "2 min", label: "To get listed" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-[100px] pb-16 md:pt-[120px] md:pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,var(--color-gold-light)_0%,transparent_70%)]" />
      <h1 className="reveal font-serif text-[clamp(42px,7vw,86px)] font-normal leading-[1.05] tracking-[-0.03em] text-ink max-w-[820px]">
        Hire skilled workers.
        <br />
        <em className="italic font-light text-gold-dark">Anywhere.</em>{" "}
        Instantly.
      </h1>
      <p className="reveal text-[clamp(15px,2vw,18px)] text-ink-2 max-w-[480px] leading-[1.7] mt-6 font-light">
        The new home for the world’s skilled tradespeople - plumbers,
        electricians, carpenters and more. Browse profiles and connect directly.
        No brokers.
      </p>
      <div className="reveal flex flex-col sm:flex-row gap-3 mt-10 flex-wrap justify-center w-full max-w-[340px] sm:max-w-none">
        <Link href="/browse" className={`${btnGold} max-sm:w-full`}>
          Find a fundi near you
        </Link>
        <Link href="/register" className={`${btnOutlineNavy} max-sm:w-full`}>
          Join as a worker →
        </Link>
      </div>
      <div className="reveal flex items-center gap-x-6 gap-y-3 mt-12 flex-wrap justify-center">
        {STATS.map((s, i) => (
          <div key={s.num} className="contents">
            {i > 0 && <div className="hidden sm:block w-px h-9 bg-border" />}
            <div className="text-center">
              <div className="font-serif text-[28px] font-medium text-ink">
                {s.num}
              </div>
              <div className="text-[11px] text-ink-3 tracking-[0.05em] uppercase mt-0.5">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
