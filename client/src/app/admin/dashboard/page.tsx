"use client";

import {
  Banknote,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Flag,
  Mail,
  Send,
  ShieldCheck,
  Star,
  UserPlus,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import {
  AdminShell,
  ConfirmModal,
  SeverityDot,
  StatusBadge,
} from "@/components/admin";
import { Badge } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type ActivityType,
  type DashboardStat,
  type HealthState,
  useAdminAction,
  useAdminDashboard,
} from "@/features/admin";
import { cn } from "@/lib/utils";

const accentBar: Record<DashboardStat["accent"], string> = {
  gold: "bg-gold",
  blue: "bg-blue-500",
  green: "bg-green-400",
  red: "bg-red-500",
  purple: "bg-purple-500",
};

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 relative overflow-hidden">
      <div
        className={cn("absolute top-0 inset-x-0 h-0.5", accentBar[stat.accent])}
      />
      <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1.5">
        {stat.label}
      </p>
      <p
        className={cn(
          "font-serif text-[26px] leading-none mb-1",
          stat.accent === "gold" ? "text-gold-dark" : "text-ink",
        )}
      >
        {stat.number}
      </p>
      <p className="text-[11px] text-ink-3">{stat.sub}</p>
      {stat.trend && (
        <span
          className={cn(
            "inline-flex items-center gap-1 mt-2 text-[11px] px-2 py-0.5 rounded-full",
            stat.trendUp
              ? "text-green-700 bg-green-50"
              : "text-red-700 bg-red-50",
          )}
        >
          {stat.trend}
        </span>
      )}
    </div>
  );
}

const activityIcon: Record<
  ActivityType,
  { icon: ReactNode; bg: string; fg: string }
> = {
  user_registered: {
    icon: <UserPlus size={15} />,
    bg: "bg-blue-50",
    fg: "text-blue-600",
  },
  report_filed: {
    icon: <Flag size={15} />,
    bg: "bg-red-50",
    fg: "text-red-600",
  },
  worker_verified: {
    icon: <CheckCircle2 size={15} />,
    bg: "bg-green-50",
    fg: "text-green-600",
  },
  review_flagged: {
    icon: <Star size={15} />,
    bg: "bg-gold-light",
    fg: "text-gold-dark",
  },
  account_suspended: {
    icon: <UserX size={15} />,
    bg: "bg-red-50",
    fg: "text-red-600",
  },
  job_completed: {
    icon: <Briefcase size={15} />,
    bg: "bg-green-50",
    fg: "text-green-600",
  },
  payment_received: {
    icon: <CreditCard size={15} />,
    bg: "bg-purple-50",
    fg: "text-purple-600",
  },
};

const healthDot: Record<
  HealthState,
  { dot: string; label: string; cls: string }
