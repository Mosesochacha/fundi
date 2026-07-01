import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "outline" | "red" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  gold: "bg-gold text-navy border-gold hover:bg-gold-dark hover:border-gold-dark",
  outline: "bg-transparent border-border text-ink hover:border-ink-3",
  red: "bg-transparent border-red-300 text-red-600 hover:bg-red-50",
  ghost: "bg-transparent border-transparent text-ink-3 hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm gap-1",
  md: "px-4 py-2 text-sm gap-1.5",
  lg: "px-6 py-3 text-base gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "outline",
  size = "md",
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium font-sans",
        "border cursor-pointer transition-all duration-150",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
