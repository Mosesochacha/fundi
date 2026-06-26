import {
  Ban,
  CheckCircle2,
  Circle,
  Clock,
  EyeOff,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui";

type Variant = "gold" | "green" | "blue" | "red" | "gray" | "navy" | "orange";

interface Spec {
  label: string;
  variant: Variant;
  icon?: ReactNode;
}

const MAP: Record<string, Spec> = {
  active: { label: "Active", variant: "green" },
  suspended: { label: "Suspended", variant: "red" },
  pending: { label: "Pending", variant: "gold" },
  banned: { label: "Banned", variant: "red", icon: <Ban size={12} /> },
  "pending verification": { label: "Pending verification", variant: "gold" },
  verified: {
    label: "Verified",
    variant: "green",
    icon: <ShieldCheck size={12} />,
  },
  unverified: { label: "Unverified", variant: "gray" },
  rejected: { label: "Rejected", variant: "red", icon: <XCircle size={12} /> },
  open: { label: "Open", variant: "red" },
  in_review: { label: "In review", variant: "orange" },
  "in review": { label: "In review", variant: "orange" },
  resolved: {
    label: "Resolved",
    variant: "green",
    icon: <CheckCircle2 size={12} />,
  },
  completed: {
    label: "Completed",
    variant: "green",
    icon: <CheckCircle2 size={12} />,
  },
  cancelled: { label: "Cancelled", variant: "gray" },
  refunded: { label: "Refunded", variant: "orange" },
  failed: { label: "Failed", variant: "red", icon: <XCircle size={12} /> },
  processing: {
    label: "Processing",
    variant: "blue",
    icon: <Clock size={12} />,
  },
  paid: { label: "Paid", variant: "green", icon: <CheckCircle2 size={12} /> },
  visible: { label: "Visible", variant: "green" },
  hidden: { label: "Hidden", variant: "gray", icon: <EyeOff size={12} /> },
  removed: { label: "Removed", variant: "red" },
  flagged: { label: "Flagged", variant: "red" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase();
  const spec: Spec = MAP[key] ?? {
    label: status,
    variant: "gray",
    icon: <Circle size={10} />,
  };
  return (
    <Badge variant={spec.variant} icon={spec.icon} className={className}>
      {spec.label}
    </Badge>
  );
}

export function SeverityDot({
  severity,
  className = "",
}: {
  severity: "high" | "medium" | "low";
  className?: string;
}) {
  const color =
    severity === "high"
      ? "bg-red-500"
      : severity === "medium"
        ? "bg-orange-400"
        : "bg-ink-4";
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${color} ${className}`}
      title={`${severity} severity`}
    />
  );
}
