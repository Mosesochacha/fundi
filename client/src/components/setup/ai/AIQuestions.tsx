"use client";

import { useState } from "react";
import { ChevronRight, Minus, Plus } from "lucide-react";
import type { SetupState } from "@/hooks/useProfileSetup";

const PROFESSION_CHIPS = ["Plumber", "Electrician", "Painter", "Carpenter", "Mechanic", "Photographer", "Developer", "Designer", "Lawyer", "Accountant", "Tutor", "Cook"];
const LOCATION_CHIPS = ["Westlands", "Kilimani", "Karen", "Kasarani", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: string | number) => void;
  onGenerate: () => Promise<{ success: boolean }>;
}

export default function AIQuestions({ state, setField, onGenerate }: Props) {
  const [step, setStep] = useState(0);
  const [sliding, setSliding] = useState(false);

  const advance = () => {
    setSliding(true);
    setTimeout(() => { setStep((s) => s + 1); setSliding(false); }, 300);
  };

  const chipSelect = (value: string, key: keyof SetupState) => {
    setField(key, value);
    setTimeout(advance, 400);
  };

  const canGenerate = state.profession.trim() && state.location.trim() && (state.yearsExperience > 0 || state.differentiator.trim().length >= 30);

  const Slide = ({ children }: { children: React.ReactNode }) => (
    <div
      className="transition-all duration-300"
      style={{ opacity: sliding ? 0 : 1, transform: sliding ? "translateX(-30px)" : "translateX(0)" }}
    >
      {children}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-2">Step {step + 1} of 3</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: i <= step ? "#f97316" : "#e5e7eb" }} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <Slide>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">What do you do?</h2>
          <p className="text-gray-500 text-sm mb-5">Your profession or main skill</p>
          <input
            type="text"
            value={state.profession}
            onChange={(e) => setField("profession", e.target.value)}
            placeholder="e.g. Master Plumber, Interior Designer..."
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-lg outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all"
            style={{ height: 56 }}
          />
          <div className="flex flex-wrap gap-2 mt-4">
            {PROFESSION_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => chipSelect(c, "profession")}
                className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-700 hover:border-[#f97316] hover:text-[#f97316] active:scale-95 transition-all"
                style={{ transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={advance}
            disabled={!state.profession.trim()}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl text-white font-semibold disabled:opacity-40 h-[52px] transition-opacity"
            style={{ backgroundColor: "#f97316" }}
          >
            Next <ChevronRight size={16} />
          </button>
        </Slide>
      )}

      {step === 1 && (
        <Slide>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">Where are you based?</h2>
          <p className="text-gray-500 text-sm mb-5">Your city or neighbourhood</p>
          <input
            type="text"
            value={state.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="e.g. Westlands, Nairobi"
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-lg outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all"
            style={{ height: 56 }}
          />
          <div className="flex flex-wrap gap-2 mt-4">
            {LOCATION_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => chipSelect(c, "location")}
                className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-700 hover:border-[#f97316] hover:text-[#f97316] active:scale-95 transition-all"
                style={{ transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={advance}
            disabled={!state.location.trim()}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl text-white font-semibold disabled:opacity-40 h-[52px] transition-opacity"
            style={{ backgroundColor: "#f97316" }}
          >
            Next <ChevronRight size={16} />
          </button>
        </Slide>
      )}

      {step === 2 && (
        <Slide>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-6">Tell AI about yourself</h2>

          {/* Years stepper */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">How many years have you been doing this?</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Decrease years"
                onClick={() => setField("yearsExperience", Math.max(0, state.yearsExperience - 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-[#f97316] transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="text-5xl font-bold" style={{ color: "#f97316", minWidth: 60, textAlign: "center" }}>
                {state.yearsExperience}
              </span>
              <button
                type="button"
                aria-label="Increase years"
                onClick={() => setField("yearsExperience", state.yearsExperience + 1)}
                className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-[#f97316] transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Differentiator */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-1">What makes you stand out?</p>
            <p className="text-xs text-gray-400 mb-2">AI uses this to write your bio — the more detail, the better</p>
            <textarea
              value={state.differentiator}
              onChange={(e) => setField("differentiator", e.target.value.slice(0, 400))}
              placeholder="e.g. I only use premium materials, guarantee my work for 1 year, and respond to calls within 30 minutes. I have completed over 200 projects in Nairobi."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all resize-none"
              rows={5}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{state.differentiator.length} / 400</p>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-white font-semibold disabled:opacity-40 transition-opacity"
            style={{ height: 56, backgroundColor: "#f97316" }}
          >
            ✨ Generate my profile →
          </button>
          {!canGenerate && (
            <p className="text-xs text-gray-400 text-center mt-2">Enter your profession, location, and at least 30 characters about yourself</p>
          )}
        </Slide>
      )}
    </div>
  );
}
