import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  danger?: boolean;
}

export default function SettingsSection({
  title,
  description,
  children,
  danger = false,
}: SettingsSectionProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border-[0.5px]",
        danger ? "border-red-200 bg-red-50/50" : "border-border bg-white",
      )}
    >
      {(title || description) && (
        <div className="px-5 pt-4 pb-2">
          {title && (
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-widest",
                danger ? "text-red-500" : "text-ink-3",
              )}
            >
              {title}
            </p>
          )}
          {description && (
            <p className="text-xs text-ink-3 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <div className="px-5 pb-1">{children}</div>
    </div>
  );
}
