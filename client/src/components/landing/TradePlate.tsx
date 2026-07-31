import Image from "next/image";
import type { ReactNode } from "react";

/**
 * A "work plate" — the page's core visual unit.
 *
 * The product is portfolio-first, so every plate is a photo frame. Until a
 * worker's photo is attached it falls back to a hand-drawn technical elevation
 * of the actual craft (a conduit run, a dovetail, a weld seam) on a blueprint
 * grid — a deliberate spec-sheet drawing rather than a grey placeholder box.
 *
 * To switch a plate to photography, pass `photo`: the drawing is replaced and
 * the caption strip re-tints over a scrim. Nothing else about the layout moves.
 */

export type TradeKey =
  | "electrician"
  | "plumber"
  | "carpenter"
  | "mason"
  | "welder"
  | "tiler";

/* Structural geometry sits back in navy; the worked element is gold. */
const STRUCT = "stroke-navy/30";
const WORK = "stroke-gold-dark";

/**
 * Exported so /browse can draw the same technical elevations inside worker
 * plates when a portfolio photograph is missing — one drawing vocabulary
 * across the marketing page and the register.
 */
export const TRADE_DRAWINGS: Record<TradeKey, ReactNode> = {
  electrician: (
    <>
      {/* conduit run + junction box */}
      <path className={STRUCT} d="M12 86h84M144 86h84" />
      <rect className={STRUCT} x="96" y="62" width="48" height="48" rx="3" />
      <path className={STRUCT} d="M30 78v16M60 78v16M180 78v16M210 78v16" />
      {/* drop to switch plate */}
      <path className={STRUCT} d="M120 110v28" />
      <rect className={STRUCT} x="102" y="138" width="36" height="30" rx="2" />
      <path className={STRUCT} d="M113 150h14" />
      {/* live conductor */}
      <path
        className={WORK}
        d="M12 86c26 0 26-20 52-20s26 40 52 40 26-40 52-40 26 20 52 20"
      />
      <circle className={WORK} cx="120" cy="86" r="3.5" />
      <path className={WORK} d="M120 138v-8M120 156l6-8h-12l6-8" />
    </>
  ),
  plumber: (
    <>
      {/* riser + elbows */}
      <path
        className={STRUCT}
        d="M12 150h40a12 12 0 0 0 12-12V76a12 12 0 0 1 12-12h62"
      />
      <path
        className={STRUCT}
        d="M12 162h46a20 20 0 0 0 20-20V76a1 1 0 0 1 1-1h59"
      />
      {/* union collars */}
      <path className={STRUCT} d="M52 144v24M64 100h14M104 58v14M118 58v14" />
      {/* valve body + handwheel */}
      <rect className={STRUCT} x="138" y="52" width="34" height="30" rx="2" />
      <path className={WORK} d="M155 52V32" />
      <path className={WORK} d="M137 32h36" />
      <circle className={WORK} cx="155" cy="24" r="8" />
      {/* flow */}
      <path className={WORK} d="M182 67h46" strokeDasharray="10 7" />
      <path className={WORK} d="M214 59l14 8-14 8" />
    </>
  ),
  carpenter: (
    <>
      {/* dovetail joint elevation */}
      <path className={STRUCT} d="M20 40h96v100H20z" />
      <path className={STRUCT} d="M220 40h-96v100h96z" />
      <path className={STRUCT} d="M36 40v100M204 40v100" />
      {/* interlocking tails */}
      <path
        className={WORK}
        d="M116 40h8l6 18h-14zM116 72h14l-6-18M116 72h8l6 18h-14zM116 104h14l-6-18M116 104h8l6 18h-14zM116 136h14l-6-18"
      />
      <path className={WORK} d="M120 40v100" strokeDasharray="4 6" />
      {/* dimension rule */}
      <path className={STRUCT} d="M20 156h200M20 150v12M220 150v12" />
    </>
  ),
  mason: (
    <>
      {/* stretcher-bond coursing */}
      <path
        className={STRUCT}
        d="M16 44h208M16 44v96M224 44v96M16 140h208M16 68h208M16 92h208M16 116h208"
      />
      <path className={STRUCT} d="M68 44v24M120 44v24M172 44v24" />
      <path className={STRUCT} d="M42 68v24M94 68v24M146 68v24M198 68v24" />
      <path className={STRUCT} d="M68 92v24M120 92v24M172 92v24" />
      <path className={STRUCT} d="M42 116v24M94 116v24M146 116v24M198 116v24" />
      {/* plumb line + bob */}
      <path className={WORK} d="M120 20v128" />
      <path className={WORK} d="M120 148l8 12-8 10-8-10z" />
      <circle className={WORK} cx="120" cy="20" r="4" />
    </>
  ),
  welder: (
    <>
      {/* two plates meeting at a V bevel, in section */}
      <path className={STRUCT} d="M12 74h96l12 22M228 74h-96l-12 22" />
      <path className={STRUCT} d="M12 74v34h96M228 74v34h-96" />
      <path className={STRUCT} d="M108 108h24" />
      {/* weld bead */}
      <path
        className={WORK}
        d="M96 92q6-12 12 0t12 0 12 0 12 0"
        strokeLinecap="round"
      />
      <path className={WORK} d="M108 96h24" />
      {/* arc + spatter */}
      <path className={WORK} d="M120 92V44M120 44l-16-16M120 44l16-16" />
      <path className={WORK} d="M84 118l-8 10M156 118l8 10M120 122v14" />
    </>
  ),
  tiler: (
    <>
      {/* tile field in one-point perspective */}
      <path className={STRUCT} d="M20 156h200L172 60H68z" />
      <path className={STRUCT} d="M55 132h130M76 108h88M92 84h56" />
      <path
        className={STRUCT}
        d="M94 156l14-96M148 156l-14-96M50 156l24-96M190 156l-24-96"
      />
      {/* spirit level */}
      <rect className={WORK} x="46" y="24" width="148" height="22" rx="3" />
      <rect className={WORK} x="104" y="28" width="32" height="14" rx="7" />
      <circle className={WORK} cx="120" cy="35" r="4" />
      <path className={WORK} d="M112 28v14M128 28v14" />
    </>
  ),
};

