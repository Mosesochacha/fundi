"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  label: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  loading = false,
  disabled = false,
  label,
}: ToggleSwitchProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " && !disabled && !loading) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || loading}
      onClick={() => !loading && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className="relative shrink-0 w-11 h-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded-full disabled:opacity-50"
    >
      <span
        className={cn(
          "block w-11 h-6 rounded-xl transition-colors duration-200",
          checked ? "bg-gold" : "bg-ink-4",
        )}
      />
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-200 flex items-center justify-center",
          checked ? "left-[22px]" : "left-0.5",
        )}
      >
        {loading && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              className="text-gold"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="12"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
