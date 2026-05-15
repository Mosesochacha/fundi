import type { ReactNode } from "react";

interface SettingsRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  danger?: boolean;
  last?: boolean;
}

export default function SettingsRow({ label, description, children, danger = false, last = false }: SettingsRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-4 ${!last ? "border-b border-gray-100" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold leading-tight ${danger ? "text-red-600" : "text-gray-900"}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
