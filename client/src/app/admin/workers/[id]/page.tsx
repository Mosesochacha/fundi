"use client";

import { ExternalLink, Image as ImageIcon, Mail, Star, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  ConfirmModal,
  DetailCard,
  formatDate,
  InfoRow,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Badge, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminWorker,
} from "@/features/admin";

type ConfirmKind = "suspend" | "approve" | "reject" | "removePhoto" | null;

const JOB_HISTORY = [
  {
    id: "jh1",
    employer: "Acme Builders",
    type: "Pipe repair",
    date: "2026-06-10",
    status: "completed",
    rating: 5,
  },
  {
    id: "jh2",
    employer: "Grace Wanjiru",
    type: "Bathroom fitting",
    date: "2026-05-28",
    status: "completed",
    rating: 4,
  },
  {
    id: "jh3",
    employer: "Skyline Apartments",
    type: "Drainage install",
    date: "2026-05-14",
    status: "completed",
    rating: 5,
  },
  {
    id: "jh4",
    employer: "John Otieno",
    type: "Tap replacement",
    date: "2026-04-30",
    status: "cancelled",
    rating: 0,
  },
  {
    id: "jh5",
    employer: "Riverside Hotel",
    type: "Kitchen plumbing",
    date: "2026-04-18",
    status: "completed",
    rating: 5,
  },
  {
    id: "jh6",
    employer: "Mary Achieng",
    type: "Leak inspection",
    date: "2026-04-02",
    status: "active",
    rating: 0,
  },
];

const REVIEWS = [
  {
    id: "rv1",
    rating: 5,
    text: "Fast, professional and tidy. Fixed the leak in under an hour.",
  },
  {
    id: "rv2",
    rating: 4,
    text: "Good work overall, arrived a little late but communicated well.",
  },
  {
    id: "rv3",
    rating: 5,
    text: "Highly recommend. Honest pricing and great craftsmanship.",
  },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-star scale
          key={i}
          size={13}
          className={i < value ? "text-gold fill-gold" : "text-ink-4"}
        />
      ))}
    </span>
  );
}

