"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import { type EmployerJob, useGetEmployerJobs } from "@/features/employer/jobs";
import HireModal from "../dashboard/HireModal";
import ReviewModal from "../dashboard/ReviewModal";
import {
  Avatar,
  EmptyCard,
  fmtMoney,
  initialsOf,
  ListSkeleton,
  Stars,
  shortDate,
} from "../_shared/parts";
import "../_shared/list.css";

type HireTarget = { id: string; name: string; trade: string };
type ReviewTarget = { jobId: string; workerName: string; jobType: string };

export default function EmployerHiresPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data: jobs, isLoading } = useGetEmployerJobs("completed");
  const [hireTarget, setHireTarget] = useState<HireTarget | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";
  const shellUser = { name, initials: initialsOf(name) };
  const employerLocation = profile?.location ?? "";

  const hires = jobs ?? [];

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <div className="el">
        <div>
          <div className="el-head-eyebrow">History</div>
          <h1 className="el-title">Past hires.</h1>
          <p className="el-sub">Workers you’ve completed jobs with — hire them again in a tap.</p>
        </div>

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : hires.length === 0 ? (
          <EmptyCard
            icon={<Clock size={40} />}
            title="No hires yet"
            sub="Your completed jobs will appear here."
            cta={
              <Link href="/employer/search" className="el-btn el-btn-gold">
                Find a fundi
              </Link>
            }
          />
        ) : (
          <div className="el-card">
            {hires.map((job) => (
              <HireRow
                key={job.id}
                job={job}
                onHireAgain={() =>
                  setHireTarget({
                    id: job.workerId,
                    name: job.workerName,
                    trade: job.trade || job.jobType,
                  })
                }
                onReview={() =>
                  setReviewTarget({
                    jobId: job.id,
                    workerName: job.workerName,
                    jobType: job.jobType,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <HireModal
        worker={hireTarget}
        defaultLocation={employerLocation}
        onClose={() => setHireTarget(null)}
      />
      <ReviewModal target={reviewTarget} onClose={() => setReviewTarget(null)} />
    </Shell>
  );
}

function HireRow({
  job,
  onHireAgain,
  onReview,
}: {
  job: EmployerJob;
  onHireAgain: () => void;
  onReview: () => void;
}) {
  const when = job.completedAt ?? job.createdAt;
  return (
    <div className="el-row">
      <Avatar name={job.workerName} url={job.avatarUrl} />
      <div className="el-row-body">
        <div className="el-row-top">
          <span className="el-row-name">
            {job.workerName}
            {job.trade ? ` — ${job.trade}` : ""}
          </span>
          {job.rating != null ? (
            <Stars value={job.rating} />
          ) : (
            <span className="el-badge el-badge-completed">Completed</span>
          )}
        </div>
        <div className="el-row-meta">
          {job.jobType} · {job.location} · {shortDate(when)}
        </div>
        <div className="el-row-actions">
          {job.agreedRate ? (
            <span className="el-rate">KSh {fmtMoney(job.agreedRate)} paid</span>
          ) : null}
        </div>
        <div className="el-row-actions">
          <button type="button" className="el-btn el-btn-gold" onClick={onHireAgain}>
            Hire again
          </button>
          {job.reviewedAt ? (
            <button type="button" className="el-btn el-btn-outline" onClick={onReview}>
              Edit review
            </button>
          ) : (
            <button type="button" className="el-btn el-btn-outline" onClick={onReview}>
              Leave review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
