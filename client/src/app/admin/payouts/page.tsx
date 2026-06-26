"use client";

import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  BulkActionsBar,
  type Column,
  ConfirmModal,
  DataTable,
  formatDate,
  money,
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin";
import { Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AdminPayout,
  adminEndpoints,
  type ListParams,
  useAdminAction,
  useAdminPayouts,
} from "@/features/admin";

const PILLS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
];

type Confirm =
  | { kind: "pay" | "reject"; payout: AdminPayout }
  | { kind: "process-all" }
  | { kind: "bulk-pay" };

export default function AdminPayoutsPage() {
  const { success } = useToastContext();
  const action = useAdminAction();

  const [search, setSearch] = useState("");
  const [pill, setPill] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, pill]);

  const params: ListParams = {
    search,
    status: pill || undefined,
    page,
  };
  const { data, isLoading } = useAdminPayouts(params);

  const columns: Column<AdminPayout>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (p) => (
        <span className="font-mono text-[12px] text-ink-2">{p.reference}</span>
      ),
    },
    {
      key: "worker",
      header: "Worker",
      render: (p) => <span className="font-semibold text-ink">{p.worker}</span>,
    },
    {
      key: "method",
      header: "Method",
      hideOnMobile: true,
      render: (p) => <span className="text-ink-2">{p.method}</span>,
    },
    {
      key: "destination",
      header: "Destination",
      hideOnMobile: true,
      render: (p) => (
        <span className="font-mono text-[12px] text-ink-3">
          {p.destination}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p) => money(p.amount, p.currency),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "requested",
      header: "Requested",
      hideOnMobile: true,
      render: (p) => formatDate(p.requested),
    },
  ];

  const confirmTitle = () => {
    if (!confirm) return "";
    switch (confirm.kind) {
      case "pay":
        return "Mark payout as paid";
      case "reject":
        return "Reject payout";
      case "process-all":
        return "Process all pending payouts";
      case "bulk-pay":
        return "Mark selected payouts paid";
    }
  };

  const confirmMessage = () => {
    if (!confirm) return "";
    switch (confirm.kind) {
      case "pay":
        return `Confirm that ${money(confirm.payout.amount, confirm.payout.currency)} has been sent to ${confirm.payout.worker}.`;
      case "reject":
        return `Reject the payout request from ${confirm.payout.worker}? The funds will be returned to their balance.`;
      case "process-all":
        return "Mark all pending payouts as paid. This cannot be undone.";
      case "bulk-pay":
        return `Mark ${selected.length} selected payout${selected.length === 1 ? "" : "s"} as paid.`;
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case "pay":
        await action.mutateAsync(
          adminEndpoints.markPayoutPaid(confirm.payout.id),
        );
        success("Payout marked as paid.");
        break;
      case "reject":
        await action.mutateAsync(
          adminEndpoints.rejectPayout(confirm.payout.id),
        );
        success("Payout rejected.");
        break;
      case "process-all":
        await action.mutateAsync(adminEndpoints.processAllPayouts());
        success("All pending payouts processed.");
        break;
      case "bulk-pay":
        await Promise.all(
          selected.map((id) =>
            action.mutateAsync(adminEndpoints.markPayoutPaid(id)),
          ),
        );
        success(
          `${selected.length} payout${selected.length === 1 ? "" : "s"} marked as paid.`,
        );
        setSelected([]);
        break;
    }
    setConfirm(null);
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="Payouts"
        subtitle="Withdrawals requested by workers."
        actions={
          <Button
            variant="gold"
            onClick={() => setConfirm({ kind: "process-all" })}
          >
            Process all pending
          </Button>
        }
      />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search reference, worker"
        pills={PILLS}
        activePill={pill}
        onPill={setPill}
      />

      <BulkActionsBar
        count={selected.length}
        onClear={() => setSelected([])}
        noun="payout"
      >
        <Button
          size="sm"
          variant="gold"
          onClick={() => setConfirm({ kind: "bulk-pay" })}
        >
          Mark selected paid
        </Button>
      </BulkActionsBar>

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(p) => p.id}
        loading={isLoading}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        emptyMessage="No payouts found."
        actions={(p) =>
          p.status === "pending" || p.status === "processing" ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-green-600 text-white border-green-600 hover:bg-green-700"
                onClick={() => setConfirm({ kind: "pay", payout: p })}
              >
                Mark paid
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setConfirm({ kind: "reject", payout: p })}
              >
                Reject
              </Button>
            </div>
          ) : (
            <span className="text-ink-4">—</span>
          )
        }
        pagination={{
          page,
          totalPages: data?.totalPages ?? 1,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />

      <ConfirmModal
        open={!!confirm}
        title={confirmTitle()}
        message={confirmMessage()}
        confirmLabel={confirm?.kind === "reject" ? "Reject" : "Mark paid"}
        destructive={confirm?.kind === "reject"}
        loading={action.isPending}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </AdminShell>
  );
}
