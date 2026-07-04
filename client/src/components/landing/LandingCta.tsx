import Link from "next/link";
import { btnGold, btnOutlineNavy } from "./landingStyles";

const ctaAvatars: { initials: string; className: string }[] = [
  { initials: "JK", className: "bg-gold-light text-gold-deep" },
  { initials: "MO", className: "bg-navy/10 text-navy" },
  { initials: "AN", className: "bg-cream-2 text-ink-2" },
  { initials: "FN", className: "bg-gold/20 text-gold-deep" },
  { initials: "BM", className: "bg-gold-light text-gold-deep" },
];

export default function LandingCta() {
  return (
    <section className="relative bg-[linear-gradient(135deg,var(--color-cream-2)_0%,var(--color-cream)_40%,var(--color-gold-light)_100%)] px-5 py-16 md:px-6 md:py-24 text-center overflow-hidden border-t border-border">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/[0.06] w-[320px] h-[320px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/[0.06] w-[520px] h-[520px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/[0.06] w-[720px] h-[720px]" />
      <div className="relative">
        <h2 className="reveal font-serif text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.025em] leading-[1.1] text-navy">
          Ready to find your
          <br />
          <em className="italic font-light text-gold-dark">
            next great fundi?
          </em>
        </h2>
        <p className="reveal text-base text-ink-2 max-w-[420px] mx-auto mt-4 leading-[1.7] font-light">
          Be one of the first fundis on the platform. Free to start, always -
          and free to stay.
        </p>
        <div className="reveal flex flex-col sm:flex-row gap-3 justify-center mt-10 flex-wrap w-full sm:max-w-none mx-auto">
          <Link href="/browse" className={`${btnGold} max-sm:w-full`}>
            Find a fundi now
          </Link>
          <Link href="/register" className={`${btnOutlineNavy} max-sm:w-full`}>
            Join as a worker →
          </Link>
        </div>
        <div className="reveal text-sm text-ink-3 mt-5 tracking-[0.03em]">
          Free forever for workers · No hidden fees · Cancel anytime
        </div>
        <div className="reveal flex items-center justify-center mt-11">
          <div className="flex">
            {ctaAvatars.map((a, i) => (
              <div
                key={a.initials}
                className={`w-9 h-9 rounded-full border-2 border-cream-2 flex items-center justify-center text-[11px] font-medium ${a.className} ${i === 0 ? "" : "-ml-2.5"}`}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <div className="ml-3.5 text-left">
            <div className="text-sm text-ink-2">
              Founding workers are joining now - add your trade today.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