export interface TradePlateProps {
  trade: TradeKey;
  /** Plate index shown top-left, e.g. "01". */
  index: string;
  /** Headline caption — what was built. */
  title: string;
  /** Credit line — worker, trade, place. */
  credit: string;
  /** Real portfolio photograph. Supply this and the drawing steps aside. */
  photo?: { src: string; alt: string };
  className?: string;
}

export default function TradePlate({
  trade,
  index,
  title,
  credit,
  photo,
  className = "",
}: TradePlateProps) {
  return (
    <figure
      className={`group relative flex flex-col overflow-hidden rounded-[4px] border border-border bg-white transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-[0_26px_50px_-26px_rgba(34,29,22,0.35)] ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        {photo ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 768px) 90vw, 360px"
            className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
          />
        ) : (
          <>
            <div className="plate-grid absolute inset-0" />
            <svg
              viewBox="0 0 240 180"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.4] transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            >
              {TRADE_DRAWINGS[trade]}
            </svg>
          </>
        )}

        <span className="absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-deep tabular-nums">
          Pl.{index}
        </span>

        {/* Gold corner tick — the tell that this is a drawn plate, not a stock crop */}
        <span className="absolute right-3 bottom-3 z-10 h-4 w-4 border-r border-b border-gold/60 transition-all duration-500 group-hover:h-6 group-hover:w-6" />
      </div>

      <figcaption className="flex flex-1 flex-col justify-between gap-1 border-t border-border px-4 py-3.5">
        <span className="font-serif text-[17px] leading-tight font-normal text-ink">
          {title}
        </span>
        <span className="text-[12px] leading-snug text-ink-3">{credit}</span>
      </figcaption>
    </figure>
  );
}
