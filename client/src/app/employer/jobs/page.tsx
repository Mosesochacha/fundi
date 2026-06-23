"use client";

import { Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import Shell from "@/components/dashboard/Shell";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/features/auth";
import {
  type EmployerJob,
  type EmployerJobStatus,
  useCancelJob,
  useGetEmployerJobs,
  useMarkComplete,
} from "@/features/employer/jobs";
import ReviewModal from "../dashboard/ReviewModal";
import {
  Avatar,
  EmptyCard,
  initialsOf,
  ListSkeleton,
  StatusBadge,
  shortDate,
} from "../_shared/parts";
import "../_shared/list.css";

type ReviewTarget = { jobId: string; workerName: string; jobType: string };

const TABS: { key: string; label: string; match: (s: EmployerJobStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "pending", label: "Pending", match: (s) => s === "pending" },
  { key: "accepted", label: "Active", match: (s) => s === "accepted" },
  { key: "completed", label: "Completed", match: (s) => s === "completed" },
  {
    key: "cancelled",
    label: "Cancelled",
    match: (s) => s === "cancelled" || s === "declined",
  },
];

export default function EmployerJobsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data: jobs, isLoading } = useGetEmployerJobs();
  const [tab, setTab] = useState("all");
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";
  const shellUser = { name, initials: initialsOf(name) };

  const all = jobs ?? [];
  const visible = useMemo(() => {
    const t = TABS.find((x) => x.key === tab) ?? TABS[0];
    return all.filter((j) => t.match(j.status));
  }, [all, tab]);

  const countFor = (key: string) => {
    const t = TABS.find((x) => x.key === key);
    return t ? all.filter((j) => t.match(j.status)).length : 0;
  };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <div className="el">
        <div>
          <div className="el-head-eyebrow">Your hires</div>
          <h1 className="el-title">My jobs.</h1>
          <p className="el-sub">Track every job you’ve sent to a fundi.</p>
        </div>

        <div className="el-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`el-tab${tab === t.key ? " is-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {!isLoading && (
                <span className="el-tab-count">{countFor(t.key)}</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : visible.length === 0 ? (
          <EmptyCard
            icon={<Briefcase size={40} />}
            title="No jobs here"
            sub="Find a fundi and send your first hire request."
            cta={
              <Link href="/employer/search" className="el-btn el-btn-gold">
                Find a fundi
              </Link>
            }
          />
        ) : (
          <div className="el-card">
            {visible.map((job) => (
              <JobRow
                key={job.id}
                job={job}
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

      <ReviewModal target={reviewTarget} onClose={() => setReviewTarget(null)} />
    </Shell>
  );
}

function JobRow({
  job,
  onReview,
}: {
  job: EmployerJob;
  onReview: () => void;
}) {
  const { success, error: toastError } = useToastContext();
  const complete = useMarkComplete();
  const cancel = useCancelJob();
  const [confirm, setConfirm] = useState<null | "complete" | "cancel">(null);

  const when = job.scheduledAt ?? job.createdAt;

  const run = async (action: "complete" | "cancel") => {
    try {
      if (action === "complete") {
        await complete.mutateAsync(job.id);
        success("Job marked as complete.");
      } else {
        await cancel.mutateAsync(job.id);
        success("Request cancelled.");
      }
      setConfirm(null);
    } catch (e) {
      const msg =
        typeof e === "object" &&
        e !== null &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toastError(typeof msg === "string" ? msg : "Something went wrong.");
    }
  };

  const busy = complete.isPending || cancel.isPending;

  return (
    <div className="el-row">
      <Avatar name={job.workerName} url={job.avatarUrl} />
      <div className="el-row-body">
        <div className="el-row-top">
          <span className="el-row-name">
            {job.workerName}
            {job.trade ? ` — ${job.trade}` : ""}
          </span>
          <StatusBadge status={job.status} />
        </div>
        <div className="el-row-meta">
          {job.jobType} · {job.location} · {shortDate(when)}
        </div>
        {job.description && <p className="el-row-desc">{job.description}</p>}

        {confirm ? (
          <div className="el-confirm">
            <div className="el-confirm-title">
              {confirm === "complete"
                ? "Mark this job as complete?"
                : "Cancel this request?"}
            </div>
            <div className="el-confirm-sub">The fundi will be notified.</div>
            <div className="el-confirm-actions">
              <button
                type="button"
                className={`el-btn ${confirm === "cancel" ? "el-btn-danger" : "el-btn-gold"}`}
                disabled={busy}
                onClick={() => run(confirm)}
              >
                {busy
                  ? "Working…"
                  : confirm === "complete"
                    ? "Yes, complete"
                    : "Yes, cancel"}
              </button>
              <button
                type="button"
                className="el-btn el-btn-outline"
                onClick={() => setConfirm(null)}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="el-row-actions">
            <Link
              href={`/employer/messages?to=${job.workerId}`}
              className="el-btn el-btn-outline"
            >
              Message
            </Link>
            {job.status === "pending" && (
              <button
                type="button"
                className="el-btn el-btn-danger"
                onClick={() => setConfirm("cancel")}
              >
                Cancel
              </button>
            )}
            {job.status === "accepted" && (
              <button
                type="button"
                className="el-btn el-btn-gold"
                onClick={() => setConfirm("complete")}
              >
                Mark complete
              </button>
            )}
            {job.status === "completed" &&
              (job.reviewedAt ? (
                <span className="el-btn el-btn-outline" aria-disabled>
                  Reviewed ✓
                </span>
              ) : (
                <button
                  type="button"
                  className="el-btn el-btn-gold"
                  onClick={onReview}
                >
                  Leave review
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
