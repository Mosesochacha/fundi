"use client";

import { ChevronRight } from "lucide-react";
import type { SetupState } from "@/hooks/useProfileSetup";

const CHIPS = ["Plumber", "Electrician", "Painter", "Carpenter", "Mechanic", "Photographer", "Developer", "Designer", "Lawyer", "Accountant", "Tutor", "Cook"];

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: unknown) => void;
  onNext: () => void;
}

export default function StepProfession({ state, setField, onNext }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-1">What do you do?</h2>
        <p className="text-gray-500 text-sm">Tell us about your work</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your full name</label>
        <input
          type="text"
          value={state.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          placeholder="e.g. James Mwangi"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your profession or skill</label>
        <input
          type="text"
          value={state.profession}
          onChange={(e) => setField("profession", e.target.value)}
          placeholder="e.g. Master Plumber, Interior Designer..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all"
          style={{ height: 56 }}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setField("profession", c)}
              className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-700 hover:border-[#f97316] hover:text-[#f97316] active:scale-95 transition-all"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!state.profession.trim() || !state.fullName.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-xl text-white font-semibold disabled:opacity-40 h-[52px]"
        style={{ backgroundColor: "#f97316" }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