export default function AdminWorkerDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { data: w, isLoading } = useAdminWorker(id);
  const { success } = useToastContext();
  const action = useAdminAction();

  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [reason, setReason] = useState("");

  if (isLoading) {
    return (
      <AdminShell>
        <div className="h-40 bg-white border border-border rounded-xl animate-pulse" />
      </AdminShell>
    );
  }

  if (!w) {
    return (
      <AdminShell>
        <AdminPageHeader
          title="Worker not found"
          subtitle="This worker may have been removed."
          backHref="/admin/workers"
          backLabel="Workers"
        />
      </AdminShell>
    );
  }

  const closeConfirm = () => {
    setConfirm(null);
    setReason("");
  };

  const runConfirm = async () => {
    if (confirm === "suspend") {
      await action.mutateAsync(adminEndpoints.suspendWorker(id, {}));
    } else if (confirm === "approve") {
      await action.mutateAsync(adminEndpoints.verifyWorker(id));
    } else if (confirm === "reject") {
      await action.mutateAsync(adminEndpoints.rejectWorker(id, reason));
    } else {
      // removePhoto: no live endpoint yet; client-only action.
      await action.mutateAsync(undefined);
    }
    if (confirm === "suspend") success("Worker suspended.");
    else if (confirm === "approve") success("Verification approved.");
    else if (confirm === "reject") success("Resubmission requested.");
    else if (confirm === "removePhoto") success("Photo removed.");
    closeConfirm();
  };

  const confirmCopy: Record<
    Exclude<ConfirmKind, null>,
    { title: string; message: string; label: string; destructive: boolean }
  > = {
    suspend: {
      title: "Suspend worker",
      message: `Suspend ${w.name}? They will be hidden from search and unable to accept new jobs.`,
      label: "Suspend",
      destructive: true,
    },
    approve: {
      title: "Approve verification",
      message: `Approve ${w.name}'s ID verification? Their profile will be marked as verified.`,
      label: "Approve verification",
      destructive: false,
    },
    reject: {
      title: "Reject — request resubmission",
      message:
        "Ask the worker to resubmit their ID documents. Provide a reason below.",
      label: "Request resubmission",
      destructive: true,
    },
    removePhoto: {
      title: "Remove photo",
      message: "Remove this portfolio photo? This cannot be undone.",
      label: "Remove",
      destructive: true,
    },
  };

  const c = confirm ? confirmCopy[confirm] : null;

  return (
    <AdminShell>
      <AdminPageHeader
        title="Worker detail"
        backHref="/admin/workers"
        backLabel="Workers"
      />

      {/* Identity header */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar
            initials={initialsOf(w.name)}
            size="xl"
            color={w.avatarColor ?? "gold"}
          />
          <div className="min-w-0">
            <h2 className="font-serif text-xl text-ink leading-tight truncate">
              {w.name}
            </h2>
            <p className="text-sm text-ink-3 truncate">
              {w.trade} · {w.location}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={w.status} />
              <StatusBadge status={w.verify} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={`/worker/${id}`}
            target="_blank"
            rel="noopener"
            className="no-underline"
          >
            <Button
              variant="outline"
              size="sm"
              icon={<ExternalLink size={14} />}
            >
              View public profile
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            icon={<Mail size={14} />}
            onClick={() => success("Email composer opened.")}
          >
            Send email
          </Button>
          <Button variant="red" size="sm" onClick={() => setConfirm("suspend")}>
            Suspend
          </Button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1.2fr_1fr] gap-4">
        {/* LEFT */}
        <div className="flex flex-col gap-4">
          <DetailCard title="About">
            <p className="text-sm text-ink-2 leading-relaxed">
              {w.about ?? "No description provided."}
            </p>
          </DetailCard>

          <DetailCard title="Services">
            <div className="flex flex-wrap gap-1.5">
              {w.services.length === 0 ? (
                <span className="text-sm text-ink-3">None listed.</span>
              ) : (
                w.services.map((s) => (
                  <Badge key={s} variant="gold">
                    {s}
                  </Badge>
                ))
              )}
            </div>
          </DetailCard>

          <DetailCard title="Portfolio">
            {w.portfolio.length === 0 ? (
              <p className="text-sm text-ink-3">No photos uploaded.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {w.portfolio.map((p) => (
                  <div
                    key={p}
                    className="relative aspect-square rounded-lg bg-cream-2 flex items-center justify-center text-ink-4"
                  >
                    <ImageIcon size={22} />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => setConfirm("removePhoto")}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 border border-border flex items-center justify-center text-ink-3 hover:text-red-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DetailCard>

          <DetailCard title="Experience">
            {w.experience.length === 0 ? (
              <p className="text-sm text-ink-3">None listed.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {w.experience.map((e) => (
                  <li
                    key={`${e.title}-${e.period}`}
                    className="relative pl-4 border-l-2 border-cream-2"
                  >
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gold" />
                    <p className="text-sm font-medium text-ink">{e.title}</p>
                    <p className="text-[12px] text-ink-3">
                      {e.org} · {e.period}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </DetailCard>

          <DetailCard title="Certifications">
            {w.certifications.length === 0 ? (
              <p className="text-sm text-ink-3">None listed.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-cream-2">
                {w.certifications.map((cert) => (
                  <li
                    key={`${cert.name}-${cert.year}`}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{cert.name}</p>
                      <p className="text-[12px] text-ink-3">{cert.issuer}</p>
                    </div>
                    <span className="text-sm text-ink-3 tabular-nums">
                      {cert.year}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DetailCard>
        </div>

        {/* MIDDLE */}
        <div className="flex flex-col gap-4">
          <DetailCard title="ID verification">
            <div className="grid grid-cols-2 gap-2">
              {(["ID document", "Selfie photo"] as const).map((label) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className="aspect-[4/3] rounded-lg bg-cream-2 flex items-center justify-center text-ink-4">
                    <ImageIcon size={22} />
                  </div>
                  <button
                    type="button"
                    onClick={() => success("Opening image…")}
                    className="text-[12px] text-gold-dark hover:underline text-left cursor-pointer"
                  >
                    {label} · View image
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-3">Name match check</span>
                {w.nameMatch ? (
                  <span className="text-sm font-medium text-green-700">
                    Match
                  </span>
                ) : (
                  <span className="text-sm font-medium text-red-600">
                    Mismatch
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-3">Current status</span>
                <StatusBadge status={w.verify} />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => setConfirm("approve")}
              >
                Approve verification
              </Button>
              <Button variant="red" onClick={() => setConfirm("reject")}>
                Reject — request resubmission
              </Button>
            </div>
          </DetailCard>

          <DetailCard title="Job history">
            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-2 text-[10px] uppercase tracking-wider text-ink-3">
                    <th className="text-left font-semibold py-2 px-4">
                      Employer
                    </th>
                    <th className="text-left font-semibold py-2 px-2">Type</th>
                    <th className="text-left font-semibold py-2 px-2">Date</th>
                    <th className="text-left font-semibold py-2 px-2">
                      Status
                    </th>
                    <th className="text-right font-semibold py-2 px-4">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {JOB_HISTORY.map((j) => (
                    <tr
                      key={j.id}
                      className="border-b border-cream-2 last:border-0"
                    >
                      <td className="py-2 px-4 text-ink-2">{j.employer}</td>
                      <td className="py-2 px-2 text-ink-3">{j.type}</td>
                      <td className="py-2 px-2 text-ink-3 whitespace-nowrap">
                        {formatDate(j.date)}
                      </td>
                      <td className="py-2 px-2">
                        <StatusBadge status={j.status} />
                      </td>
                      <td className="py-2 px-4 text-right text-ink-2 tabular-nums">
                        {j.rating > 0 ? j.rating.toFixed(1) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailCard>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">
          <DetailCard title="Stats">
            <div className="flex flex-col">
              <InfoRow label="Total jobs" value={w.jobs} />
              <InfoRow
                label="Avg rating"
                value={
                  <span className="inline-flex items-center gap-1">
                    {w.rating.toFixed(1)}
                    <Star size={13} className="text-gold fill-gold" />
                  </span>
                }
              />
              <InfoRow label="Response rate" value={`${w.responseRate}%`} />
              <InfoRow label="Profile views" value={w.profileViews} />
              <InfoRow label="Account age" value={formatDate(w.joined)} />
            </div>
          </DetailCard>

          <DetailCard
            title="Reviews received"
            action={
              <button
                type="button"
                onClick={() => success("Opening reviews…")}
                className="text-sm text-gold-dark hover:underline cursor-pointer"
              >
                View full list
              </button>
            }
          >
            <ul className="flex flex-col divide-y divide-cream-2">
              {REVIEWS.map((r) => (
                <li key={r.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Stars value={r.rating} />
                  <p className="mt-1 text-sm text-ink-2 leading-snug">
                    {r.text}
                  </p>
                </li>
              ))}
            </ul>
          </DetailCard>

          <DetailCard title="Reports">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0 bg-ink-4" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink truncate">
                  Late arrival dispute
                </p>
                <p className="text-[11px] text-ink-3">Filed by an employer</p>
              </div>
              <StatusBadge status="resolved" />
            </div>
          </DetailCard>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title={c?.title ?? ""}
        message={c?.message}
        confirmLabel={c?.label}
        destructive={c?.destructive ?? true}
        loading={action.isPending}
        confirmDisabled={confirm === "reject" && !reason.trim()}
        onConfirm={runConfirm}
        onCancel={closeConfirm}
      >
        {confirm === "reject" && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for resubmission (required)…"
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white resize-none"
          />
        )}
      </ConfirmModal>
    </AdminShell>
  );
}
