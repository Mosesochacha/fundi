import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "gold"
  | "green"
  | "blue"
  | "red"
  | "gray"
  | "navy"
  | "orange";

const variants: Record<BadgeVariant, string> = {
  gold: "bg-gold-light border-gold/30 text-gold-dark",
  green: "bg-green-50 border-green-200 text-green-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  red: "bg-red-50 border-red-200 text-red-700",
  gray: "bg-cream-2 border-border text-ink-3",
  navy: "bg-navy/10 border-navy/20 text-navy",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
};

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "gray",
  icon,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5",
        "rounded-full text-sm font-medium border",
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
