import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  value: string;
  onChange: (code: string) => void;
  label?: string;
}

/**
 * Styled native <select> for picking a currency. Matches the app's input
 * system (cream fill, gold focus). Used in settings, onboarding and the
 * browse / search filter toolbars.
 */
export function CurrencySelect({
  value,
  onChange,
  label,
  id,
  className,
  ...props
}: CurrencySelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink-2 tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none cursor-pointer font-sans text-sm text-ink",
            "border border-border rounded-lg bg-cream",
            "pl-3 pr-9 py-2.5 outline-none",
            "transition-[border-color,background-color] duration-150",
            "focus:border-gold focus:bg-white",
            className,
          )}
          {...props}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} ({c.symbol}) — {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
        />
      </div>
    </div>
  );
}
