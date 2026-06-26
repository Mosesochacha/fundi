import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "./Pagination";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Extra classes applied to both <th> and <td> (e.g. width hints). */
  className?: string;
  /** Hide below the lg breakpoint to keep narrow tables readable. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Far-right actions cell (always visible). */
  actions?: (row: T) => ReactNode;
  /** Enable the leading checkbox column. */
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

const headCls =
  "text-[10px] uppercase tracking-wider text-ink-3 font-semibold py-2.5 px-3 whitespace-nowrap";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  selectable,
  selected = [],
  onSelectedChange,
  onRowClick,
  loading,
  emptyMessage = "No results found.",
  pagination,
}: DataTableProps<T>) {
  const ids = rows.map(rowKey);
  const allSelected =
    ids.length > 0 && ids.every((id) => selected.includes(id));
  const someSelected = ids.some((id) => selected.includes(id));

  const toggleAll = () => {
    if (!onSelectedChange) return;
    onSelectedChange(allSelected ? [] : ids);
  };
  const toggleOne = (id: string) => {
    if (!onSelectedChange) return;
    onSelectedChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  };

  const colCount = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream/50">
              {selectable && (
                <th className={cn(headCls, "w-10 pl-4")}>
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    className="accent-gold w-4 h-4 align-middle cursor-pointer"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    headCls,
                    c.align === "right" ? "text-right" : "text-left",
                    c.hideOnMobile && "hidden lg:table-cell",
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
              {actions && (
                <th className={cn(headCls, "text-right pr-4")}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows
                  key={`sk-${i}`}
                  className="border-b border-cream-2"
                >
                  <td colSpan={colCount} className="px-3 py-3">
                    <div className="h-5 bg-cream-2 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-3 py-12 text-center text-ink-3"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = rowKey(row);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b border-cream-2 last:border-0 h-12 transition-colors hover:bg-cream",
                      selected.includes(id) && "bg-gold-light/40",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      // biome-ignore lint/a11y/useKeyWithClickEvents: wrapper only stops row-click propagation; the checkbox handles its own keyboard
                      <td
                        className="w-10 pl-4 px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          className="accent-gold w-4 h-4 align-middle cursor-pointer"
                          checked={selected.includes(id)}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 py-2 text-ink-2 align-middle",
                          c.align === "right"
                            ? "text-right tabular-nums"
                            : "text-left",
                          c.hideOnMobile && "hidden lg:table-cell",
                          c.className,
                        )}
                      >
                        {c.render(row)}
                      </td>
                    ))}
                    {actions && (
                      // biome-ignore lint/a11y/useKeyWithClickEvents: wrapper only stops row-click propagation; action buttons handle their own keyboard
                      <td
                        className="px-3 py-2 pr-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination && !loading && (
        <div className="border-t border-border">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
}
