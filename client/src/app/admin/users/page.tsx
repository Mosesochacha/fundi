"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  BulkActionsBar,
  type Column,
  ConfirmModal,
  DataTable,
  formatDate,
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Badge, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AdminUser,
  adminEndpoints,
  initialsOf,
  type ListParams,
  useAdminAction,
  useAdminUsers,
} from "@/features/admin";

const PILLS = [
  { label: "All", value: "all" },
  { label: "Workers", value: "worker" },
  { label: "Employers", value: "employer" },
  { label: "Suspended", value: "suspended" },
  { label: "Unverified", value: "unverified" },
];

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Most jobs", value: "jobs" },
  { label: "Alphabetical", value: "alpha" },
];

/** Translate a filter pill into the role/status portion of ListParams. */
function pillToParams(pill: string): Pick<ListParams, "role" | "status"> {
  switch (pill) {
    case "worker":
      return { role: "worker" };
    case "employer":
      return { role: "employer" };
    case "suspended":
      return { status: "suspended" };
    case "unverified":
      return { status: "unverified" };
    default:
      return {};
  }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { success } = useToastContext();
  const action = useAdminAction();

  const [search, setSearch] = useState("");
  const [pill, setPill] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const [confirm, setConfirm] = useState<null | {
    kind: "bulk" | "suspend";
    user?: AdminUser;
  }>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberately reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, pill, sort]);

  const { data, isLoading } = useAdminUsers({
    search,
    sort,
    page,
    ...pillToParams(pill),
  });

  const inputCls =
    "h-9 px-3 rounded-lg text-sm border border-border bg-cream text-ink-2 outline-none focus:border-gold focus:bg-white cursor-pointer";

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            initials={initialsOf(u.name)}
            color={u.role === "worker" ? "gold" : "blue"}
          />
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate">{u.name}</p>
            <p className="text-[11px] text-ink-3 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <Badge variant={u.role === "worker" ? "gold" : "blue"}>
          {u.role === "worker" ? "Worker" : "Employer"}
        </Badge>
      ),
    },
    {
      key: "trade",
      header: "Trade / Location",
      hideOnMobile: true,
      render: (u) => (
        <div className="min-w-0">
          <p className="text-ink-2 truncate">{u.trade ?? "—"}</p>
          <p className="text-[11px] text-ink-3 truncate">{u.location}</p>
        </div>
      ),
    },
    {
      key: "jobs",
      header: "Jobs",
      align: "right",
      hideOnMobile: true,
      render: (u) => u.jobs,
    },
    {
      key: "joined",
      header: "Joined",
      hideOnMobile: true,
      render: (u) => formatDate(u.joined),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge status={u.status} />,
    },
  ];

  const runBulkSuspend = async () => {
    await Promise.all(
      selected.map((id) => action.mutateAsync(adminEndpoints.suspendUser(id))),
    );
    success(
      `${selected.length} user${selected.length === 1 ? "" : "s"} suspended.`,
    );
    setSelected([]);
    setConfirm(null);
  };

  const runSuspend = async (user: AdminUser) => {
    await action.mutateAsync(adminEndpoints.suspendUser(user.id));
    success("Account suspended.");
    setConfirm(null);
  };

  const runUnsuspend = async (user: AdminUser) => {
    await action.mutateAsync(adminEndpoints.unsuspendUser(user.id));
    success("Account reactivated.");
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="All users"
        subtitle="Every registered account across both roles."
        actions={
          <Button variant="outline" onClick={() => success("Export started.")}>
            Export
          </Button>
        }
      />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name, email, phone"
        pills={PILLS}
        activePill={pill}
        onPill={setPill}
        sort={sort}
        onSort={setSort}
        sortOptions={SORTS}
      >
        <input
          type="date"
          aria-label="Joined from"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className={inputCls}
        />
        <input
          type="date"
          aria-label="Joined to"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className={inputCls}
        />
      </SearchFilterBar>

      <BulkActionsBar
        count={selected.length}
        onClear={() => setSelected([])}
        noun="user"
      >
        <Button
          size="sm"
          variant="red"
          onClick={() => setConfirm({ kind: "bulk" })}
        >
          Suspend selected
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-white border-white/30 hover:bg-white/10"
          onClick={() => success("Export started.")}
        >
          Export selected
        </Button>
      </BulkActionsBar>

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
        emptyMessage="No users found."
        actions={(u) => (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/users/${u.id}`)}
            >
              View
            </Button>
            {u.status === "suspended" ? (
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => runUnsuspend(u)}
              >
                Unsuspend
              </Button>
            ) : (
              u.status === "active" && (
                <Button
                  size="sm"
                  variant="red"
                  onClick={() => setConfirm({ kind: "suspend", user: u })}
                >
                  Suspend
                </Button>
              )
            )}
          </>
        )}
        pagination={{
          page,
          totalPages: data?.totalPages ?? 1,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />

      <ConfirmModal
        open={confirm?.kind === "bulk"}
        title="Suspend selected users"
        message={`Suspend ${selected.length} selected account${
          selected.length === 1 ? "" : "s"
        }? They will lose access until reactivated.`}
        confirmLabel="Suspend"
        loading={action.isPending}
        onConfirm={runBulkSuspend}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmModal
        open={confirm?.kind === "suspend"}
        title="Suspend account"
        message={`Suspend ${confirm?.user?.name ?? "this user"}? They will lose access until reactivated.`}
        confirmLabel="Suspend"
        loading={action.isPending}
        onConfirm={() => confirm?.user && runSuspend(confirm.user)}
        onCancel={() => setConfirm(null)}
      />
    </AdminShell>
  );
}
