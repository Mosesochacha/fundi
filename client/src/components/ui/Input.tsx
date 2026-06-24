import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink-2 tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-lg text-sm font-sans",
          "border border-border bg-cream text-ink",
          "placeholder:text-ink-3 outline-none",
          "focus:border-gold focus:bg-white",
          "transition-all duration-150",
          error && "border-red-400 bg-red-50",
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-sm text-ink-3">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
