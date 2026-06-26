import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A titled white card for detail pages (lighter than the ui/Card header style). */
export function DetailCard({
  title,
  action,
  children,
  className,
  danger = false,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border",
        danger ? "border-red-200" : "border-border",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-cream-2">
          <h3
            className={cn(
              "text-sm font-semibold",
              danger ? "text-red-600" : "text-ink",
            )}
          >
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Label / value row for profile + account cards. */
export function InfoRow({
  label,
  value,
}: {
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-cream-2 last:border-0">
      <span className="text-sm text-ink-3 shrink-0">{label}</span>
      <span className="text-sm text-ink-2 text-right min-w-0 break-words">
        {value}
      </span>
    </div>
  );
}
