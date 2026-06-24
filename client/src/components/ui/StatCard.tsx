import { cn } from "@/lib/utils";

type AccentColor = "gold" | "blue" | "green" | "purple" | "default";

const accents: Record<AccentColor, string> = {
  gold: "bg-gold",
  blue: "bg-blue-500",
  green: "bg-green-400",
  purple: "bg-purple-500",
  default: "bg-border",
};

interface StatCardProps {
  label: string;
  number: string | number;
  sub?: string;
  trend?: string;
  accent?: AccentColor;
}

export function StatCard({
  label,
  number,
  sub,
  trend,
  accent = "default",
}: StatCardProps) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 relative overflow-hidden">
      <div
        className={cn("absolute top-0 left-0 right-0 h-0.5", accents[accent])}
      />
      <p className="text-xs text-ink-3 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          "font-serif text-2xl font-normal leading-none mb-1.5",
          accent === "gold" ? "text-gold-dark" : "text-ink",
        )}
      >
        {number}
      </p>
      {sub && <p className="text-xs text-ink-3">{sub}</p>}
      {trend && (
        <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
  );
}
