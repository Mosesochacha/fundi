"use client";

import { Ban, Eye, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  BulkActionsBar,
  type Column,
  ConfirmModal,
  DataTable,
  type FilterPill,
  formatDate,
  money,
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AccountStatus,
  type AdminEmployer,
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminEmployers,
} from "@/features/admin";

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Most hires", value: "hires" },
  { label: "Most spent", value: "spent" },
];

const statusPills: FilterPill[] = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

export default function AdminEmployersPage() {
  const router = useRouter();
  const { success } = useToastContext();
  const action = useAdminAction();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const [overrides, setOverrides] = useState<Record<string, AccountStatus>>({});

  const [confirm, setConfirm] = useState<null | {
    employer: AdminEmployer;
    next: AccountStatus;
  }>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset paging on filter change
  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  const { data, isLoading } = useAdminEmployers({ search, status, sort, page });

  const statusOf = (e: AdminEmployer): AccountStatus =>
    overrides[e.id] ?? e.status;

  const runSuspend = async (employer: AdminEmployer, next: AccountStatus) => {
    await action.mutateAsync(
      next === "suspended"
        ? adminEndpoints.suspendEmployer(employer.id)
        : adminEndpoints.unsuspendEmployer(employer.id),
    );
    setOverrides((m) => ({ ...m, [employer.id]: next }));
    success(
      next === "suspended"
        ? `${employer.name} suspended.`
        : `${employer.name} reinstated.`,
    );
    setConfirm(null);
  };

  const runBulkSuspend = async () => {
    await Promise.all(
      selected.map((id) =>
        action.mutateAsync(adminEndpoints.suspendEmployer(id)),
      ),
    );
    setOverrides((m) => {
      const next = { ...m };
      for (const id of selected) next[id] = "suspended";
      return next;
    });
    success(`Suspended ${selected.length} employer(s).`);
    setSelected([]);
    setBulkConfirm(false);
  };

  const columns: Column<AdminEmployer>[] = [
    {
      key: "employer",
      header: "Employer",
      render: (e) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar initials={initialsOf(e.name)} color="blue" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{e.name}</p>
            <p className="text-[11px] text-ink-3 truncate">{e.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (e) => <span className="text-sm text-ink-2">{e.location}</span>,
      hideOnMobile: true,
    },
    {
      key: "hires",
      header: "Total hires",
      align: "right",
      render: (e) => e.totalHires,
      hideOnMobile: true,
    },
    {
      key: "spent",
      header: "Total spent",
      align: "right",
      render: (e) => money(e.totalSpent, e.currency),
      hideOnMobile: true,
    },
    {
      key: "joined",
      header: "Joined",
      render: (e) => (
        <span className="text-sm text-ink-2">{formatDate(e.joined)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      render: (e) => <StatusBadge status={statusOf(e)} />,
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title="Employers"
        subtitle="Businesses and individuals hiring on Tesilix."
      />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name, email, location"
        pills={statusPills}
        activePill={status}
        onPill={setStatus}
        sort={sort}
        sortOptions={sortOptions}
        onSort={setSort}
      />

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(e) => e.id}
        loading={isLoading}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(e) => router.push(`/admin/employers/${e.id}`)}
        emptyMessage="No employers found."
        actions={(e) => {
          const active = statusOf(e) === "active";
          const suspended = statusOf(e) === "suspended";
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="outline"
                icon={<Eye size={14} />}
                onClick={() => router.push(`/admin/employers/${e.id}`)}
              >
                View
              </Button>
              {active && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  icon={<Ban size={14} />}
                  onClick={() => setConfirm({ employer: e, next: "suspended" })}
                >
                  Suspend
                </Button>
              )}
              {suspended && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50"
                  icon={<ShieldCheck size={14} />}
                  onClick={() => setConfirm({ employer: e, next: "active" })}
                >
                  Unsuspend
                </Button>
              )}
            </div>
          );
        }}
        pagination={{
          page,
          totalPages: data?.totalPages ?? 1,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />

      <BulkActionsBar
        count={selected.length}
        onClear={() => setSelected([])}
        noun="employer"
      >
        <Button size="sm" variant="red" onClick={() => setBulkConfirm(true)}>
          Suspend selected
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-white border-white/30 hover:bg-white/10"
          onClick={() => {
            success(`Exported ${selected.length} employer(s).`);
            setSelected([]);
          }}
        >
          Export selected
        </Button>
      </BulkActionsBar>

      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.next === "suspended"
            ? "Suspend employer"
            : "Reinstate employer"
        }
        message={
          confirm?.next === "suspended"
            ? `Suspend ${confirm?.employer.name}? They will lose access until reinstated.`
            : `Reinstate ${confirm?.employer.name}? They will regain full access.`
        }
        destructive={confirm?.next === "suspended"}
        confirmLabel={confirm?.next === "suspended" ? "Suspend" : "Reinstate"}
        loading={action.isPending}
        onConfirm={() => confirm && runSuspend(confirm.employer, confirm.next)}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmModal
        open={bulkConfirm}
        title="Suspend selected employers"
        message={`Suspend ${selected.length} employer(s)? They will lose access until reinstated.`}
        confirmLabel="Suspend"
        loading={action.isPending}
        onConfirm={runBulkSuspend}
        onCancel={() => setBulkConfirm(false)}
      />
    </AdminShell>
  );
}
