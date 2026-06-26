"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  type Column,
  DataTable,
  formatDate,
  SearchFilterBar,
  SeverityDot,
  StatusBadge,
} from "@/components/admin";
import { Button } from "@/components/ui";
import { type AdminReport, useAdminReports } from "@/features/admin";

const PILLS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In review", value: "in_review" },
  { label: "Resolved", value: "resolved" },
];

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Severity (high first)", value: "severity" },
  { label: "Oldest", value: "oldest" },
];

/** Translate a filter pill into the status portion of ListParams. */
function pillToStatus(pill: string): string {
  switch (pill) {
    case "open":
      return "open";
    case "in_review":
      return "in_review";
    case "resolved":
      return "resolved";
    default:
      return "";
  }
}

export default function AdminReportsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [pill, setPill] = useState("all");
  const [severity, setSeverity] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberately reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, pill, severity, sort]);

  const { data, isLoading } = useAdminReports({
    search,
    status: pillToStatus(pill),
    severity,
    sort,
    page,
  });

  const inputCls =
    "h-9 px-3 rounded-lg text-sm border border-border bg-cream text-ink-2 outline-none focus:border-gold focus:bg-white cursor-pointer";

  const columns: Column<AdminReport>[] = [
    {
      key: "severity",
      header: "",
      render: (r) => <SeverityDot severity={r.severity} />,
    },
    {
      key: "type",
      header: "Report type",
      render: (r) => <span className="font-semibold text-ink">{r.type}</span>,
    },
    {
      key: "reportedUser",
      header: "Reported user",
      render: (r) => <span className="text-ink-2">{r.reportedUser}</span>,
    },
    {
      key: "filedBy",
      header: "Filed by",
      hideOnMobile: true,
      render: (r) => <span className="text-ink-2">{r.filedBy}</span>,
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      render: (r) => formatDate(r.date),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title="Reports"
        subtitle="User-submitted reports needing moderation."
      />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search report type, reported user"
        pills={PILLS}
        activePill={pill}
        onPill={setPill}
        sort={sort}
        onSort={setSort}
        sortOptions={SORTS}
      >
        <select
          aria-label="Severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className={inputCls}
        >
          <option value="">All severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </SearchFilterBar>

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        onRowClick={(r) => router.push(`/admin/reports/${r.id}`)}
        emptyMessage="No reports found."
        actions={(r) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/admin/reports/${r.id}`)}
          >
            Review
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
