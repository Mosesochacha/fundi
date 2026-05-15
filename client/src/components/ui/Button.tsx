"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "coral";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-[#f97316] hover:bg-[#c2410c] text-white font-semibold [box-shadow:0_4px_14px_rgba(249,115,22,0.35)]",
  coral:
    "bg-[#E05A2B] hover:bg-[#bd4d26] text-white font-semibold [box-shadow:0_4px_14px_rgba(224,90,43,0.35)]",
  secondary:
    "border-[1.5px] border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium",
};

export default function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`h-[52px] px-5 rounded-[10px] text-[15px] font-dm-sans transition-all duration-200 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2 ${fullWidth ? "w-full" : ""} ${VARIANT[variant]} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
