import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned action buttons. */
  actions?: ReactNode;
  /** Optional back link shown above the title (detail pages). */
  backHref?: string;
  backLabel?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Back",
}: AdminPageHeaderProps) {
  return (
    <div className="mb-5">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-ink-3 no-underline hover:text-ink mb-2"
        >
          <ChevronLeft size={15} /> {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl text-ink leading-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-ink-3">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
