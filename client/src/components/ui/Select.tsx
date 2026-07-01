import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "onChange" | "value" | "children"
  > {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  /** Extra classes for the <select> element (e.g. `rounded-full` in toolbars). */
  className?: string;
}

/**
 * Styled native <select> with a custom chevron — the app's single select
 * primitive so no raw, OS-styled dropdowns sit next to custom controls.
 * Matches the input system (cream fill, gold focus). Label is optional so it
 * can also nest inside a `Field` that already renders its own label.
 */
export function Select({
  value,
  onChange,
  options,
  label,
  id,
  className,
  ...props
}: SelectProps) {
  const control = (
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3"
      />
    </div>
  );

  if (!label) return control;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-ink-2 tracking-wide"
      >
        {label}
      </label>
      {control}
    </div>
  );
}
