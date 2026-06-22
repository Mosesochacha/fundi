"use client";

import { Star } from "lucide-react";
import { usePathname } from "next/navigation";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import {
  type WorkerReview,
  useGetWorkerReviews,
} from "@/features/worker/reviews";
import "./reviews.css";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function WorkerReviewsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data, isLoading, isError, refetch } = useGetWorkerReviews();

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Worker";
  const shellUser = { name, initials: initialsOf(name) };

  const summary = data?.summary;
  const reviews = data?.reviews ?? [];
  const hasReviews = reviews.length > 0;

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="worker" user={shellUser} currentPath={pathname}>
      <div className="rv">
        <div className="rv-head">
          <h1 className="rv-title">Reviews</h1>
          <p className="rv-sub">What employers say about your work.</p>
        </div>

        {isError && (
          <button type="button" className="rv-error" onClick={() => refetch()}>
            Could not load your reviews. Tap to retry.
          </button>
        )}

        {isLoading ? (
          <ReviewsSkeleton />
        ) : !hasReviews ? (
          <div className="rv-card rv-empty">
            <span className="rv-empty-icon">
              <Star size={40} />
            </span>
            <div className="rv-empty-title">No reviews yet</div>
            <p className="rv-empty-sub">
              Complete jobs to start receiving reviews from employers.
            </p>
          </div>
        ) : (
          <div className="rv-layout">
            {/* Summary */}
            <aside className="rv-card rv-summary">
              <div className="rv-score">{(summary?.rating ?? 0).toFixed(1)}</div>
              <Stars value={summary?.rating ?? 0} size={18} />
              <div className="rv-count">
                {summary?.reviewCount}{" "}
                {summary?.reviewCount === 1 ? "review" : "reviews"}
              </div>

              <div className="rv-breakdown">
                {(summary?.breakdown ?? []).map((row) => {
                  const total = summary?.reviewCount ?? 0;
                  const pct = total > 0 ? (row.count / total) * 100 : 0;
                  return (
                    <div key={row.stars} className="rv-bar-row">
                      <span className="rv-bar-label">{row.stars}★</span>
                      <span className="rv-bar">
                        <span
                          className="rv-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="rv-bar-count">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* List */}
            <div className="rv-list">
              {reviews.map((rev) => (
                <ReviewItem key={rev.id} rev={rev} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function ReviewItem({ rev }: { rev: WorkerReview }) {
  return (
    <div className="rv-card rv-item">
      <div className="rv-item-top">
        <span className="rv-avatar">{initialsOf(rev.authorName)}</span>
        <div className="rv-item-who">
          <span className="rv-item-name">{rev.authorName}</span>
          <span className="rv-item-job">{rev.jobTitle}</span>
        </div>
        <div className="rv-item-meta">
          <Stars value={rev.rating} size={13} />
          <span className="rv-item-date">{longDate(rev.date)}</span>
        </div>
      </div>
      {rev.text && <p className="rv-item-text">{rev.text}</p>}
    </div>
  );
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="rv-stars" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-star row
          key={i}
          size={size}
          fill={i < Math.round(value) ? "currentColor" : "none"}
          strokeWidth={i < Math.round(value) ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="rv-layout">
      <aside className="rv-card rv-summary">
        <div className="rv-skel rv-skel-score" />
        <div className="rv-skel rv-skel-line" />
      </aside>
      <div className="rv-list">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rv-card rv-item">
            <div className="rv-skel rv-skel-line" />
            <div className="rv-skel rv-skel-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}
