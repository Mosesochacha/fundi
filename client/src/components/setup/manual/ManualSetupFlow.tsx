"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import StepProfession from "./StepProfession";
import StepLocation from "./StepLocation";
import StepExperience from "./StepExperience";
import StepPhotos from "./StepPhotos";
import StepContact from "./StepContact";
import ProfilePreview from "../shared/ProfilePreview";
import { useProfileSetup } from "@/hooks/useProfileSetup";
import type { SetupState } from "@/hooks/useProfileSetup";

const STEPS = ["Profession", "Location", "About", "Photos", "Contact"];

export default function ManualSetupFlow() {
  const { state, setField, nextStep, prevStep, generateProfile, publishProfile, checkUsername } = useProfileSetup();
  const [step, setStep] = useState(() => Math.min(state.step, 4));
  const [showPreview, setShowPreview] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const go = (delta: 1 | -1) => {
    setDirection(delta);
    setSliding(true);
    setTimeout(() => {
      if (delta === 1) nextStep();
      else prevStep();
      setStep((s) => s + delta);
      setSliding(false);
    }, 280);
  };

  const slideStyle = {
    opacity: sliding ? 0 : 1,
    transform: sliding
      ? `translateX(${direction === 1 ? "-30px" : "30px"})`
      : "translateX(0)",
    transition: "opacity 280ms ease-out, transform 280ms ease-out",
  };

  const sf = setField as (k: keyof SetupState, v: unknown) => void;

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="w-full lg:w-[45%] flex flex-col bg-white">
        {/* Progress bar */}
        <div className="px-6 md:px-10 pt-8 pb-4">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full transition-colors"
                    style={{ backgroundColor: i <= step ? "#f97316" : "#e5e7eb" }}
                  />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 transition-colors" style={{ backgroundColor: i < step ? "#f97316" : "#e5e7eb" }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {STEPS.map((label, i) => (
              <span key={i} className="text-[10px] text-gray-400" style={{ color: i === step ? "#f97316" : undefined }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-8" style={slideStyle}>
          {step === 0 && <StepProfession state={state} setField={sf} onNext={() => go(1)} />}
          {step === 1 && <StepLocation state={state} setField={sf} onNext={() => go(1)} onBack={() => go(-1)} />}
          {step === 2 && <StepExperience state={state} setField={sf} generateProfile={generateProfile} onNext={() => go(1)} onBack={() => go(-1)} />}
          {step === 3 && <StepPhotos state={state} setField={sf} onNext={() => go(1)} onBack={() => go(-1)} />}
          {step === 4 && <StepContact state={state} setField={sf} checkUsername={checkUsername} publishProfile={publishProfile} onBack={() => go(-1)} />}
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex lg:w-[55%] bg-gray-50 items-center justify-center p-8 sticky top-0 h-screen">
        <div className="w-full max-w-sm">
          <ProfilePreview state={state} />
        </div>
      </div>

      {/* Mobile preview button */}
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="lg:hidden fixed bottom-6 right-6 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg z-50"
        style={{ backgroundColor: "#f97316" }}
      >
        <Eye size={16} /> Preview
      </button>

      {showPreview && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-h-[90vh] overflow-y-auto w-full max-w-sm p-1">
            <ProfilePreview state={state} />
            <button type="button" onClick={() => setShowPreview(false)} className="w-full mt-3 py-3 text-center text-sm text-gray-500">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
