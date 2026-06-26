"use client";

import { Ban, ShieldCheck, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  type Column,
  ConfirmModal,
  DataTable,
  formatDate,
  money,
  SearchFilterBar,
  StatusBadge,
} from "@/components/admin";
import { Avatar, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AdminWorker,
  adminEndpoints,
  initialsOf,
  useAdminAction,
  useAdminWorkers,
} from "@/features/admin";

const TRADES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Mason",
  "Painter",
  "Welder",
  "Mechanic",
  "Tiler",
  "Roofer",
  "Gardener",
  "Cleaner",
  "Tailor",
];

const TABS = [
  { label: "All", value: "" },
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "unverified" },
  { label: "Pending ID", value: "pending" },
  { label: "Suspended", value: "suspended" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Most jobs", value: "jobs" },
  { label: "Highest rated", value: "rating" },
  { label: "Pending first", value: "pending" },
];

type ConfirmState = {
  worker: AdminWorker;
  kind: "verify" | "suspend";
};

export default function AdminWorkersPage() {
  const router = useRouter();
  const { success } = useToastContext();
  const action = useAdminAction();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [trade, setTrade] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset paging on filter change
  useEffect(() => {
    setPage(1);
  }, [search, status, trade, sort]);

  const { data, isLoading } = useAdminWorkers({
    search,
    status,
    trade,
    sort,
    page,
  });

  const rows = data?.rows ?? [];
  const pendingCount = rows.filter((w) => w.verify === "pending").length;
  const showBanner = status !== "pending" && pendingCount > 0;

  const runConfirm = async () => {
    if (!confirm) return;
    await action.mutateAsync(
      confirm.kind === "verify"
        ? adminEndpoints.verifyWorker(confirm.worker.id)
        : adminEndpoints.suspendWorker(confirm.worker.id, {}),
    );
    success(
      confirm.kind === "verify" ? "Worker verified." : "Worker suspended.",
    );
    setConfirm(null);
  };

  const columns: Column<AdminWorker>[] = [
    {
      key: "name",
      header: "Worker",
      render: (w) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            initials={initialsOf(w.name)}
            size="sm"
            color={w.avatarColor ?? "gold"}
          />
          <span className="font-medium text-ink">{w.name}</span>
        </div>
      ),
    },
    { key: "trade", header: "Trade", render: (w) => w.trade },
    {
      key: "location",
      header: "Location",
      render: (w) => w.location,
      hideOnMobile: true,
    },
    {
      key: "jobs",
      header: "Jobs",
      align: "right",
      render: (w) => w.jobs,
      hideOnMobile: true,
    },
    {
      key: "rating",
      header: "Rating",
      render: (w) => (
        <span className="inline-flex items-center gap-1 tabular-nums">
          {w.rating.toFixed(1)}
          <Star size={13} className="text-gold fill-gold" />
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "dailyRate",
      header: "Daily rate",
      align: "right",
      render: (w) => money(w.dailyRate, w.currency),
      hideOnMobile: true,
    },
    {
      key: "verify",
      header: "Verified",
      render: (w) => <StatusBadge status={w.verify} />,
    },
    {
      key: "joined",
      header: "Joined",
      render: (w) => formatDate(w.joined),
      hideOnMobile: true,
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title="Workers"
        subtitle="Manage fundis and ID verification."
      />

      {showBanner && (
        <div className="bg-gold-light border border-gold/30 rounded-xl p-3 flex items-center justify-between mb-4">
          <span className="text-sm text-ink-2">
            {pendingCount} workers awaiting ID verification
          </span>
          <Button variant="gold" size="sm" onClick={() => setStatus("pending")}>
            Review now
          </Button>
        </div>
      )}

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name, trade, location"
        pills={TABS}
        activePill={status}
        onPill={setStatus}
        sort={sort}
        onSort={setSort}
        sortOptions={SORT_OPTIONS}
      >
        <select
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          className="h-9 px-3 rounded-lg text-sm border border-border bg-cream text-ink-2 outline-none focus:border-gold focus:bg-white cursor-pointer"
        >
          <option value="">All trades</option>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </SearchFilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(w) => w.id}
        loading={isLoading}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(w) => router.push(`/admin/workers/${w.id}`)}
        emptyMessage="No workers found."
        actions={(w) => (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/workers/${w.id}`)}
            >
              View
            </Button>
            {w.verify === "pending" && (
              <Button
                size="sm"
                variant="gold"
                onClick={() => setConfirm({ worker: w, kind: "verify" })}
              >
                Verify
              </Button>
            )}
            {w.status === "active" && (
              <Button
                size="sm"
                variant="red"
                onClick={() => setConfirm({ worker: w, kind: "suspend" })}
              >
                Suspend
              </Button>
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
        open={!!confirm}
        title={confirm?.kind === "verify" ? "Verify worker" : "Suspend worker"}
        message={
          confirm?.kind === "verify" ? (
            <>
              Approve {confirm.worker.name}&apos;s ID verification? Their
              profile will be marked as verified and shown to employers.
            </>
          ) : (
            <>
              Suspend {confirm?.worker.name}? They will be hidden from search
              and unable to accept new jobs.
            </>
          )
        }
        confirmLabel={confirm?.kind === "verify" ? "Verify worker" : "Suspend"}
        destructive={confirm?.kind === "suspend"}
        loading={action.isPending}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      >
        {confirm?.kind === "verify" ? (
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <ShieldCheck size={13} /> ID document and selfie reviewed.
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <Ban size={13} /> This action can be reversed later.
          </p>
        )}
      </ConfirmModal>
    </AdminShell>
  );
}
