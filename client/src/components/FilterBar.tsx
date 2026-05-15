"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, MapPin, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setPostType,
  setDateRange,
  setProfession,
  setLocation,
  clearFilters,
  selectHasActiveFilters,
} from "@/store/feedSlice";

const POST_TYPE_OPTIONS = [
  { value: "all",      label: "All posts" },
  { value: "SHOWCASE", label: "Showcases" },
  { value: "TIP",      label: "Pro Tips" },
  { value: "QUESTION", label: "Questions" },
  { value: "HIRING",   label: "Jobs" },
];

const DATE_OPTIONS = [
  { value: "all",   label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week",  label: "This week" },
  { value: "month", label: "This month" },
];

const TRADE_OPTIONS = [
  { value: "all",         label: "All trades" },
  { value: "Plumber",     label: "Plumber" },
  { value: "Electrician", label: "Electrician" },
  { value: "Carpenter",   label: "Carpenter" },
  { value: "Painter",     label: "Painter" },
  { value: "Mason",       label: "Mason" },
  { value: "Welder",      label: "Welder" },
  { value: "Mechanic",    label: "Mechanic" },
  { value: "Tailor",      label: "Tailor" },
  { value: "Chef",        label: "Chef" },
  { value: "Cleaner",     label: "Cleaner" },
  { value: "Landscaper",  label: "Landscaper" },
  { value: "Tiler",       label: "Tiler" },
  { value: "Roofing",     label: "Roofing" },
  { value: "AC Tech",     label: "AC Tech" },
  { value: "Other",       label: "Other" },
];

interface DropdownProps {
  id: string;
  label: string;
  value: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  open: boolean;
  onToggle: (id: string) => void;
  onChange: (value: string) => void;
}

function FilterDropdown({ id, label, value, defaultValue, options, open, onToggle, onChange }: DropdownProps) {
  const isActive = value !== defaultValue;
  const displayLabel = isActive ? (options.find((o) => o.value === value)?.label ?? label) : label;
  const btnRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPanelPos({ top: r.bottom + 4, left: r.left });
    }
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={() => onToggle(id)}
        className={`flex items-center gap-1.5 h-6 px-2.5 rounded-lg text-[11px] font-medium border transition-all whitespace-nowrap ${
          isActive
            ? "border-primary bg-orange-50 text-primary"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
        {displayLabel}
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          style={{ position: "fixed", top: panelPos.top, left: panelPos.left, zIndex: 9999 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36 max-h-52 overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); onToggle(""); }}
              className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${
                value === opt.value
                  ? "text-primary font-semibold bg-orange-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterBar() {
  const dispatch = useAppDispatch();
  const { postType, dateRange, profession, location } = useAppSelector((s) => s.feed);
  const hasActive = useAppSelector(selectHasActiveFilters);
  const [openDropdown, setOpenDropdown] = useState("");
  const [localLocation, setLocalLocation] = useState(location);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location === "") setLocalLocation("");
  }, [location]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(setLocation(localLocation));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [localLocation, dispatch]);

  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const toggle = (id: string) => setOpenDropdown((prev) => (prev === id ? "" : id));

  return (
    <div ref={barRef} className="border-t border-gray-100 px-4 py-1.5">
      <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 w-max min-w-full">
          <FilterDropdown
            id="postType"
            label="Post type"
            value={postType}
            defaultValue="all"
            options={POST_TYPE_OPTIONS}
            open={openDropdown === "postType"}
            onToggle={toggle}
            onChange={(v) => dispatch(setPostType(v))}
          />
          <FilterDropdown
            id="dateRange"
            label="Date posted"
            value={dateRange}
            defaultValue="all"
            options={DATE_OPTIONS}
            open={openDropdown === "dateRange"}
            onToggle={toggle}
            onChange={(v) => dispatch(setDateRange(v))}
          />
          <FilterDropdown
            id="profession"
            label="Trade"
            value={profession}
            defaultValue="all"
            options={TRADE_OPTIONS}
            open={openDropdown === "profession"}
            onToggle={toggle}
            onChange={(v) => dispatch(setProfession(v))}
          />

          <div className="relative shrink-0">
            <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={localLocation}
              onChange={(e) => setLocalLocation(e.target.value)}
              placeholder="Location..."
              className={`h-6 pl-6 pr-2.5 rounded-lg text-[11px] border transition-all w-28 focus:w-40 focus:outline-none ${
                localLocation
                  ? "border-primary bg-orange-50 text-primary placeholder-primary/60 focus:ring-1 focus:ring-primary/30"
                  : "border-gray-200 bg-white text-gray-700 placeholder-gray-400 hover:border-gray-300 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20"
              }`}
            />
          </div>

          {hasActive && (
            <button
              onClick={() => { dispatch(clearFilters()); setOpenDropdown(""); }}
              className="flex items-center gap-1 h-6 px-2 rounded-lg text-[11px] font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all shrink-0 ml-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
