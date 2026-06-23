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

export function Avatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <span className="el-avatar">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="el-stars" role="img" aria-label={`${value} out of 5`}>
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

export function StatusBadge({ status }: { status: EmployerJobStatus }) {
  return (
    <span className={`el-badge el-badge-${status}`}>{STATUS_LABEL[status]}</span>
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
    <div className="el-empty">
      <span className="el-empty-icon">{icon}</span>
      <div className="el-empty-title">{title}</div>
      <p className="el-empty-sub">{sub}</p>
      {cta}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="el-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: rows }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows
          <div key={i} className="el-skel" />
        ))}
      </div>
    </div>
  );
}
