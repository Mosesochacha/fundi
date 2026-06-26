"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  type Column,
  DataTable,
  formatDate,
  money,
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin";
import { Button } from "@/components/ui";
import { type AdminJob, type ListParams, useAdminJobs } from "@/features/admin";

const PILLS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Pending", value: "pending" },
];

const TRADES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mason",
  "Welder",
  "Mechanic",
  "Cleaner",
  "Gardener",
  "Tiler",
];

/** Translate a filter pill into the status portion of ListParams. */
function pillToStatus(pill: string): ListParams["status"] {
  return pill === "all" ? undefined : pill;
}

export default function AdminJobsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [pill, setPill] = useState("all");
  const [trade, setTrade] = useState("");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberately reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, pill, trade]);

  const { data, isLoading } = useAdminJobs({
    search,
    status: pillToStatus(pill),
    trade: trade || undefined,
    page,
  });

  const inputCls =
    "h-9 px-3 rounded-lg text-sm border border-border bg-cream text-ink-2 outline-none focus:border-gold focus:bg-white cursor-pointer";

  const columns: Column<AdminJob>[] = [
    {
      key: "title",
      header: "Job title",
      render: (j) => <span className="font-semibold text-ink">{j.title}</span>,
    },
    {
      key: "worker",
      header: "Worker",
      render: (j) => <span className="text-ink-2">{j.worker}</span>,
    },
    {
      key: "employer",
      header: "Employer",
      render: (j) => <span className="text-ink-2">{j.employer}</span>,
    },
    {
      key: "trade",
      header: "Trade",
      render: (j) => <span className="text-ink-2">{j.trade}</span>,
    },
    {
      key: "location",
      header: "Location",
      hideOnMobile: true,
      render: (j) => <span className="text-ink-2">{j.location}</span>,
    },
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
      key: "rate",
      header: "Rate",
      align: "right",
      render: (j) => money(j.rate, j.currency),
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title="Jobs"
        subtitle="Every job request and booking on the platform."
      />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search job title, worker, employer"
        pills={PILLS}
        activePill={pill}
        onPill={setPill}
      >
        <select
          aria-label="Filter by trade"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          className={inputCls}
        >
          <option value="">All trades</option>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Scheduled from"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className={inputCls}
        />
        <input
          type="date"
          aria-label="Scheduled to"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className={inputCls}
        />
      </SearchFilterBar>

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(j) => j.id}
        loading={isLoading}
        onRowClick={(j) => router.push(`/admin/jobs/${j.id}`)}
        emptyMessage="No jobs found."
        actions={(j) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/jobs/${j.id}`)}
          >
            View details
          </Button>
        )}
        pagination={{
          page,
          totalPages: data?.totalPages ?? 1,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />
    </AdminShell>
  );
}
