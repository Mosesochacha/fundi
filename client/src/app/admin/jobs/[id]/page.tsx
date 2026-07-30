"use client";

import { ArrowRight, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  ConfirmModal,
  DetailCard,
  formatDate,
  formatDateTime,
  InfoRow,
  money,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminJob,
} from "@/features/admin";
import { cn } from "@/lib/utils";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-gold-dark">
      <Star size={14} className="fill-current" />
      <span className="text-sm font-medium text-ink">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function AdminJobDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { data: job, isLoading } = useAdminJob(id);
  const { success } = useToastContext();
  const action = useAdminAction();

  const [confirm, setConfirm] = useState<null | "cancel" | "flag">(null);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="h-8 w-48 bg-white border border-border rounded-lg animate-pulse mb-5" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <div className="h-72 bg-white border border-border rounded-xl animate-pulse" />
          <div className="h-72 bg-white border border-border rounded-xl animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  if (!job) {
    return (
      <AdminShell>
        <AdminPageHeader
          backHref="/admin/jobs"
          backLabel="Jobs"
          title="Job not found"
          subtitle="This job may have been removed or never existed."
        />
      </AdminShell>
    );
  }

  const runCancel = async () => {
    await action.mutateAsync(adminEndpoints.cancelJob(job.id));
    success("Job cancelled.");
    setConfirm(null);
  };

  const runFlag = async () => {
    await action.mutateAsync(adminEndpoints.flagJob(job.id));
    success("Job flagged for review.");
    setConfirm(null);
  };

  return (
    <AdminShell>
      <AdminPageHeader
        backHref="/admin/jobs"
        backLabel="Jobs"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {job.title}
            <StatusBadge status={job.status} />
          </span>
        }
      />

      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar initials={initialsOf(job.worker)} color="gold" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-ink-3">
                Worker
              </p>
              <p className="font-semibold text-ink truncate">{job.worker}</p>
            </div>
          </div>
          <ArrowRight size={18} className="shrink-0 text-ink-3" />
          <div className="flex items-center gap-3 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-[11px] uppercase tracking-wider text-ink-3">
                Employer
              </p>
              <p className="font-semibold text-ink truncate">{job.employer}</p>
            </div>
            <Avatar initials={initialsOf(job.employer)} color="blue" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="Job details">
            <InfoRow label="Description" value={job.description ?? "—"} />
            <InfoRow label="Trade" value={job.trade} />
            <InfoRow label="Location" value={job.location} />
            <InfoRow label="Scheduled date" value={formatDate(job.date)} />
            <InfoRow label="Estimated duration" value={job.duration ?? "—"} />
            <InfoRow
              label="Agreed rate"
              value={money(job.rate, job.currency)}
            />
          </DetailCard>

          <DetailCard title="Timeline">
            {job.timeline && job.timeline.length > 0 ? (
              <ol className="relative ml-1">
                {job.timeline.map((step, i) => {
                  const done = step.at !== null;
                  const last = i === (job.timeline?.length ?? 0) - 1;
                  return (
                    <li
                      key={step.step}
                      className="relative flex gap-3 pb-5 last:pb-0"
                    >
                      {!last && (
                        <span className="absolute left-[5px] top-3.5 bottom-0 w-px bg-cream-2" />
                      )}
                      <span
                        className={cn(
                          "relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                          done ? "bg-gold" : "bg-white border-2 border-cream-2",
                        )}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            done ? "text-ink font-medium" : "text-ink-3",
                          )}
                        >
                          {step.step}
                        </p>
                        <p className="text-[11px] text-ink-3">
                          {step.at ? formatDateTime(step.at) : "—"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-ink-3">No timeline available.</p>
            )}
          </DetailCard>
        </div>

        <div className="flex flex-col gap-4">
          <DetailCard title="Worker">
            <div className="flex items-center gap-3">
              <Avatar
                initials={initialsOf(job.worker)}
                color="gold"
                size="lg"
              />
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">{job.worker}</p>
                <p className="text-[11px] text-ink-3 truncate">
                  {job.workerTrade ?? job.trade}
                </p>
                {job.workerRating !== undefined && (
                  <span className="mt-0.5 inline-block">
                    <Stars rating={job.workerRating} />
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/admin/workers/${job.workerId}`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-gold-dark no-underline hover:underline"
            >
              View profile <ExternalLink size={13} />
            </Link>
          </DetailCard>

          <DetailCard title="Employer">
            <div className="flex items-center gap-3">
              <Avatar
                initials={initialsOf(job.employer)}
                color="blue"
                size="lg"
              />
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">
                  {job.employer}
                </p>
                <p className="text-[11px] text-ink-3 truncate">
                  {job.location}
                </p>
              </div>
            </div>
            <Link
              href={`/admin/employers/${job.employerId}`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-gold-dark no-underline hover:underline"
            >
              View profile <ExternalLink size={13} />
            </Link>
          </DetailCard>

          <DetailCard title="Messages">
            {job.conversationId ? (
              <InfoRow label="Conversation" value={job.conversationId} />
            ) : (
              <p className="text-sm text-ink-3">No linked conversation.</p>
            )}
          </DetailCard>

          <DetailCard title="Review">
            {job.review ? (
              <div>
                <Stars rating={job.review.rating} />
                <p className="mt-2 text-sm text-ink-2">{job.review.text}</p>
              </div>
            ) : (
              <p className="text-sm text-ink-3">No review yet.</p>
            )}
          </DetailCard>

          <DetailCard title="Admin actions" danger>
            <div className="flex flex-col gap-2">
              {job.status === "active" && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => setConfirm("cancel")}
                >
                  Cancel job
                </Button>
              )}
              <Button variant="outline" onClick={() => setConfirm("flag")}>
                Flag for review
              </Button>
            </div>
          </DetailCard>
        </div>
      </div>

      <ConfirmModal
        open={confirm === "cancel"}
        title="Cancel job"
        message={`Cancel "${job.title}"? Both parties will be notified and the booking will be voided.`}
        confirmLabel="Cancel job"
        loading={action.isPending}
        onConfirm={runCancel}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmModal
        open={confirm === "flag"}
        title="Flag for review"
        message={`Flag "${job.title}" for further review by the moderation team?`}
        confirmLabel="Flag"
        destructive={false}
        loading={action.isPending}
        onConfirm={runFlag}
        onCancel={() => setConfirm(null)}
      />
    </AdminShell>
  );
}
