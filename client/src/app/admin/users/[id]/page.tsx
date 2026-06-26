"use client";

import { Star } from "lucide-react";
import { useParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  type Column,
  ConfirmModal,
  DataTable,
  DetailCard,
  formatDate,
  InfoRow,
  money,
  SeverityDot,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Badge, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AdminMutateReq,
  type AdminUser,
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminUser,
} from "@/features/admin";

interface TimelineEvent {
  id: string;
  text: string;
  when: string;
  dot: string;
}

const TIMELINE: TimelineEvent[] = [
  {
    id: "t1",
    text: "Logged in from Nairobi, KE",
    when: "2 hours ago",
    dot: "bg-blue-500",
  },
  {
    id: "t2",
    text: "Completed a job — Kitchen plumbing",
    when: "Yesterday",
    dot: "bg-green-500",
  },
  {
    id: "t3",
    text: "Received a 5-star review",
    when: "2 days ago",
    dot: "bg-gold",
  },
  {
    id: "t4",
    text: "Sent 3 messages to an employer",
    when: "3 days ago",
    dot: "bg-purple-500",
  },
  {
    id: "t5",
    text: "Updated profile photo",
    when: "5 days ago",
    dot: "bg-blue-500",
  },
  {
    id: "t6",
    text: "Logged in from Mombasa, KE",
    when: "1 week ago",
    dot: "bg-blue-500",
  },
  {
    id: "t7",
    text: "Withdrew a payout request",
    when: "2 weeks ago",
    dot: "bg-red-500",
  },
  { id: "t8", text: "Account created", when: "Joined", dot: "bg-ink-3" },
];

interface JobRow {
  id: string;
  title: string;
  date: string;
  status: "completed" | "active" | "cancelled" | "pending";
  amount: number;
}

const JOBS: JobRow[] = [
  {
    id: "j1",
    title: "Kitchen plumbing repair",
    date: "2026-06-18",
    status: "completed",
    amount: 12500,
  },
  {
    id: "j2",
    title: "Bathroom tiling",
    date: "2026-06-10",
    status: "completed",
    amount: 28000,
  },
  {
    id: "j3",
    title: "Office electrical wiring",
    date: "2026-05-29",
    status: "active",
    amount: 45000,
  },
  {
    id: "j4",
    title: "Garden landscaping",
    date: "2026-05-14",
    status: "cancelled",
    amount: 18000,
  },
  {
    id: "j5",
    title: "Roof leak inspection",
    date: "2026-04-30",
    status: "completed",
    amount: 6000,
  },
];

interface ReportRow {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  date: string;
  status: "open" | "in_review" | "resolved";
}

const REPORTS_AGAINST: ReportRow[] = [
  {
    id: "r1",
    severity: "medium",
    title: "Inappropriate review content",
    date: "2026-06-02",
    status: "resolved",
  },
];

const REPORTS_FILED: ReportRow[] = [
  {
    id: "r2",
    severity: "low",
    title: "Payment dispute with employer",
    date: "2026-05-20",
    status: "open",
  },
];

type DangerAction = {
  key: string;
  label: string;
  description: string;
  title: string;
  message: string;
  toast: string;
};

const DANGER_ACTIONS: DangerAction[] = [
  {
    key: "suspend30",
    label: "Suspend (30 days)",
    description: "Temporarily block access for one month.",
    title: "Suspend for 30 days",
    message:
      "Block this account for 30 days? Access is restored automatically afterwards.",
    toast: "Account suspended for 30 days.",
  },
  {
    key: "suspendPerm",
    label: "Suspend (permanent)",
    description: "Block access indefinitely until manually lifted.",
    title: "Suspend permanently",
    message:
      "Block this account indefinitely? It stays suspended until you lift it.",
    toast: "Account suspended permanently.",
  },
  {
    key: "ban",
    label: "Ban (cannot re-register)",
    description: "Permanently ban the user and block re-registration.",
    title: "Ban account",
    message: "Ban this user permanently? They will not be able to re-register.",
    toast: "Account banned.",
  },
  {
    key: "delete",
    label: "Delete account + all data",
    description: "Erase the account and every related record. Irreversible.",
    title: "Delete account",
    message:
      "Delete this account and all associated data? This cannot be undone.",
    toast: "Account and all data deleted.",
  },
];

