"use client";

import { MapPin } from "lucide-react";
import type { BrowseWorker } from "@/features/browse";
import { avatarTint, bannerGradient, tradeAccent } from "./constants";

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
    <article className="wk-card">
      {/* COVER BANNER */}
      <div
        className="wk-banner"
        style={{ background: bannerGradient(worker.trade) }}
      >
        <span className={`wk-avail ${available ? "is-avail" : "is-booked"}`}>
          <span className="wk-avail-dot" />
          {available ? "Available now" : "Booked"}
        </span>
      </div>

      {/* AVATAR */}
      <div className="wk-avatar-wrap">
        <span
          className="wk-avatar"
          style={{ background: avatarTint(worker.trade), color: accent }}
        >
          {worker.avatarUrl ? (
            // biome-ignore lint/performance/noImgElement: avatar URLs are arbitrary external hosts
            // eslint-disable-next-line @next/next/no-img-element
            <img src={worker.avatarUrl} alt={worker.name} />
          ) : (
            worker.initials
          )}
        </span>
        {worker.isVerified && (
          <span className="wk-check" role="img" aria-label="Verified">
            ✓
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="wk-body">
        <h3 className="wk-name">{worker.name}</h3>

        <div className="wk-trade">
          <span className="wk-trade-dot" style={{ background: accent }} />
          <span className="wk-trade-label" style={{ color: accent }}>
            {worker.trade}
          </span>
        </div>

        {worker.location && (
          <p className="wk-loc">
            <MapPin size={13} aria-hidden />
            {worker.location}
          </p>
        )}

        {worker.bio && <p className="wk-tagline">{worker.bio}</p>}

        <div className="wk-divider" />

        <div className="wk-meta">
          {worker.reviewCount > 0 && (
            <>
              <span>
                <strong>{worker.rating.toFixed(1)}</strong> rating
              </span>
              <span className="wk-meta-sep">·</span>
            </>
          )}
          <span>
            <strong>
              {worker.yearsExperience}{" "}
              {worker.yearsExperience === 1 ? "yr" : "yrs"}
            </strong>{" "}
            experience
          </span>
        </div>

        <button
          type="button"
          className="wk-view"
          onClick={() => onView(worker)}
        >
          View profile <span aria-hidden>→</span>
        </button>
      </div>
    </article>
  );
}
