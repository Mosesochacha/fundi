import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}

/** Compact page list: Previous / 1 … 4 5 6 … N / Next */
function pageList(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1)
    return total !== undefined ? (
      <div className="flex items-center justify-between px-4 py-3 text-sm text-ink-3">
        <span>
          {total} result{total === 1 ? "" : "s"}
        </span>
      </div>
    ) : null;

  const btn =
    "h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md border text-sm transition-colors";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
      {total !== undefined ? (
        <span className="text-sm text-ink-3">{total} results</span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(
            btn,
            "border-border text-ink-2 hover:border-ink-3 disabled:opacity-40 disabled:pointer-events-none gap-1",
          )}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={15} /> Previous
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis gaps have no stable id
              key={`gap-${i}`}
              className="h-8 w-8 inline-flex items-center justify-center text-ink-3 text-sm"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={cn(
                btn,
                p === page
                  ? "border-gold bg-gold-light text-gold-dark font-semibold"
                  : "border-border text-ink-2 hover:border-ink-3",
              )}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={cn(
            btn,
            "border-border text-ink-2 hover:border-ink-3 disabled:opacity-40 disabled:pointer-events-none gap-1",
          )}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
