"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import { type EmployerJob, useGetEmployerJobs } from "@/features/employer/jobs";
import { symbolOf } from "@/lib/currency";
import {
  Avatar,
  EL_BTN,
  EL_BTN_GOLD,
  EL_BTN_OUTLINE,
  EL_CARD,
  EL_RATE,
  EL_ROW,
  EL_ROW_ACTIONS,
  EL_ROW_BODY,
  EL_ROW_META,
  EL_ROW_NAME,
  EL_ROW_TOP,
  EmptyCard,
  fmtMoney,
  initialsOf,
  ListSkeleton,
  Stars,
  shortDate,
} from "../_shared/parts";
import HireModal from "../dashboard/HireModal";
import ReviewModal from "../dashboard/ReviewModal";

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
      <div className="flex flex-col gap-4 text-ink-2">
        <div>
          <div className="text-sm text-ink-3">History</div>
          <h1 className="font-serif text-[26px] font-normal text-ink mt-0.5 leading-[1.15]">
            Past hires.
          </h1>
          <p className="text-sm text-ink-3 mt-1">
            Workers you’ve completed jobs with - hire them again in a tap.
          </p>
        </div>

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : hires.length === 0 ? (
          <EmptyCard
            icon={<Clock size={40} />}
            title="No hires yet"
            sub="Your completed jobs will appear here."
            cta={
              <Link
                href="/employer/search"
                className={`${EL_BTN} ${EL_BTN_GOLD}`}
              >
                Find a fundi
              </Link>
            }
          />
        ) : (
          <div className={EL_CARD}>
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
      <ReviewModal
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
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
  const { user } = useAuth();
  const sym = symbolOf(user?.currency);
  const when = job.completedAt ?? job.createdAt;
  return (
    <div className={EL_ROW}>
      <Avatar name={job.workerName} url={job.avatarUrl} />
      <div className={EL_ROW_BODY}>
        <div className={EL_ROW_TOP}>
          <span className={EL_ROW_NAME}>
            {job.workerName}
            {job.trade ? ` - ${job.trade}` : ""}
          </span>
          {job.rating != null ? (
            <Stars value={job.rating} />
          ) : (
            <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 bg-green-50 text-green-600">
              Completed
            </span>
          )}
        </div>
        <div className={EL_ROW_META}>
          {job.jobType} · {job.location} · {shortDate(when)}
        </div>
        <div className={EL_ROW_ACTIONS}>
          {job.agreedRate ? (
            <span className={EL_RATE}>
              {sym} {fmtMoney(job.agreedRate)} paid
            </span>
          ) : null}
        </div>
        <div className={EL_ROW_ACTIONS}>
          <button
            type="button"
            className={`${EL_BTN} ${EL_BTN_GOLD}`}
            onClick={onHireAgain}
          >
            Hire again
          </button>
          {job.reviewedAt ? (
            <button
              type="button"
              className={`${EL_BTN} ${EL_BTN_OUTLINE}`}
              onClick={onReview}
            >
              Edit review
            </button>
          ) : (
            <button
              type="button"
              className={`${EL_BTN} ${EL_BTN_OUTLINE}`}
              onClick={onReview}
            >
              Leave review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
