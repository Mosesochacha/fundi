"use client";

import { Star } from "lucide-react";
import { usePathname } from "next/navigation";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import {
  useGetWorkerReviews,
  type WorkerReview,
} from "@/features/worker/reviews";

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

const CARD = "bg-white border border-border rounded-xl p-[18px]";
const SKEL =
  "rounded-md bg-[linear-gradient(90deg,#efece6_25%,#f6f4ef_50%,#efece6_75%)] bg-[length:200%_100%] animate-[rv-shimmer_1.3s_infinite]";

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
      {/* Local shimmer keyframes — referenced by the SKEL utility above. */}
      <style>{`@keyframes rv-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div className="flex flex-col gap-4 text-ink-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-serif text-[26px] font-normal text-ink">
            Reviews
          </h1>
          <p className="text-[13px] text-ink-3">
            What employers say about your work.
          </p>
        </div>

        {isError && (
          <button
            type="button"
            className="text-center p-3 rounded-[10px] bg-red-50 border border-red-200 text-red-600 text-sm cursor-pointer"
            onClick={() => refetch()}
          >
            Could not load your reviews. Tap to retry.
          </button>
        )}

        {isLoading ? (
          <ReviewsSkeleton />
        ) : !hasReviews ? (
          <div
            className={`${CARD} flex flex-col items-center text-center gap-1.5 py-12 px-[18px]`}
          >
            <span className="text-gold opacity-70">
              <Star size={40} />
            </span>
            <div className="font-serif text-lg text-ink">No reviews yet</div>
            <p className="text-sm text-ink-3 max-w-[360px]">
              Complete jobs to start receiving reviews from employers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[860px]:grid-cols-[260px_1fr] gap-4 items-start">
            {/* Summary */}
            <aside
              className={`${CARD} flex flex-col items-center gap-1.5 sticky top-4`}
            >
              <div className="font-serif text-[44px] leading-none text-ink">
                {(summary?.rating ?? 0).toFixed(1)}
              </div>
              <Stars value={summary?.rating ?? 0} size={18} />
              <div className="text-[13px] text-ink-3 mb-2">
                {summary?.reviewCount}{" "}
                {summary?.reviewCount === 1 ? "review" : "reviews"}
              </div>

              <div className="w-full flex flex-col gap-1.5 mt-1.5">
                {(summary?.breakdown ?? []).map((row) => {
                  const total = summary?.reviewCount ?? 0;
                  const pct = total > 0 ? (row.count / total) * 100 : 0;
                  return (
                    <div
                      key={row.stars}
                      className="grid grid-cols-[28px_1fr_20px] items-center gap-2 text-xs text-ink-3"
                    >
                      <span>{row.stars}★</span>
                      <span className="h-1.5 rounded-[3px] bg-border overflow-hidden">
                        <span
                          className="block h-full bg-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="text-right">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* List */}
            <div className="flex flex-col gap-3">
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
    <div className={`${CARD} flex flex-col gap-2`}>
      <div className="flex items-center gap-2.5">
        <span className="flex-none w-9 h-9 rounded-full grid place-items-center bg-gold-light text-gold-dark text-[13px] font-semibold">
          {initialsOf(rev.authorName)}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-ink text-sm">
            {rev.authorName}
          </span>
          <span className="text-xs text-ink-3">{rev.jobTitle}</span>
        </div>
        <div className="ml-auto flex flex-col items-end gap-0.5">
          <Stars value={rev.rating} size={13} />
          <span className="text-[11px] text-ink-3">{longDate(rev.date)}</span>
        </div>
      </div>
      {rev.text && (
        <p className="text-sm leading-normal text-ink-2">{rev.text}</p>
      )}
    </div>
  );
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex gap-px text-gold"
      role="img"
      aria-label={`${value} out of 5`}
    >
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
    <div className="grid grid-cols-1 min-[860px]:grid-cols-[260px_1fr] gap-4 items-start">
      <aside className={`${CARD} flex flex-col items-center gap-1.5`}>
        <div className={`${SKEL} w-20 h-11 mx-auto`} />
        <div className={`${SKEL} h-3.5 w-full mt-2`} />
      </aside>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${CARD} flex flex-col gap-2`}>
            <div className={`${SKEL} h-3.5 w-full mt-2`} />
            <div className={`${SKEL} h-3.5 w-3/5 mt-2`} />
          </div>
        ))}
      </div>
    </div>
  );
}
