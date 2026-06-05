"use client";

import { MapPin, Star, BadgeCheck, CircleCheck } from "lucide-react";
import type { BrowseWorker } from "@/features/browse";
import { bannerColor, avatarTint, formatRate } from "./constants";

interface Props {
  worker: BrowseWorker;
  onView: (w: BrowseWorker) => void;
  onHire: (w: BrowseWorker) => void;
}

/**
 * Rating display. Workers with at least one review get the star row; workers
 * with no reviews get a plain muted "New" pill — no star, no dash.
 */
function Rating({ worker }: { worker: BrowseWorker }) {
  if (worker.reviewCount < 1) {
    return <span className="wk-new-pill">New</span>;
  }
  return (
    <span className="wk-rating" aria-label={`Rated ${worker.rating}`}>
      <Star size={12} className="wk-star" aria-hidden />
      <span className="wk-rating-num">{worker.rating.toFixed(1)}</span>
      <span className="wk-rating-meta">({worker.reviewCount})</span>
    </span>
  );
}

export function WorkerCardGrid({ worker, onView, onHire }: Props) {
  return (
    <article className="wk-card">
      <div className="wk-banner" style={{ background: bannerColor(worker.trade) }}>
        <span className="wk-trade-tag">{worker.trade}</span>
        {worker.isAvailable && <span className="wk-avail-dot" aria-label="Available now" />}
      </div>

      <div className="wk-body">
        <div className="wk-avatar-wrap">
          <span
            className="wk-avatar"
            style={{ background: avatarTint(worker.trade) }}
          >
            {worker.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={worker.avatarUrl} alt={worker.name} />
            ) : (
              worker.initials
            )}
            {worker.isAvailable && <span className="wk-online" aria-hidden />}
          </span>
        </div>

        <div className="wk-name-row">
          <h3 className="wk-name">{worker.name}</h3>
          {worker.isVerified && (
            <BadgeCheck size={14} className="wk-verified" aria-label="Verified" />
          )}
        </div>
        <p className="wk-handle">@{worker.username}</p>
        {worker.location && (
          <p className="wk-loc">
            <MapPin size={11} aria-hidden />
            {worker.location}
          </p>
        )}
        {worker.bio && <p className="wk-bio">{worker.bio}</p>}

        <div className="wk-footer">
          <div className="wk-stats">
            <Rating worker={worker} />
            {worker.jobsDone > 0 && (
              <span className="wk-jobs">{worker.jobsDone} jobs</span>
            )}
          </div>
          <span className="wk-rate">{formatRate(worker.currency, worker.dailyRate)}</span>
        </div>

        <div className="wk-cta">
          <button type="button" className="wk-btn wk-btn-outline" onClick={() => onView(worker)}>
            View profile
          </button>
          <button type="button" className="wk-btn wk-btn-gold" onClick={() => onHire(worker)}>
            Request hire
          </button>
        </div>
      </div>
    </article>
  );
}

export function WorkerCardList({ worker, onView, onHire }: Props) {
  return (
    <article className="wk-row">
      <span className="wk-avatar wk-avatar-row" style={{ background: avatarTint(worker.trade) }}>
        {worker.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={worker.avatarUrl} alt={worker.name} />
        ) : (
          worker.initials
        )}
        {worker.isAvailable && <span className="wk-online" aria-hidden />}
      </span>

      <div className="wk-row-content">
        <div className="wk-row-top">
          <h3 className="wk-name">{worker.name}</h3>
          {worker.isVerified && (
            <span className="wk-chip wk-chip-verified">
              <BadgeCheck size={11} aria-hidden /> Verified
            </span>
          )}
          {worker.isAvailable && (
            <span className="wk-chip wk-chip-avail">
              <CircleCheck size={11} aria-hidden /> Available
            </span>
          )}
          <span className="wk-chip wk-chip-trade">{worker.trade}</span>
        </div>
        <div className="wk-row-meta">
          <Rating worker={worker} />
          {worker.location && (
            <span className="wk-loc-inline">
              <MapPin size={11} aria-hidden />
              {worker.location}
            </span>
          )}
          {worker.jobsDone > 0 && (
            <span className="wk-jobs">{worker.jobsDone} jobs done</span>
          )}
          <span className="wk-rate">{formatRate(worker.currency, worker.dailyRate)}</span>
        </div>
      </div>

      <div className="wk-row-actions">
        <button type="button" className="wk-btn wk-btn-outline" onClick={() => onView(worker)}>
          Profile
        </button>
        <button type="button" className="wk-btn wk-btn-gold" onClick={() => onHire(worker)}>
          Hire
        </button>
      </div>
    </article>
  );
}
