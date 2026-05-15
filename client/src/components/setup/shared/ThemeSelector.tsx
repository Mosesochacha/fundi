"use client";

const THEMES = [
  { name: "orange",  color: "#f97316" },
  { name: "coral",   color: "#E05A2B" },
  { name: "blue",    color: "#2563eb" },
  { name: "forest",  color: "#16a34a" },
  { name: "purple",  color: "#7c3aed" },
  { name: "gold",    color: "#d97706" },
  { name: "rose",    color: "#e11d48" },
  { name: "slate",   color: "#475569" },
];

interface Props {
  value: string;
  onChange: (theme: string) => void;
}

export default function ThemeSelector({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Pick your profile colour</p>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => onChange(t.name)}
            title={t.name}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: t.color,
              boxShadow: value === t.name ? `0 0 0 3px white, 0 0 0 5px ${t.color}` : "none",
              transition: "box-shadow 150ms",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const THEME_COLORS: Record<string, string> = Object.fromEntries(THEMES.map((t) => [t.name, t.color]));
