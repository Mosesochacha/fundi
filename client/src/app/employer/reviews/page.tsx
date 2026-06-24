"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import { useGetEmployerJobs } from "@/features/employer/jobs";
import {
  Avatar,
  EL_BTN,
  EL_BTN_GOLD,
  EL_CARD,
  EL_ROW,
  EL_ROW_BODY,
  EL_ROW_META,
  EL_ROW_NAME,
  EL_ROW_TOP,
  EmptyCard,
  initialsOf,
  ListSkeleton,
  Stars,
  shortDate,
} from "../_shared/parts";

export default function EmployerReviewsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data: jobs, isLoading } = useGetEmployerJobs("completed");

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";
  const shellUser = { name, initials: initialsOf(name) };

  // Only completed jobs the employer has actually reviewed.
  const reviews = useMemo(
    () =>
      (jobs ?? [])
        .filter((j) => j.reviewedAt && j.rating != null)
        .sort(
          (a, b) =>
            +new Date(b.reviewedAt as string) -
            +new Date(a.reviewedAt as string),
        ),
    [jobs],
  );

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <div className="flex flex-col gap-4 text-ink-2">
        <div>
          <div className="text-xs text-ink-3">Feedback</div>
          <h1 className="font-serif text-[26px] font-normal text-ink mt-0.5 leading-[1.15]">
            My reviews.
          </h1>
          <p className="text-[13px] text-ink-3 mt-1">
            Ratings you’ve left for the fundis you’ve hired.
          </p>
        </div>

        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : reviews.length === 0 ? (
          <EmptyCard
            icon={<Star size={40} />}
            title="No reviews yet"
            sub="After a job is completed you can rate the fundi - your reviews show up here."
            cta={
              <Link
                href="/employer/hires"
                className={`${EL_BTN} ${EL_BTN_GOLD}`}
              >
                Go to past hires
              </Link>
            }
          />
        ) : (
          <div className={EL_CARD}>
            {reviews.map((r) => (
              <div key={r.id} className={EL_ROW}>
                <Avatar name={r.workerName} url={r.avatarUrl} />
                <div className={EL_ROW_BODY}>
                  <div className={EL_ROW_TOP}>
                    <span className={EL_ROW_NAME}>
                      {r.workerName}
                      {r.trade ? ` - ${r.trade}` : ""}
                    </span>
                    <Stars value={r.rating ?? 0} />
                  </div>
                  <div className={EL_ROW_META}>
                    {r.jobType} · {r.location}
                  </div>
                  {r.reviewText && (
                    <p className="text-xs text-ink-2 leading-relaxed mt-2 italic">
                      “{r.reviewText}”
                    </p>
                  )}
                  {r.reviewedAt && (
                    <div className="text-[11px] text-ink-3 mt-1.5">
                      Reviewed {shortDate(r.reviewedAt)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
