"use client";

import { Flag, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  type Column,
  ConfirmModal,
  DataTable,
  formatDate,
  SearchFilterBar,
  truncate,
} from "@/components/admin";
import { Badge, Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AdminReview,
  adminEndpoints,
  useAdminAction,
  useAdminReviews,
} from "@/features/admin";
import { cn } from "@/lib/utils";

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Lowest rated", value: "lowest" },
  { label: "Most reported", value: "reported" },
];

/** Gold filled stars out of 5 with grey remainder. */
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-star scale
          key={i}
          size={size}
          className={cn(
            i < Math.round(rating)
              ? "fill-gold text-gold"
              : "fill-cream-2 text-cream-2",
          )}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { success } = useToastContext();
  const action = useAdminAction();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [flagged, setFlagged] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<AdminReview | null>(null);

  // Reset to page one whenever the result set changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberately reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, sort, rating, flagged]);

  const { data, isLoading } = useAdminReviews({
    search,
    sort,
    rating,
    flagged,
    page,
  });

  const inputCls =
    "h-9 px-3 rounded-lg text-sm border border-border bg-cream text-ink-2 outline-none focus:border-gold focus:bg-white cursor-pointer";

  const runRemove = async () => {
    if (!confirm) return;
    await action.mutateAsync(adminEndpoints.removeReview(confirm.id));
    success("Review removed.");
    setConfirm(null);
  };

  const columns: Column<AdminReview>[] = [
    {
      key: "worker",
      header: "Worker reviewed",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{r.worker}</p>
          <p className="text-[11px] text-ink-3 truncate">{r.workerTrade}</p>
        </div>
      ),
    },
    {
      key: "reviewer",
      header: "Reviewer",
      render: (r) => <span className="text-ink-2">{r.reviewer}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      render: (r) => <Stars rating={r.rating} />,
    },
    {
      key: "text",
      header: "Review text",
      hideOnMobile: true,
      render: (r) => <span className="text-ink-2">{truncate(r.text, 60)}</span>,
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      render: (r) => formatDate(r.date),
    },
    {
      key: "flagged",
      header: "Flagged",
      render: (r) =>
        r.flagged ? (
          <Badge variant="red" icon={<Flag size={11} />}>
            Flagged
          </Badge>
        ) : (
          <span className="text-ink-3">—</span>
        ),
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title="Reviews"
        subtitle="Moderate worker reviews across the platform."
      />

      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search reviewer or worker name"
        sort={sort}
        onSort={setSort}
        sortOptions={SORTS}
      >
        <select
          aria-label="Filter by rating"
          value={rating ?? ""}
          onChange={(e) =>
            setRating(e.target.value ? Number(e.target.value) : undefined)
          }
          className={inputCls}
        >
          <option value="">All ratings</option>
          <option value="5">5 ★</option>
          <option value="4">4 ★</option>
          <option value="3">3 ★</option>
          <option value="2">2 ★</option>
          <option value="1">1 ★</option>
        </select>
        <button
          type="button"
          onClick={() => setFlagged((f) => (f ? undefined : true))}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer",
            flagged
              ? "bg-red-600 text-white border-red-600"
              : "bg-cream border-border text-ink-2 hover:border-ink-3",
          )}
        >
          <Flag size={14} />
          Flagged only
        </button>
      </SearchFilterBar>

      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(r) => router.push(`/admin/reviews/${r.id}`)}
        emptyMessage="No reviews found."
        actions={(r) => (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/reviews/${r.id}`)}
            >
              View full
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setConfirm(r)}
            >
              Remove
            </Button>
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
        title="Remove review"
        message={
          confirm
            ? `Remove the review by ${confirm.reviewer} of ${confirm.worker}? This cannot be undone.`
            : undefined
        }
        confirmLabel="Remove review"
        loading={action.isPending}
        onConfirm={runRemove}
        onCancel={() => setConfirm(null)}
      />
    </AdminShell>
  );
}