> = {
  operational: {
    dot: "bg-green-500",
    label: "Operational",
    cls: "text-green-700",
  },
  degraded: { dot: "bg-yellow-400", label: "Degraded", cls: "text-yellow-700" },
  down: { dot: "bg-red-500", label: "Down", cls: "text-red-700" },
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();
  const { success } = useToastContext();
  const blast = useAdminAction();

  const [blastOpen, setBlastOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const sendBlast = async () => {
    await blast.mutateAsync({ subject, body });
    setBlastOpen(false);
    setSubject("");
    setBody("");
    success("Email blast queued for delivery.");
  };

  return (
    <AdminShell>
      <div className="mb-5">
        <h1 className="font-serif text-2xl text-ink leading-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          Platform overview and everything that needs your attention.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton cards
                key={`s-${i}`}
                className="h-[116px] bg-white border border-border rounded-xl animate-pulse"
              />
            ))
          : data?.stats.map((s) => <StatCard key={s.key} stat={s} />)}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Left */}
        <div className="flex flex-col gap-4">
          {/* Activity feed */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-2">
              <h2 className="text-sm font-semibold text-ink">
                Recent activity
              </h2>
              <Link
                href="/admin/reports"
                className="text-sm text-gold-dark no-underline hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-cream-2 max-h-[420px] overflow-y-auto">
              {(data?.activity ?? []).map((a) => {
                const ic = activityIcon[a.type];
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <span
                      className={cn(
                        "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                        ic.bg,
                        ic.fg,
                      )}
                    >
                      {ic.icon}
                    </span>
                    <span className="flex-1 text-sm text-ink-2">{a.text}</span>
                    <span className="text-[11px] text-ink-3 shrink-0">
                      {a.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Open reports */}
          <div className="bg-white border border-border rounded-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-cream-2">
              <h2 className="text-sm font-semibold text-ink">Open reports</h2>
              <Link
                href="/admin/reports"
                className="text-sm text-gold-dark no-underline hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-cream-2">
              {(data?.reports ?? []).length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink-3 text-center">
                  No open reports. 🎉
                </p>
              ) : (
                data?.reports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/reports/${r.id}`}
                    className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-cream"
                  >
                    <SeverityDot severity={r.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{r.title}</p>
                      <p className="text-[11px] text-ink-3">
                        by {r.reporter} · {r.time}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon={<ShieldCheck size={18} />}
              label="Verify workers"
              count={data?.quick.pendingVerification}
              href="/admin/workers"
              tone="green"
            />
            <QuickAction
              icon={<Flag size={18} />}
              label="Open reports"
              count={data?.quick.openReports}
              href="/admin/reports"
              tone="red"
            />
            <QuickAction
              icon={<Banknote size={18} />}
              label="Pending payouts"
              count={data?.quick.pendingPayouts}
              href="/admin/payouts"
              tone="gold"
            />
            <button
              type="button"
              onClick={() => setBlastOpen(true)}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-border bg-white text-left hover:border-ink-3 transition-colors cursor-pointer"
            >
              <span className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Mail size={18} />
              </span>
              <span className="text-sm font-medium text-ink">
                Send email blast
              </span>
            </button>
          </div>

          {/* New registrations */}
          <div className="bg-white border border-border rounded-xl">
            <div className="px-4 py-3 border-b border-cream-2">
              <h2 className="text-sm font-semibold text-ink">
                New registrations
              </h2>
            </div>
            <div className="divide-y divide-cream-2">
              {data?.newUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 no-underline hover:bg-cream"
                >
                  <span
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-full text-[11px] font-semibold flex items-center justify-center",
                      u.role === "worker"
                        ? "bg-gold-light text-gold-dark"
                        : "bg-blue-100 text-blue-800",
                    )}
                  >
                    {u.initials}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{u.name}</p>
                    <p className="text-[11px] text-ink-3 truncate">{u.meta}</p>
                  </div>
                  <Badge variant={u.role === "worker" ? "gold" : "blue"}>
                    {u.role === "worker" ? "Worker" : "Employer"}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Platform health */}
          <div className="bg-white border border-border rounded-xl">
            <div className="px-4 py-3 border-b border-cream-2">
              <h2 className="text-sm font-semibold text-ink">
                Platform health
              </h2>
            </div>
            <div className="divide-y divide-cream-2">
              {data?.health.map((h) => {
                const s = healthDot[h.state];
                return (
                  <div
                    key={h.key}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-sm text-ink-2">{h.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-medium",
                        s.cls,
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Email blast modal */}
      <ConfirmModal
        open={blastOpen}
        title="Send email blast"
        message="Compose a message to send to all users."
        destructive={false}
        confirmLabel="Send blast"
        loading={blast.isPending}
        confirmDisabled={!subject.trim() || !body.trim()}
        onConfirm={sendBlast}
        onCancel={() => setBlastOpen(false)}
      >
        <div className="flex flex-col gap-3">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message…"
            rows={5}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white resize-none"
          />
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <Send size={12} /> This is a mock — no emails are actually sent.
          </p>
        </div>
      </ConfirmModal>
    </AdminShell>
  );
}

function QuickAction({
  icon,
  label,
  count,
  href,
  tone,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  href: string;
  tone: "green" | "red" | "gold";
}) {
  const toneCls = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    gold: "bg-gold-light text-gold-dark",
  }[tone];
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-border bg-white no-underline hover:border-ink-3 transition-colors"
    >
      <span
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          toneCls,
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-ink">
        {label}
        {count !== undefined && count > 0 && (
          <span className="ml-1.5 text-ink-3">({count})</span>
        )}
      </span>
    </Link>
  );
}
