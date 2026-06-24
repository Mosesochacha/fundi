import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({
  title,
  action,
  children,
  className,
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-border rounded-2xl overflow-hidden",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-cream-2">
          <span className="text-sm font-medium text-ink">{title}</span>
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </div>
  );
}
