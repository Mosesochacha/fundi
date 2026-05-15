"use client";

import { FEED_FILTERS } from "@/lib/constants";

interface Props {
  active: string;
  onChange: (value: string) => void;
}

export default function FeedFilter({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
      {FEED_FILTERS.map((f) => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className={`shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
