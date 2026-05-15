"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import type { SetupState } from "@/hooks/useProfileSetup";

const CHIPS = ["Westlands", "Kilimani", "Karen", "Kasarani", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Machakos"];

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepLocation({ state, setField, onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-1">Where are you based?</h2>
        <p className="text-gray-500 text-sm">Your city or neighbourhood in Kenya</p>
      </div>

      <div>
        <input
          type="text"
          value={state.location}
          onChange={(e) => setField("location", e.target.value)}
          placeholder="e.g. Westlands, Nairobi"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all"
          style={{ height: 56 }}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setField("location", c)}
              className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-700 hover:border-[#f97316] hover:text-[#f97316] active:scale-95 transition-all"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!state.location.trim()}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl text-white font-semibold disabled:opacity-40 h-[52px]"
          style={{ backgroundColor: "#f97316" }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
