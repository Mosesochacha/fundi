"use client";

import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";

interface Props {
  services: string[];
  onChange: (services: string[]) => void;
  themeColor?: string;
}

export default function ServiceTags({ services, onChange, themeColor = "#f97316" }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const remove = (i: number) => onChange(services.filter((_, idx) => idx !== i));

  const add = () => {
    const v = draft.trim();
    if (v && services.length < 8 && !services.includes(v)) {
      onChange([...services, v]);
    }
    setDraft("");
    setAdding(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
    if (e.key === "Escape") { setDraft(""); setAdding(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {services.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: themeColor }}
          >
            {s}
            <button type="button" onClick={() => remove(i)} className="hover:opacity-70 ml-1">
              <X size={12} />
            </button>
          </span>
        ))}
        {services.length < 8 && !adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus size={12} /> Add service
          </button>
        )}
        {adding && (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            onBlur={add}
            placeholder="Type and press Enter"
            className="px-3 py-1 rounded-full text-sm border-2 outline-none"
            style={{ borderColor: themeColor, width: 180 }}
          />
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1">Max 8 services · Press Enter to add</p>
    </div>
  );
}
