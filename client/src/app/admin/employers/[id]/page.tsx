"use client";

import { Ban, Mail, Star } from "lucide-react";
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
  SeverityDot,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AccountStatus,
  type AdminCompactReport,
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminEmployer,
} from "@/features/admin";

const yesNo = (value?: boolean | null) => (value ? "Yes" : "No");
const optionalDate = (value?: string | null) =>
  value ? formatDateTime(value) : "—";
const deviceLabel = (value?: string | null) => {
  if (!value) return "—";
  if (value.length <= 90) return value;
  return `${value.slice(0, 87)}...`;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-star scale
          key={i}
          size={13}
          className={
            i < Math.round(rating)
              ? "fill-gold text-gold"
              : "fill-cream-2 text-cream-2"
          }
        />
      ))}
    </span>
  );
}

function ReportList({ rows }: { rows?: AdminCompactReport[] }) {
  if (!rows?.length) return <p className="text-sm text-ink-3">None.</p>;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.id} className="flex items-start gap-2.5">
          <SeverityDot severity={r.severity} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink truncate">{r.title}</p>
            <p className="text-[11px] text-ink-3">{formatDate(r.date)}</p>
          </div>
          <StatusBadge status={r.status} />
        </div>
      ))}
    </div>
  );
}

export default function AdminEmployerDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { success } = useToastContext();
  const action = useAdminAction();

  const { data: employer, isLoading } = useAdminEmployer(id);

  const [override, setOverride] = useState<AccountStatus | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="h-32 bg-white border border-border rounded-xl animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          <div className="h-96 bg-white border border-border rounded-xl animate-pulse" />
          <div className="h-96 bg-white border border-border rounded-xl animate-pulse" />
        </div>
      </AdminShell>
    );
  }

  if (!employer) {
    return (
      <AdminShell>
        <AdminPageHeader
          title="Employer not found"
          subtitle="This account may have been removed."
          backHref="/admin/employers"
          backLabel="Employers"
        />
        <div className="bg-white border border-border rounded-xl p-10 text-center text-sm text-ink-3">
          We couldn’t find an employer with that ID.
        </div>
      </AdminShell>
    );
  }

  const status = override ?? employer.status;

  const suspend = async () => {
    await action.mutateAsync(adminEndpoints.suspendEmployer(employer.id));
    setOverride("suspended");
    success(`${employer.name} suspended.`);
    setConfirm(false);
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="Employer detail"
        backHref="/admin/employers"
        backLabel="Employers"
      />

      <div className="bg-white border border-border rounded-xl p-4 mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar initials={initialsOf(employer.name)} color="blue" size="xl" />
          <div className="min-w-0">
            <h2 className="font-serif text-xl text-ink leading-tight">
              {employer.name}
            </h2>
            <p className="text-sm text-ink-3 truncate">{employer.email}</p>
            <p className="text-sm text-ink-3 truncate">
              {employer.phone} · {employer.location}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={status} />
              <span className="text-[11px] text-ink-3">
                Joined {formatDate(employer.joined)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            icon={<Mail size={15} />}
            onClick={() =>
              success(`Email composer opened for ${employer.name}.`)
            }
          >
            Send email
          </Button>
          {status !== "suspended" && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              icon={<Ban size={15} />}
              onClick={() => setConfirm(true)}
            >
              Suspend
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="Profile information">
            <InfoRow
              label="Full name"
              value={employer.profile?.fullName ?? employer.name}
            />
            <InfoRow
              label="Username"
              value={
                employer.profile?.username
                  ? `@${employer.profile.username}`
                  : "—"
              }
            />
            <InfoRow
              label="Profession"
              value={employer.profile?.profession ?? "—"}
            />
            <InfoRow
              label="Location"
              value={employer.profile?.location ?? employer.location}
            />
            <InfoRow label="Country" value={employer.profile?.country ?? "—"} />
            <InfoRow
              label="Timezone"
              value={employer.profile?.timezone ?? "—"}
            />
            <InfoRow label="Email" value={employer.email} />
            <InfoRow label="Phone" value={employer.phone} />
            <InfoRow label="Tagline" value={employer.profile?.tagline ?? "—"} />
            <InfoRow
              label="About"
              value={
                employer.profile?.bio ??
                employer.about ??
                "No description provided."
              }
            />
            <InfoRow
              label="Service areas"
              value={
                employer.profile?.serviceAreas?.length
                  ? employer.profile.serviceAreas.join(", ")
                  : "—"
              }
            />
            <InfoRow label="Member since" value={formatDate(employer.joined)} />
          </DetailCard>

          <DetailCard title="Recent login activity">
            <div className="overflow-x-auto -mx-4 -mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-ink-3">
                    <th className="text-left font-semibold py-2 px-4">Time</th>
                    <th className="text-left font-semibold py-2 px-4">
                      Status
                    </th>
                    <th className="text-left font-semibold py-2 px-4">IP</th>
                    <th className="text-left font-semibold py-2 px-4">
                      Device
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-2">
                  {(employer.recentLogins ?? []).map((login) => (
                    <tr key={login.id}>
                      <td className="py-2.5 px-4 text-ink-2 whitespace-nowrap">
                        {formatDateTime(login.createdAt)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={
                            login.status === "success"
                              ? "inline-flex rounded-[20px] bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700"
                              : "inline-flex rounded-[20px] bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"
                          }
                        >
                          {login.status === "success" ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-ink-2 whitespace-nowrap">
                        {login.ipAddress ?? "—"}
                      </td>
                      <td className="py-2.5 px-4 text-ink-2 min-w-[260px]">
                        {deviceLabel(login.userAgent)}
                      </td>
                    </tr>
                  ))}
                  {(employer.recentLogins ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 px-4 text-center text-ink-3"
                      >
                        No login records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DetailCard>

          <DetailCard title="Hiring history">
            <div className="overflow-x-auto -mx-4 -mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-ink-3">
                    <th className="text-left font-semibold py-2 px-4">
                      Worker hired
                    </th>
                    <th className="text-left font-semibold py-2 px-4">
                      Job type
                    </th>
                    <th className="text-left font-semibold py-2 px-4">Date</th>
                    <th className="text-left font-semibold py-2 px-4">
                      Status
                    </th>
                    <th className="text-right font-semibold py-2 px-4">
                      Amount paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-2">
                  {(employer.hires ?? []).map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 px-4 text-ink font-medium whitespace-nowrap">
                        {h.counterparty}
                      </td>
                      <td className="py-2.5 px-4 text-ink-2 whitespace-nowrap">
                        {h.title}
                      </td>
                      <td className="py-2.5 px-4 text-ink-2 whitespace-nowrap">
                        {formatDate(h.date)}
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="py-2.5 px-4 text-right text-ink-2 tabular-nums whitespace-nowrap">
                        {money(h.amount, employer.currency)}
                      </td>
                    </tr>
                  ))}
                  {(employer.hires ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 px-4 text-center text-ink-3"
                      >
                        No hires yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DetailCard>

          <DetailCard title="Reviews given">
            <div className="flex flex-col gap-3">
              {(employer.reviewsGiven ?? []).length === 0 ? (
                <p className="text-sm text-ink-3">No reviews given yet.</p>
              ) : (
                employer.reviewsGiven?.map((r) => (
                  <div
                    key={r.id}
                    className="border-b border-cream-2 last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">
                        {r.person}
                      </span>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-sm text-ink-2 mt-1">{r.text}</p>
                    <p className="text-[11px] text-ink-3 mt-1">
                      {formatDate(r.date)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DetailCard>
        </div>

        <div className="flex flex-col gap-4">
          <DetailCard title="Stats">
            <InfoRow label="Total hires" value={employer.totalHires} />
            <InfoRow
              label="Job requests"
              value={employer.jobStats?.totalRequests ?? employer.jobs}
            />
            <InfoRow
              label="Active jobs"
              value={employer.jobStats?.active ?? 0}
            />
            <InfoRow
              label="Pending jobs"
              value={employer.jobStats?.pending ?? 0}
            />
            <InfoRow
              label="Requests in 30 days"
              value={employer.jobStats?.createdLast30Days ?? 0}
            />
            <InfoRow
              label="Total spent"
              value={money(employer.totalSpent, employer.currency)}
            />
            <InfoRow
              label="Avg rating given"
              value={
                <span className="inline-flex items-center gap-1">
                  {employer.avgRatingGiven.toFixed(1)}
                  <Star size={13} className="fill-gold text-gold" />
                </span>
              }
            />
            <InfoRow
              label="Profile views"
              value={
                employer.activityStats?.profileViews ??
                employer.profile?.views ??
                0
              }
            />
            <InfoRow label="Posts" value={employer.activityStats?.posts ?? 0} />
            <InfoRow
              label="Followers"
              value={employer.activityStats?.followers ?? 0}
            />
          </DetailCard>

          <DetailCard title="Account status">
            <InfoRow
              label="Email verified"
              value={yesNo(
                employer.account?.emailVerified ?? employer.emailVerified,
              )}
            />
            <InfoRow
              label="Phone verified"
              value={yesNo(
                employer.account?.phoneVerified ?? employer.phoneVerified,
              )}
            />
            <InfoRow
              label="Profile complete"
              value={yesNo(
                employer.account?.profileComplete ?? employer.profileComplete,
              )}
            />
            <InfoRow
              label="Onboarded"
              value={yesNo(employer.account?.onboarded)}
            />
            <InfoRow
              label="Terms accepted"
              value={yesNo(employer.account?.termsAccepted)}
            />
            <InfoRow
              label="Last login"
              value={optionalDate(employer.account?.lastLoginAt)}
            />
            <InfoRow
              label="Updated"
              value={optionalDate(employer.account?.updatedAt)}
            />
            <InfoRow
              label="Suspension reason"
              value={employer.account?.suspensionReason ?? "—"}
            />
          </DetailCard>

          <DetailCard title="Activity summary">
            <InfoRow
              label="Total login attempts"
              value={
                employer.activityStats?.totalLogins ?? employer.totalLogins
              }
            />
            <InfoRow
              label="Successful logins"
              value={employer.activityStats?.successfulLogins ?? 0}
            />
            <InfoRow
              label="Failed logins"
              value={employer.activityStats?.failedLogins ?? 0}
            />
            <InfoRow
              label="Last login IP"
              value={employer.activityStats?.lastLoginIp ?? "—"}
            />
            <InfoRow
              label="Last device"
              value={deviceLabel(employer.activityStats?.lastLoginDevice)}
            />
          </DetailCard>

          <DetailCard title="Reported by others">
            <ReportList rows={employer.reportsAgainst} />
          </DetailCard>

          <DetailCard title="Reports they filed">
            <ReportList rows={employer.reportsFiled} />
          </DetailCard>
        </div>
      </div>

      <ConfirmModal
        open={confirm}
        title="Suspend employer"
        message={`Suspend ${employer.name}? They will lose access until reinstated.`}
        confirmLabel="Suspend"
        loading={action.isPending}
        onConfirm={suspend}
        onCancel={() => setConfirm(false)}
      />
    </AdminShell>
  );
}
