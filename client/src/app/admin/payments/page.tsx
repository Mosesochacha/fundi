"use client";

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
  truncate,
} from "@/components/admin";
import {
  type AdminPayment,
  type ListParams,
  useAdminPayments,
} from "@/features/admin";
import { cn } from "@/lib/utils";

const PILLS = [
  { label: "All", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Refunded", value: "refunded" },
  { label: "Failed", value: "failed" },
];

const STATS: { label: string; value: string; accent: string }[] = [
  { label: "Total processed", value: money(4_280_000), accent: "bg-gold" },
  { label: "Platform fees", value: money(214_000), accent: "bg-green-400" },
  { label: "Refunded", value: money(86_500), accent: "bg-red-500" },
  { label: "Pending", value: money(132_000), accent: "bg-blue-500" },
];

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [pill, setPill] = useState("");
  const [page, setPage] = useState(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, pill]);

  const params: ListParams = {
    search,
    status: pill || undefined,
    page,
  };
  const { data, isLoading } = useAdminPayments(params);

  const columns: Column<AdminPayment>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (p) => (
        <span className="font-mono text-[12px] text-ink-2">{p.reference}</span>
      ),
    },
    {
      key: "employer",
      header: "Employer",
      hideOnMobile: true,
      render: (p) => <span className="text-ink-2">{p.employer}</span>,
    },
    {
      key: "worker",
      header: "Worker",
      hideOnMobile: true,
      render: (p) => <span className="text-ink-2">{p.worker}</span>,
    },
    {
      key: "job",
      header: "Job",
      hideOnMobile: true,
      render: (p) => (
        <span className="text-ink-3" title={p.job}>
          {truncate(p.job, 32)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      hideOnMobile: true,
      render: (p) => <span className="text-ink-2">{p.method}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p) => money(p.amount, p.currency),
    },
    {
      key: "fee",
      header: "Fee",
      align: "right",
      hideOnMobile: true,
      render: (p) => (
        <span className="text-ink-3">{money(p.fee, p.currency)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      render: (p) => formatDate(p.date),
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title="Payments"
        subtitle="All transactions processed on the platform."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-border rounded-xl p-4 relative overflow-hidden"
          >
            <div className={cn("absolute top-0 inset-x-0 h-0.5", s.accent)} />
            <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1.5">
              {s.label}
            </p>
            <p className="font-serif text-[22px] leading-none text-ink">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search reference, employer, worker, job"
        pills={PILLS}
        activePill={pill}
        onPill={setPill}
      />

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(p) => p.id}
        loading={isLoading}
        emptyMessage="No payments found."
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
