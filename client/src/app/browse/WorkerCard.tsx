"use client";

import { MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import type { BrowseWorker } from "@/features/browse";
import {
  avatarTint,
  bannerGradient,
  formatRate,
  tradeAccent,
} from "./constants";

interface Props {
  worker: BrowseWorker;
  onView: (w: BrowseWorker) => void;
}

/**
 * Find-a-Fundi worker card. Gradient cover banner + availability pill, avatar
 * with verification check, name, trade label, location, tagline (bio) and a
 * rating · experience footer. Single "View profile" action.
 */
export function WorkerCardGrid({ worker, onView }: Props) {
  const accent = tradeAccent(worker.trade);
  const available = worker.isAvailable;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[18px] border border-border bg-white shadow-[0_1px_2px_rgba(33,28,20,0.04)] transition-all duration-[220ms] hover:-translate-y-[3px] hover:border-ink-4 hover:shadow-[0_16px_36px_rgba(33,28,20,0.12)]">
      <div
        className="relative h-20"
        style={{ background: bannerGradient(worker.trade) } as CSSProperties}
      >
        <span
          className={`absolute top-[11px] right-[11px] flex items-center gap-[5px] rounded-full bg-white/[0.92] px-2.5 py-1 text-[11px] font-semibold shadow-[0_1px_3px_rgba(33,28,20,0.08)] ${available ? "text-green-700" : "text-red-600"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${available ? "bg-green-500" : "bg-red-400"}`}
          />
          {available ? "Available now" : "Booked"}
        </span>
      </div>

      <div className="relative ml-[18px] mt-[-31px] w-[62px]">
        <span
          className="flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white font-serif text-[23px] font-medium shadow-[0_2px_6px_rgba(33,28,20,0.08)]"
          style={
            {
              background: avatarTint(worker.trade),
              color: accent,
            } as CSSProperties
          }
        >
          {worker.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            // biome-ignore lint/performance/noImgElement: avatar URLs are arbitrary external hosts
            <img
              src={worker.avatarUrl}
              alt={worker.name}
              className="h-full w-full object-cover"
            />
          ) : (
            worker.initials
          )}
        </span>
        {worker.isVerified && (
          <span
            className="absolute -bottom-px -right-[3px] flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2.5px] border-white bg-gold-dark text-[11px] font-bold text-white"
            role="img"
            aria-label="Verified"
          >
            ✓
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-[18px] pb-[18px] pt-[11px]">
        <h3 className="m-0 font-serif text-[19px] font-medium leading-[1.15] text-ink">
          {worker.name}
        </h3>

        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 flex-none rounded-full"
            style={{ background: accent } as CSSProperties}
          />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: accent } as CSSProperties}
          >
            {worker.trade}
          </span>
        </div>

        {worker.location && (
          <p className="mt-[7px] flex items-center gap-[5px] text-sm text-ink-3">
            <MapPin size={13} aria-hidden className="text-ink-4" />
            {worker.location}
          </p>
        )}

        {worker.bio && (
          <p className="mt-[11px] line-clamp-2 text-sm leading-[1.45] text-ink-2">
            {worker.bio}
          </p>
        )}

        <div className="mb-[13px] mt-auto h-px bg-border" />

        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-ink-3">
          <span className="font-bold text-gold-dark">
            {formatRate(worker.currency, worker.dailyRate)}
            {worker.dailyRate > 0 && (
              <span className="font-normal text-ink-3">/day</span>
            )}
          </span>
          <span className="text-ink-4">·</span>
          {worker.reviewCount > 0 && (
            <>
              <span>
                <strong className="font-bold text-ink">
                  {worker.rating.toFixed(1)}
                </strong>{" "}
                rating
              </span>
              <span className="text-ink-4">·</span>
            </>
          )}
          <span>
            <strong className="font-bold text-ink">
              {worker.yearsExperience}{" "}
              {worker.yearsExperience === 1 ? "yr" : "yrs"}
            </strong>{" "}
            experience
          </span>
        </div>

        <button
          type="button"
          className="mt-3.5 inline-flex w-fit items-center gap-[7px] self-start whitespace-nowrap rounded-full border border-border bg-white px-[18px] py-[9px] text-sm font-semibold text-ink-2 transition-all duration-[180ms] hover:border-navy hover:bg-navy hover:text-white"
          onClick={() => onView(worker)}
        >
          View profile <span aria-hidden>→</span>
        </button>
      </div>
    </article>
  );
}
