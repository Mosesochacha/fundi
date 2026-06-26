"use client";

import { Star } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  ConfirmModal,
  DetailCard,
  formatDate,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminReview,
} from "@/features/admin";
import { cn } from "@/lib/utils";

/** Gold filled stars out of 5 with grey remainder. */
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-star scale
          key={i}
          size={size}
          className={cn(
            i < Math.round(rating)
              ? "fill-gold text-gold"
              : "fill-cream-2 text-cream-2",
          )}
        />
      ))}
    </span>
  );
}

type ActionKey = "keep" | "hide" | "remove" | "warn";

export default function AdminReviewDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { data: review, isLoading } = useAdminReview(id);
  const { success } = useToastContext();
  const action = useAdminAction();

  const [open, setOpen] = useState<ActionKey | null>(null);
  const [warnReason, setWarnReason] = useState("");

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

  if (!review) {
    return (
      <AdminShell>
        <AdminPageHeader
          backHref="/admin/reviews"
          backLabel="Reviews"
          title="Review not found"
          subtitle="This review may have been removed or never existed."
        />
      </AdminShell>
    );
  }

  const run = async (key: ActionKey, toast: string) => {
    const descriptor =
      key === "keep"
        ? adminEndpoints.keepReview(review.id)
        : key === "hide"
          ? adminEndpoints.hideReview(review.id)
          : key === "remove"
            ? adminEndpoints.removeReview(review.id)
            : adminEndpoints.warnReviewer(review.id, warnReason || undefined);
    await action.mutateAsync(descriptor);
    success(toast);
    setOpen(null);
    setWarnReason("");
  };

  return (
    <AdminShell>
      <AdminPageHeader
        backHref="/admin/reviews"
        backLabel="Reviews"
        title="Review detail"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Left */}
        <DetailCard title="Review">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  initials={initialsOf(review.worker)}
                  color="gold"
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-ink-3">
                    Worker reviewed
                  </p>
                  <p className="font-semibold text-ink truncate">
                    {review.worker}
                  </p>
                  <p className="text-[11px] text-ink-3 truncate">
                    {review.workerTrade}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  initials={initialsOf(review.reviewer)}
                  color="blue"
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-ink-3">
                    Reviewer
                  </p>
                  <p className="font-semibold text-ink truncate">
                    {review.reviewer}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Stars rating={review.rating} size={22} />
              <span className="text-sm font-medium text-ink">
                {review.rating.toFixed(1)}
              </span>
            </div>

            <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">
              {review.text}
            </p>

            <p className="text-[11px] text-ink-3 pt-2 border-t border-cream-2">
              Date {formatDate(review.date)} · Job ref {review.jobRef ?? "—"}
            </p>
          </div>
        </DetailCard>

        {/* Right */}
        <DetailCard title="Moderation">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-3">Status</span>
              <StatusBadge status={review.visibility} />
            </div>

            <div className="text-sm">
              <span className="text-ink-3">Flagged: </span>
              {review.flagged ? (
                <span className="text-ink-2">
                  Yes — flagged by {review.flaggedBy ?? "unknown"}
                  {review.flagReason && (
                    <span className="block mt-1 text-ink-3">
                      Reason: {review.flagReason}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-ink-2">No</span>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-cream-2">
              <Button
                variant="outline"
                className="w-full text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => setOpen("keep")}
              >
                Keep review
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen("hide")}
              >
                Hide review
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setOpen("remove")}
              >
                Remove review
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen("warn")}
              >
                Warn reviewer
              </Button>
            </div>
          </div>
        </DetailCard>
      </div>

      <ConfirmModal
        open={open === "keep"}
        title="Keep review"
        message="Keep this review and mark it as reviewed?"
        destructive={false}
        confirmLabel="Keep review"
        loading={action.isPending}
        onConfirm={() => run("keep", "Review kept and marked reviewed.")}
        onCancel={() => setOpen(null)}
      />

      <ConfirmModal
        open={open === "hide"}
        title="Hide review"
        message="Hide this review from the worker's public profile?"
        destructive={false}
        confirmLabel="Hide review"
        loading={action.isPending}
        onConfirm={() => run("hide", "Review hidden.")}
        onCancel={() => setOpen(null)}
      />

      <ConfirmModal
        open={open === "remove"}
        title="Remove review"
        message="Permanently remove this review? This cannot be undone."
        confirmLabel="Remove review"
        loading={action.isPending}
        onConfirm={() => run("remove", "Review removed.")}
        onCancel={() => setOpen(null)}
      />

      <ConfirmModal
        open={open === "warn"}
        title="Warn reviewer"
        message={`Send a warning to ${review.reviewer} about this review.`}
        destructive={false}
        confirmLabel="Send warning"
        loading={action.isPending}
        onConfirm={() => run("warn", "Warning sent to reviewer.")}
        onCancel={() => {
          setOpen(null);
          setWarnReason("");
        }}
      >
        <textarea
          value={warnReason}
          onChange={(e) => setWarnReason(e.target.value)}
          placeholder="Reason (optional)…"
          rows={4}
          className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white resize-none"
        />
      </ConfirmModal>
    </AdminShell>
  );
}
