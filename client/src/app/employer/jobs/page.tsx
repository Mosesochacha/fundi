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
import {
  Avatar,
  EL_BTN,
  EL_BTN_DANGER,
  EL_BTN_GOLD,
  EL_BTN_OUTLINE,
  EL_CARD,
  EL_ROW,
  EL_ROW_ACTIONS,
  EL_ROW_BODY,
  EL_ROW_META,
  EL_ROW_NAME,
  EL_ROW_TOP,
  EmptyCard,
  initialsOf,
  ListSkeleton,
  StatusBadge,
  shortDate,
} from "../_shared/parts";
import ReviewModal from "../dashboard/ReviewModal";

type ReviewTarget = { jobId: string; workerName: string; jobType: string };

const TABS: {
  key: string;
  label: string;
  match: (s: EmployerJobStatus) => boolean;
}[] = [
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
      <div className="flex flex-col gap-4 text-ink-2">
        <div>
          <div className="text-xs text-ink-3">Your hires</div>
          <h1 className="font-serif text-[26px] font-normal text-ink mt-0.5 leading-[1.15]">
            My jobs.
          </h1>
          <p className="text-[13px] text-ink-3 mt-1">
            Track every job you’ve sent to a fundi.
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`inline-flex items-center gap-1.5 border rounded-full px-[13px] py-1.5 text-xs cursor-pointer ${
                tab === t.key
                  ? "bg-gold-light border-gold text-gold-dark font-semibold"
                  : "bg-white border-border text-ink-2 hover:border-gold"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {!isLoading && (
                <span className="text-[10px] bg-black/[0.06] rounded-full px-1.5 leading-4">
                  {countFor(t.key)}
                </span>
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

      <ReviewModal
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
    </Shell>
  );
}

function JobRow({ job, onReview }: { job: EmployerJob; onReview: () => void }) {
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
    <div className={EL_ROW}>
      <Avatar name={job.workerName} url={job.avatarUrl} />
      <div className={EL_ROW_BODY}>
        <div className={EL_ROW_TOP}>
          <span className={EL_ROW_NAME}>
            {job.workerName}
            {job.trade ? ` - ${job.trade}` : ""}
          </span>
          <StatusBadge status={job.status} />
        </div>
        <div className={EL_ROW_META}>
          {job.jobType} · {job.location} · {shortDate(when)}
        </div>
        {job.description && (
          <p className="text-xs text-ink-2 leading-normal mt-1.5 line-clamp-2">
            {job.description}
          </p>
        )}

        {confirm ? (
          <div className="mt-2.5 px-3 py-2.5 bg-cream border border-border rounded-lg">
            <div className="text-xs font-semibold text-ink">
              {confirm === "complete"
                ? "Mark this job as complete?"
                : "Cancel this request?"}
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5">
              The fundi will be notified.
            </div>
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                className={`${EL_BTN} ${confirm === "cancel" ? EL_BTN_DANGER : EL_BTN_GOLD}`}
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
                className={`${EL_BTN} ${EL_BTN_OUTLINE}`}
                onClick={() => setConfirm(null)}
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className={EL_ROW_ACTIONS}>
            <Link
              href={`/employer/messages?to=${job.workerId}`}
              className={`${EL_BTN} ${EL_BTN_OUTLINE}`}
            >
              Message
            </Link>
            {job.status === "pending" && (
              <button
                type="button"
                className={`${EL_BTN} ${EL_BTN_DANGER}`}
                onClick={() => setConfirm("cancel")}
              >
                Cancel
              </button>
            )}
            {job.status === "accepted" && (
              <button
                type="button"
                className={`${EL_BTN} ${EL_BTN_GOLD}`}
                onClick={() => setConfirm("complete")}
              >
                Mark complete
              </button>
            )}
            {job.status === "completed" &&
              (job.reviewedAt ? (
                <span className={`${EL_BTN} ${EL_BTN_OUTLINE}`} aria-disabled>
                  Reviewed ✓
                </span>
              ) : (
                <button
                  type="button"
                  className={`${EL_BTN} ${EL_BTN_GOLD}`}
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
