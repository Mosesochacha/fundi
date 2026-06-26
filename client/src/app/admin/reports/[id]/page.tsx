"use client";

import { Image as ImageIcon } from "lucide-react";
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
  SeverityDot,
} from "@/components/admin";
import { Avatar, Badge, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  adminEndpoints,
  initialsOf,
  type ReportNote,
  type ReportSeverity,
  type ReportStatus,
  useAdminAction,
  useAdminReport,
} from "@/features/admin";
import { cn } from "@/lib/utils";

const SEVERITY_BADGE: Record<
  ReportSeverity,
  { variant: "red" | "orange" | "gray"; label: string }
> = {
  high: { variant: "red", label: "High severity" },
  medium: { variant: "orange", label: "Medium severity" },
  low: { variant: "gray", label: "Low severity" },
};

type ResolutionAction = {
  value: string;
  label: string;
  tone: "gray" | "gold" | "orange" | "redOutline" | "red";
};

const RESOLUTION_ACTIONS: ResolutionAction[] = [
  { value: "none", label: "No action taken", tone: "gray" },
  { value: "warning", label: "Warning issued", tone: "gold" },
  { value: "content_removed", label: "Content removed", tone: "orange" },
  {
    value: "suspend_7",
    label: "Account suspended 7 days",
    tone: "redOutline",
  },
  {
    value: "suspend_30",
    label: "Account suspended 30 days",
    tone: "redOutline",
  },
  {
    value: "ban",
    label: "Account banned permanently",
    tone: "red",
  },
];

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
];

/** Map the page's resolution-action value to the backend action string. */
const ACTION_TO_BACKEND: Record<string, string> = {
  none: "none",
  warning: "warning",
  content_removed: "content_removed",
  suspend_7: "suspended_7",
  suspend_30: "suspended_30",
  ban: "banned",
};

const toneClasses: Record<ResolutionAction["tone"], string> = {
  gray: "border-border text-ink-2",
  gold: "border-gold/40 text-gold-dark",
  orange: "border-orange-300 text-orange-600",
  redOutline: "border-red-300 text-red-600",
  red: "border-red-500 bg-red-50 text-red-700",
};

