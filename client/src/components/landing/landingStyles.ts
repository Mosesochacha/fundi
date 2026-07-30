/**
 * Shared Tailwind fragments for the landing page.
 *
 * Design language — "the trade ledger": an editorial field-record built from
 * hairline rules, hanging index numerals and tabular alignment rather than
 * bordered cards. Gold is structural (rules, numerals, markers) and appears as
 * a *fill* only on the primary action and the closing band, so it still reads
 * as an event. Every surface is paper-light; navy is ink, never a backdrop.
 */

/* ── Layout ─────────────────────────────────────────────────────────── */

export const sectionShell = "px-5 py-20 md:px-8 md:py-28";
export const sectionInner = "mx-auto w-full max-w-[1120px]";

/* ── Type ───────────────────────────────────────────────────────────── */

/** Fraunces sits at light weights: large sizes need the thinner cut to breathe. */
export const display = "font-serif font-light tracking-[-0.02em] text-ink";

export const secTitle = `${display} text-[clamp(31px,4.4vw,56px)] leading-[1.03]`;

export const lede = "text-[17px] leading-[1.65] text-ink-2";

/** Small caps label. Pair with <Eyebrow> for the leading gold marker. */
export const eyebrowText =
  "text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep";

/** Ledger numerals — tabular so the index column stays optically aligned. */
export const indexNum =
  "font-serif font-light text-gold-dark tabular-nums leading-none";

/* ── Rules ──────────────────────────────────────────────────────────── */

export const hairline = "h-px w-full bg-border";
export const hairlineGold = "h-px w-full bg-gold/45";

/* ── Actions ────────────────────────────────────────────────────────── */

const btnBase =
  "group inline-flex items-center justify-center gap-2.5 rounded-[3px] px-7 py-[15px] text-[12px] font-bold uppercase tracking-[0.14em] no-underline cursor-pointer border transition-[background-color,border-color,color,box-shadow,transform] duration-300";

export const btnGold = `${btnBase} bg-gold text-navy border-gold shadow-[0_1px_0_rgba(34,29,22,0.14)] hover:bg-gold-dark hover:border-gold-dark hover:text-white hover:shadow-[0_10px_24px_-8px_rgba(156,125,41,0.55)]`;

export const btnOutlineNavy = `${btnBase} border-navy/20 bg-transparent text-navy hover:border-navy/45 hover:bg-navy/[0.04]`;

/**
 * Text action with a rule that wipes in from the left and an arrow that
 * travels — the quiet counterpart to the gold block.
 */
export const linkTravel =
  "group inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-navy no-underline transition-colors hover:text-gold-deep";

export const linkTravelRule =
  "absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gold-deep transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100";

/* ── Back-compat aliases (older imports) ────────────────────────────── */

export const eyebrow = `${eyebrowText} mb-4`;
export const btnLg = btnBase;