const jobColumns: Column<JobRow>[] = [
  { key: "title", header: "Job", render: (j) => j.title },
  {
    key: "date",
    header: "Date",
    hideOnMobile: true,
    render: (j) => formatDate(j.date),
  },
  {
    key: "status",
    header: "Status",
    render: (j) => <StatusBadge status={j.status} />,
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (j) => money(j.amount),
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed five-star row
          key={`star-${i}`}
          size={14}
          className={
            i < Math.round(rating) ? "text-gold fill-gold" : "text-ink-4"
          }
        />
      ))}
    </span>
  );
}

function ReportList({ rows }: { rows: ReportRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-3">None.</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2.5">
          <SeverityDot severity={r.severity} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-2 truncate">{r.title}</p>
            <p className="text-[11px] text-ink-3">{formatDate(r.date)}</p>
          </div>
          <StatusBadge status={r.status} />
        </div>
      ))}
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { success } = useToastContext();
  const action = useAdminAction();

  const { data, isLoading } = useAdminUser(id);

  const [confirm, setConfirm] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="h-8 w-40 bg-cream-2 rounded animate-pulse mb-5" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          <div className="h-96 bg-white border border-border rounded-xl animate-pulse" />
          <div className="h-96 bg-white border border-border rounded-xl animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell>
        <AdminPageHeader
          title="User not found"
          backHref="/admin/users"
          backLabel="All users"
        />
        <DetailCard>
          <p className="text-sm text-ink-3">
            We couldn&apos;t find a user with that id. It may have been deleted.
          </p>
        </DetailCard>
      </AdminShell>
    );
  }

  const u: AdminUser = data;
  const isWorker = u.role === "worker";

  const run = async (req: AdminMutateReq, toast: string) => {
    await action.mutateAsync(req);
    success(toast);
    setConfirm(null);
  };

  const descriptorFor = (key: string): AdminMutateReq => {
    switch (key) {
      case "suspend30":
        return adminEndpoints.suspendUser(u.id, { days: 30 });
      case "suspendPerm":
        return adminEndpoints.suspendUser(u.id);
      case "ban":
        return adminEndpoints.banUser(u.id);
      case "delete":
        return adminEndpoints.deleteUser(u.id);
      default:
        return adminEndpoints.suspendUser(u.id);
    }
  };

  const headerConfirm: Record<
    string,
    { title: string; message: string; toast: string }
  > = {
    suspend: {
      title: "Suspend account",
      message: `Suspend ${u.name}? They will lose access until reactivated.`,
      toast: "Account suspended.",
    },
    ban: {
      title: "Ban permanently",
      message: `Ban ${u.name} permanently? They will not be able to re-register.`,
      toast: "Account banned.",
    },
  };

  const activeDanger = DANGER_ACTIONS.find((d) => d.key === confirm);
  const activeHeader = confirm ? headerConfirm[confirm] : undefined;

  const yesNo = (v: boolean) => (v ? "Yes" : "No");

  return (
    <AdminShell>
      <AdminPageHeader
        backHref="/admin/users"
        backLabel="All users"
        title={
          <span className="flex items-center gap-3">
            <Avatar
              initials={initialsOf(u.name)}
              size="xl"
              color={isWorker ? "gold" : "blue"}
            />
            <span className="min-w-0">
              <span className="block truncate">{u.name}</span>
              <span className="block text-sm font-sans text-ink-3 truncate">
                {u.email} · {u.phone}
              </span>
              <span className="mt-1 flex items-center gap-2 text-sm font-sans">
                <Badge variant={isWorker ? "gold" : "blue"}>
                  {isWorker ? "Worker" : "Employer"}
                </Badge>
                <StatusBadge status={u.status} />
                <span className="text-ink-3">
                  Joined {formatDate(u.joined)}
                </span>
              </span>
            </span>
          </span>
        }
        actions={
          <>
            {u.status === "active" && (
              <Button variant="red" onClick={() => setConfirm("suspend")}>
                Suspend account
              </Button>
            )}
            {u.status === "suspended" && (
              <>
                <Button
                  variant="outline"
                  className="text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() =>
                    run(
                      adminEndpoints.unsuspendUser(u.id),
                      "Account reactivated.",
                    )
                  }
                >
                  Unsuspend
                </Button>
                <Button variant="red" onClick={() => setConfirm("ban")}>
                  Ban permanently
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => success("Email sent.")}>
              Send email
            </Button>
            <Button
              variant="outline"
              onClick={() => success("Export started.")}
            >
              Export data
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="Profile information">
            <InfoRow label="Location" value={u.location} />
            {isWorker && <InfoRow label="Trade" value={u.trade ?? "—"} />}
            <InfoRow label="About" value={u.about ?? "—"} />
            {isWorker && (
              <InfoRow
                label="Daily rate"
                value={
                  u.dailyRate !== undefined
                    ? money(u.dailyRate, u.currency)
                    : "—"
                }
              />
            )}
            <InfoRow label="Last active" value={u.lastActive} />
            <InfoRow label="Total logins" value={u.totalLogins} />
            <InfoRow label="Device" value={u.device} />
          </DetailCard>

          <DetailCard title="Activity timeline">
            <div className="flex flex-col gap-3.5">
              {TIMELINE.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${ev.dot}`}
                  />
                  <div className="flex-1 flex items-baseline justify-between gap-3">
                    <span className="text-sm text-ink-2">{ev.text}</span>
                    <span className="text-[11px] text-ink-3 shrink-0">
                      {ev.when}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title={isWorker ? "Jobs done" : "Jobs posted"}>
            <DataTable
              columns={jobColumns}
              rows={JOBS}
              rowKey={(j) => j.id}
              emptyMessage="No jobs yet."
            />
          </DetailCard>
        </div>

        <div className="flex flex-col gap-4">
          <DetailCard title="Account status">
            <div className="mb-2">
              <StatusBadge status={u.status} />
            </div>
            <InfoRow label="Created" value={formatDate(u.joined)} />
            <InfoRow label="Email verified" value={yesNo(u.emailVerified)} />
            <InfoRow label="Phone verified" value={yesNo(u.phoneVerified)} />
            <InfoRow
              label="Google connected"
              value={yesNo(u.googleConnected)}
            />
            <InfoRow
              label="Profile complete"
              value={yesNo(u.profileComplete)}
            />
          </DetailCard>

          <DetailCard title="Reviews">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-ink-3">Average rating</span>
              <span className="flex items-center gap-2 text-sm text-ink-2">
                <Stars rating={4.7} />
                4.7
              </span>
            </div>
            <InfoRow label="Reviews received" value={32} />
            <InfoRow label="Reviews given" value={8} />
            <button
              type="button"
              onClick={() => success("Opening review history…")}
              className="inline-block mt-2 text-sm text-gold-dark no-underline hover:underline cursor-pointer"
            >
              View full review history
            </button>
          </DetailCard>

          <DetailCard title="Reports">
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
              Against this user
            </p>
            <ReportList rows={REPORTS_AGAINST} />
            <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mt-4 mb-2">
              Filed by this user
            </p>
            <ReportList rows={REPORTS_FILED} />
          </DetailCard>

          <DetailCard title="Danger zone" danger>
            <div className="flex flex-col gap-3">
              {DANGER_ACTIONS.map((d) => (
                <DangerRow
                  key={d.key}
                  label={d.label}
                  description={d.description}
                  onClick={() => setConfirm(d.key)}
                />
              ))}
            </div>
          </DetailCard>
        </div>
      </div>

      <ConfirmModal
        open={!!activeHeader}
        title={activeHeader?.title ?? ""}
        message={activeHeader?.message}
        confirmLabel="Confirm"
        loading={action.isPending}
        onConfirm={() =>
          confirm &&
          activeHeader &&
          run(descriptorFor(confirm), activeHeader.toast)
        }
        onCancel={() => setConfirm(null)}
      />

      <ConfirmModal
        open={!!activeDanger}
        title={activeDanger?.title ?? ""}
        message={activeDanger?.message}
        confirmLabel="Confirm"
        loading={action.isPending}
        onConfirm={() =>
          activeDanger &&
          run(descriptorFor(activeDanger.key), activeDanger.toast)
        }
        onCancel={() => setConfirm(null)}
      />
    </AdminShell>
  );
}

function DangerRow({
  label,
  description,
  onClick,
}: {
  label: string;
  description: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      variant="red"
      onClick={onClick}
      className="w-full flex-col items-start gap-0.5 text-left"
    >
      <span className="font-semibold">{label}</span>
      <span className="text-[11px] font-normal text-red-500">
        {description}
      </span>
    </Button>
  );
}