export default function AdminReportDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { data: r, isLoading } = useAdminReport(id);
  const { success } = useToastContext();
  const action = useAdminAction();

  const [notes, setNotes] = useState<ReportNote[] | null>(null);
  const [noteText, setNoteText] = useState("");

  const [status, setStatus] = useState<ReportStatus | null>(null);
  const [resolution, setResolution] = useState<string>("none");
  const [resolutionNote, setResolutionNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="h-40 bg-white border border-border rounded-xl animate-pulse" />
      </AdminShell>
    );
  }

  if (!r) {
    return (
      <AdminShell>
        <AdminPageHeader
          title="Report not found"
          subtitle="This report may have been removed."
          backHref="/admin/reports"
          backLabel="Reports"
        />
      </AdminShell>
    );
  }

  const effectiveNotes = notes ?? r.notes;
  const effectiveStatus = status ?? r.status;
  const sev = SEVERITY_BADGE[r.severity];
  const selectedAction =
    RESOLUTION_ACTIONS.find((a) => a.value === resolution) ??
    RESOLUTION_ACTIONS[0];

  const addNote = () => {
    const text = noteText.trim();
    if (!text) return;
    const next: ReportNote = {
      id: `local-${Date.now()}`,
      admin: "You",
      at: new Date().toISOString(),
      text,
    };
    setNotes([...effectiveNotes, next]);
    setNoteText("");
    success("Note added.");
    action.mutateAsync(adminEndpoints.addReportNote(id, text));
  };

  const submitResolution = async () => {
    await action.mutateAsync(
      adminEndpoints.resolveReport(id, {
        action: ACTION_TO_BACKEND[resolution] ?? resolution,
        resolution: resolutionNote,
        notifyReporter: notify,
        status: effectiveStatus,
      }),
    );
    setConfirmOpen(false);
    success("Resolution submitted.");
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="Report detail"
        backHref="/admin/reports"
        backLabel="Reports"
      />

      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={sev.variant}
            icon={<SeverityDot severity={r.severity} />}
          >
            {sev.label}
          </Badge>
          <h1 className="font-serif text-xl text-ink leading-tight">
            {r.type}
          </h1>
          <span className="text-sm text-ink-3">Filed {formatDate(r.date)}</span>
        </div>
        <div className="mt-2 flex flex-col gap-1 text-sm">
          <p className="text-ink-3">
            Reported by:{" "}
            <Link
              href={`/admin/users/${r.filedById}`}
              className="text-gold-dark no-underline hover:underline"
            >
              {r.filedBy}
            </Link>
          </p>
          <p className="text-ink-3">
            Report against:{" "}
            <Link
              href={`/admin/users/${r.reportedUserId}`}
              className="text-gold-dark no-underline hover:underline"
            >
              {r.reportedUser}
            </Link>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="Report details">
            <p className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">
              {r.description}
            </p>

            <h4 className="mt-4 mb-2 text-sm font-semibold text-ink">
              Evidence
            </h4>
            {r.evidence && r.evidence.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {r.evidence.map((e) => (
                  <div
                    key={e}
                    className="aspect-video rounded-lg bg-cream-2 border border-border flex items-center justify-center text-ink-4"
                  >
                    <ImageIcon size={22} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-3">No evidence attached</p>
            )}

            <h4 className="mt-4 mb-2 text-sm font-semibold text-ink">
              Related content
            </h4>
            <div className="rounded-lg bg-cream border border-border px-3 py-2.5 text-sm text-ink-2">
              {r.relatedContent ?? "—"}
            </div>
          </DetailCard>

          <DetailCard title="Investigation notes">
            <div className="flex flex-col gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add an internal note…"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white resize-none"
              />
              <div className="flex justify-end">
                <Button
                  variant="gold"
                  size="sm"
                  disabled={!noteText.trim()}
                  onClick={addNote}
                >
                  Add note
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {effectiveNotes.length === 0 ? (
                <p className="text-sm text-ink-3">No notes yet.</p>
              ) : (
                effectiveNotes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-lg border border-cream-2 bg-cream/50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {n.admin}
                      </span>
                      <span className="text-[11px] text-ink-3">
                        {formatDateTime(n.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-2">{n.text}</p>
                  </div>
                ))
              )}
            </div>
          </DetailCard>
        </div>

        <div className="flex flex-col gap-4">
          <DetailCard title="Reported user">
            <div className="flex items-center gap-3">
              <Avatar initials={initialsOf(r.reportedUser)} color="gold" />
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">
                  {r.reportedUser}
                </p>
                <Badge
                  variant={r.reportedUserRole === "worker" ? "gold" : "blue"}
                >
                  {r.reportedUserRole === "worker" ? "Worker" : "Employer"}
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-3">Account status</span>
                <Badge
                  variant={
                    r.reportedUserStatus === "active"
                      ? "green"
                      : r.reportedUserStatus === "pending"
                        ? "gold"
                        : "red"
                  }
                >
                  {r.reportedUserStatus}
                </Badge>
              </div>
              <p className="text-ink-3">
                Previous reports against them:{" "}
                <span className="font-semibold text-ink">
                  {r.reportedUserPriorReports}
                </span>
              </p>
            </div>
            <Link
              href={`/admin/users/${r.reportedUserId}`}
              className="mt-3 inline-block text-sm text-gold-dark no-underline hover:underline"
            >
              View full profile
            </Link>
          </DetailCard>

          <DetailCard title="Reporter">
            <div className="flex items-center gap-3">
              <Avatar initials={initialsOf(r.filedBy)} color="blue" />
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">{r.filedBy}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-3">
              Reports filed:{" "}
              <span className="font-semibold text-ink">
                {r.filedByReportsCount}
              </span>{" "}
              <span className="text-ink-4">(to detect spam)</span>
            </p>
            <Link
              href={`/admin/users/${r.filedById}`}
              className="mt-3 inline-block text-sm text-gold-dark no-underline hover:underline"
            >
              View full profile
            </Link>
          </DetailCard>

          <DetailCard title="Resolution">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-ink-3">Status</span>
                <select
                  value={effectiveStatus}
                  onChange={(e) => setStatus(e.target.value as ReportStatus)}
                  className="h-9 px-3 rounded-lg text-sm border border-border bg-cream text-ink-2 outline-none focus:border-gold focus:bg-white cursor-pointer"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-ink-3">Resolution action</span>
                <div className="flex flex-col gap-2">
                  {RESOLUTION_ACTIONS.map((a) => {
                    const selected = resolution === a.value;
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => setResolution(a.value)}
                        className={cn(
                          "w-full text-left text-sm font-medium px-3 py-2 rounded-lg border bg-white transition-colors cursor-pointer hover:border-ink-3",
                          toneClasses[a.tone],
                          selected && "ring-2 ring-gold ring-offset-1",
                        )}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-ink-3">
                  Resolution note (sent to reporter)
                </span>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain the outcome…"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white resize-none"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="accent-gold w-4 h-4"
                />
                Notify reporter of outcome
              </label>

              <Button variant="gold" onClick={() => setConfirmOpen(true)}>
                Submit resolution
              </Button>
            </div>
          </DetailCard>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Submit resolution"
        message={`Mark this report as "${
          STATUS_OPTIONS.find((o) => o.value === effectiveStatus)?.label ??
          effectiveStatus
        }" with action "${selectedAction.label}"${
          notify ? " and notify the reporter" : ""
        }?`}
        destructive={
          selectedAction.tone === "red" || selectedAction.tone === "redOutline"
        }
        confirmLabel="Submit resolution"
        loading={action.isPending}
        onConfirm={submitResolution}
        onCancel={() => setConfirmOpen(false)}
      />
    </AdminShell>
  );
}
