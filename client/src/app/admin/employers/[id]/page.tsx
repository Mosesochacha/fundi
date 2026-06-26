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
  InfoRow,
  money,
  SeverityDot,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AccountStatus,
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminEmployer,
} from "@/features/admin";

interface HireRow {
  id: string;
  worker: string;
  jobType: string;
  date: string;
  status: AccountStatus | "completed" | "cancelled" | "active";
  amount: number;
}

const mockHires: HireRow[] = [
  {
    id: "h1",
    worker: "James Mwangi",
    jobType: "Plumbing repair",
    date: "2026-06-12",
    status: "completed",
    amount: 8500,
  },
  {
    id: "h2",
    worker: "Grace Achieng",
    jobType: "House cleaning",
    date: "2026-05-28",
    status: "completed",
    amount: 4200,
  },
  {
    id: "h3",
    worker: "Peter Otieno",
    jobType: "Electrical wiring",
    date: "2026-05-14",
    status: "completed",
    amount: 15600,
  },
  {
    id: "h4",
    worker: "Mary Wanjiru",
    jobType: "Painting",
    date: "2026-04-30",
    status: "cancelled",
    amount: 0,
  },
  {
    id: "h5",
    worker: "Daniel Kiptoo",
    jobType: "Carpentry",
    date: "2026-04-09",
    status: "completed",
    amount: 22000,
  },
  {
    id: "h6",
    worker: "Faith Nduta",
    jobType: "Garden landscaping",
    date: "2026-03-21",
    status: "active",
    amount: 11800,
  },
];

interface MockReview {
  id: string;
  worker: string;
  rating: number;
  text: string;
  date: string;
}

const mockReviews: MockReview[] = [
  {
    id: "r1",
    worker: "James Mwangi",
    rating: 5,
    text: "Excellent work, arrived on time and fixed everything cleanly. Would hire again.",
    date: "2026-06-13",
  },
  {
    id: "r2",
    worker: "Peter Otieno",
    rating: 4,
    text: "Solid electrical job. Slightly over the estimate but quality was high.",
    date: "2026-05-15",
  },
  {
    id: "r3",
    worker: "Daniel Kiptoo",
    rating: 5,
    text: "Beautiful carpentry — the cabinets look custom-made. Very professional.",
    date: "2026-04-11",
  },
];

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

      {/* Identity header */}
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
        {/* LEFT */}
        <div className="flex flex-col gap-4">
          <DetailCard title="Profile information">
            <InfoRow label="Location" value={employer.location} />
            <InfoRow label="Email" value={employer.email} />
            <InfoRow label="Phone" value={employer.phone} />
            <InfoRow
              label="About"
              value={employer.about ?? "No description provided."}
            />
            <InfoRow label="Member since" value={formatDate(employer.joined)} />
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
                  {mockHires.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 px-4 text-ink font-medium whitespace-nowrap">
                        {h.worker}
                      </td>
                      <td className="py-2.5 px-4 text-ink-2 whitespace-nowrap">
                        {h.jobType}
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
                </tbody>
              </table>
            </div>
          </DetailCard>

          <DetailCard title="Reviews given">
            <div className="flex flex-col gap-3">
              {mockReviews.map((r) => (
                <div
                  key={r.id}
                  className="border-b border-cream-2 last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">
                      {r.worker}
                    </span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-sm text-ink-2 mt-1">{r.text}</p>
                  <p className="text-[11px] text-ink-3 mt-1">
                    {formatDate(r.date)}
                  </p>
                </div>
              ))}
            </div>
          </DetailCard>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">
          <DetailCard title="Stats">
            <InfoRow label="Total hires" value={employer.totalHires} />
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
          </DetailCard>

          <DetailCard title="Reported by others">
            <p className="text-sm text-ink-3">None.</p>
          </DetailCard>

          <DetailCard title="Reports they filed">
            <div className="flex items-start gap-2.5">
              <SeverityDot severity="low" />
              <div className="min-w-0">
                <p className="text-sm text-ink">No-show on scheduled job</p>
                <div className="mt-1">
                  <StatusBadge status="resolved" />
                </div>
              </div>
            </div>
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
