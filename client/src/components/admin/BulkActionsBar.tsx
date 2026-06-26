import { X } from "lucide-react";
import type { ReactNode } from "react";

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  /** Right-aligned action buttons. */
  children: ReactNode;
  noun?: string;
}

/** Sticky bar shown above a table when rows are selected. */
export function BulkActionsBar({
  count,
  onClear,
  children,
  noun = "item",
}: BulkActionsBarProps) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 mb-3 px-3 py-2 rounded-xl border border-navy/15 bg-navy text-white flex-wrap">
      <div className="flex items-center gap-2 text-sm font-medium">
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
        {count} {noun}
        {count === 1 ? "" : "s"} selected
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}
