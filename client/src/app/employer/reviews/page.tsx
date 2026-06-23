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
  EmptyCard,
  initialsOf,
  ListSkeleton,
  Stars,
  shortDate,
} from "../_shared/parts";
import "../_shared/list.css";

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
        .sort((a, b) => +new Date(b.reviewedAt!) - +new Date(a.reviewedAt!)),
    [jobs],
  );

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <div className="el">
        <div>
          <div className="el-head-eyebrow">Feedback</div>
          <h1 className="el-title">My reviews.</h1>
          <p className="el-sub">Ratings you’ve left for the fundis you’ve hired.</p>
        </div>

        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : reviews.length === 0 ? (
          <EmptyCard
            icon={<Star size={40} />}
            title="No reviews yet"
            sub="After a job is completed you can rate the fundi — your reviews show up here."
            cta={
              <Link href="/employer/hires" className="el-btn el-btn-gold">
                Go to past hires
              </Link>
            }
          />
        ) : (
          <div className="el-card">
            {reviews.map((r) => (
              <div key={r.id} className="el-row">
                <Avatar name={r.workerName} url={r.avatarUrl} />
                <div className="el-row-body">
                  <div className="el-row-top">
                    <span className="el-row-name">
                      {r.workerName}
                      {r.trade ? ` — ${r.trade}` : ""}
                    </span>
                    <Stars value={r.rating ?? 0} />
                  </div>
                  <div className="el-row-meta">
                    {r.jobType} · {r.location}
                  </div>
                  {r.reviewText && (
                    <p className="el-review-text">“{r.reviewText}”</p>
                  )}
                  {r.reviewedAt && (
                    <div className="el-review-date">
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
