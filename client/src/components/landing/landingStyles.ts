/** Shared Tailwind class fragments reused across the landing-page sections. */

export const btnLg =
  "inline-flex items-center justify-center gap-1.5 px-8 py-3.5 rounded text-[15px] font-medium tracking-[0.01em] no-underline cursor-pointer border transition-all";

export const btnGold = `${btnLg} bg-gold text-navy border-gold hover:bg-gold-dark hover:border-gold-dark`;

export const btnOutlineNavy = `${btnLg} border-navy/25 bg-transparent text-navy hover:bg-navy/[0.05]`;

export const eyebrow =
  "reveal text-[11px] tracking-[0.12em] uppercase text-gold-deep font-medium mb-4";

export const secTitle =
  "reveal font-serif text-[clamp(30px,4vw,50px)] font-normal tracking-[-0.025em] leading-[1.1] text-ink";
