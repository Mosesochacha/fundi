import type { ReactNode } from "react";

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  danger?: boolean;
}

export default function SettingsSection({ title, description, children, danger = false }: SettingsSectionProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${
        danger
          ? "border border-red-200 bg-red-50/50"
          : "border border-gray-200 bg-white"
      }`}
      style={{ borderWidth: "0.5px" }}
    >
      {(title || description) && (
        <div className="px-5 pt-4 pb-2">
          {title && (
            <p className={`text-xs font-semibold uppercase tracking-widest ${danger ? "text-red-500" : "text-gray-400"}`}>
              {title}
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
      <div className="px-5 pb-1">{children}</div>
    </div>
  );
}
