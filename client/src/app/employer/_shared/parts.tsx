import { Star } from "lucide-react";
import type { EmployerJobStatus } from "@/features/employer/jobs";

export const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

export const fmtMoney = (n: number) => n.toLocaleString("en-US");

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const EL_CARD =
  "bg-white border border-border rounded-xl overflow-hidden";
export const EL_ROW =
  "flex gap-3 px-4 py-3.5 border-b border-border last:border-b-0";
export const EL_ROW_BODY = "flex-1 min-w-0";
export const EL_ROW_TOP = "flex items-center justify-between gap-2";
export const EL_ROW_NAME = "text-sm font-semibold text-ink";
export const EL_ROW_META = "text-sm text-ink-3 mt-1";
export const EL_ROW_ACTIONS = "flex flex-wrap gap-2 mt-2.5";
export const EL_RATE = "text-sm font-medium text-gold-dark";

export const EL_BTN =
  "inline-flex items-center justify-center gap-1.5 font-medium text-sm px-3 py-1.5 rounded-lg border border-transparent cursor-pointer no-underline disabled:opacity-60 disabled:cursor-not-allowed";
export const EL_BTN_OUTLINE =
  "bg-white text-ink-2 border-border hover:border-gold hover:bg-gold-light hover:text-ink";
export const EL_BTN_GOLD =
  "bg-gold text-navy border-gold hover:bg-gold-dark hover:border-gold-dark";
export const EL_BTN_DANGER =
  "bg-white text-red-600 border-red-300 hover:bg-red-50";

export function Avatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <span className="w-10 h-10 rounded-full bg-gold-light border-[1.5px] border-gold/30 text-gold-dark text-sm font-semibold flex items-center justify-center shrink-0 overflow-hidden">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        // biome-ignore lint/performance/noImgElement: avatar URLs are arbitrary external hosts
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex gap-px text-gold"
      role="img"
      aria-label={`${value} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-star row
          key={i}
          size={12}
          fill={i < Math.round(value) ? "currentColor" : "none"}
          strokeWidth={i < Math.round(value) ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

const STATUS_LABEL: Record<EmployerJobStatus, string> = {
  pending: "Awaiting reply",
  accepted: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

const STATUS_STYLE: Record<EmployerJobStatus, string> = {
  pending: "bg-gold-light text-gold-dark",
  accepted: "bg-blue-50 text-blue-600",
  completed: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
  declined: "bg-red-50 text-red-600",
};

export function StatusBadge({ status }: { status: EmployerJobStatus }) {
  return (
    <span
      className={`text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyCard({
  icon,
  title,
  sub,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12 bg-white border border-border rounded-xl">
      <span className="text-ink-4 leading-none">{icon}</span>
      <div className="text-sm font-medium text-ink-2 mt-3">{title}</div>
      <p className="text-sm text-ink-3 mt-1 max-w-[280px] leading-relaxed">
        {sub}
      </p>
      {cta && <div className="mt-3.5">{cta}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={`${EL_CARD} p-4`}>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows
            key={i}
            className="h-[88px] bg-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
