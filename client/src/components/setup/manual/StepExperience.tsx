"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Minus, Plus, Sparkles } from "lucide-react";
import ServiceTags from "../shared/ServiceTags";
import type { SetupState } from "@/hooks/useProfileSetup";

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: unknown) => void;
  generateProfile: () => Promise<{ success: boolean }>;
  onNext: () => void;
  onBack: () => void;
}

export default function StepExperience({ state, setField, generateProfile, onNext, onBack }: Props) {
  const [aiModal, setAiModal] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setField("differentiator", aiInput);
    const result = await generateProfile();
    setAiLoading(false);
    if (result.success) setAiModal(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-1">Tell us about yourself</h2>
        <p className="text-gray-500 text-sm">Help clients understand your experience</p>
      </div>

      {/* Years stepper */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Years of experience</label>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setField("yearsExperience", Math.max(0, state.yearsExperience - 1))}
            className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-[#f97316] transition-colors">
            <Minus size={16} />
          </button>
          <span className="text-4xl font-bold min-w-[48px] text-center" style={{ color: "#f97316" }}>
            {state.yearsExperience}
          </span>
          <button type="button" onClick={() => setField("yearsExperience", state.yearsExperience + 1)}
            className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-[#f97316] transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Your tagline</label>
          <span className="text-xs text-gray-400">{state.tagline.length} / 100</span>
        </div>
        <input
          type="text"
          value={state.tagline}
          onChange={(e) => setField("tagline", e.target.value.slice(0, 100))}
          placeholder="e.g. Nairobi's most trusted Master Plumber"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all"
        />
        <p className="text-xs text-gray-400 mt-1">A short punchy line that appears below your name</p>
      </div>

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">About you</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{state.bio.length} / 500</span>
            <button
              type="button"
              onClick={() => setAiModal(true)}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-colors hover:border-[#f97316] hover:text-[#f97316]"
              style={{ color: "#f97316", borderColor: "#f97316" }}
            >
              <Sparkles size={11} /> Write with AI
            </button>
          </div>
        </div>
        <textarea
          value={state.bio}
          onChange={(e) => setField("bio", e.target.value.slice(0, 500))}
          placeholder="Tell clients what makes you great..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[rgba(249,115,22,0.2)] transition-all resize-none"
          rows={4}
        />
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">What do you offer?</label>
        <ServiceTags
          services={state.services}
          onChange={(s) => setField("services", s)}
        />
        <p className="text-xs text-gray-400 mt-1">e.g. Pipe fitting, Leak repair, Bathroom installation</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl text-white font-semibold h-[52px]"
          style={{ backgroundColor: "#f97316" }}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* AI bio modal */}
      {aiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-playfair text-lg font-bold text-gray-900 mb-2">Write with AI</h3>
            <p className="text-sm text-gray-500 mb-3">What makes you stand out?</p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="e.g. I only use premium materials, guarantee my work for 1 year..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#f97316] transition-all resize-none"
              rows={4}
            />
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setAiModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={!aiInput.trim() || aiLoading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                style={{ backgroundColor: "#f97316" }}
              >
                {aiLoading ? "Generating..." : "Generate bio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
