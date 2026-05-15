"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Eye } from "lucide-react";
import AIQuestions from "./AIQuestions";
import AIGenerating from "./AIGenerating";
import AIEditMode from "./AIEditMode";
import ProfilePreview from "../shared/ProfilePreview";
import { useProfileSetup } from "@/hooks/useProfileSetup";
import { useToastContext } from "@/context/ToastContext";
import type { SetupState } from "@/hooks/useProfileSetup";

type Phase = "questions" | "generating" | "editing";

export default function AISetupFlow() {
  const { state, setField, generateProfile, publishProfile, checkUsername } = useProfileSetup();
  const [phase, setPhase] = useState<Phase>("questions");
  const [showPreview, setShowPreview] = useState(false);
  const [typewriterBio, setTypewriterBio] = useState("");
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { error: toastError } = useToastContext();

  const handleGenerate = async (): Promise<{ success: boolean }> => {
    setPhase("generating");
    const result = await generateProfile();
    if (!result.success) {
      toastError("AI generation failed. You can type it yourself.");
      setPhase("editing");
    }
    return result;
  };

  const handleGeneratingDone = useCallback(() => {
    setPhase("editing");
    // Typewriter effect for bio
    const bio = state.bio;
    if (bio) {
      setTypewriterBio("");
      let i = 0;
      typewriterRef.current = setInterval(() => {
        i++;
        setTypewriterBio(bio.slice(0, i));
        if (i >= bio.length) {
          clearInterval(typewriterRef.current!);
          setTypewriterBio(bio);
        }
      }, 25);
    }
  }, [state.bio]);

  useEffect(() => () => { if (typewriterRef.current) clearInterval(typewriterRef.current); }, []);

  const previewState: SetupState = {
    ...state,
    bio: phase === "editing" && typewriterBio ? typewriterBio : state.bio,
  };

  const handleFieldChange = (key: keyof SetupState, value: string) => {
    (setField as (k: keyof SetupState, v: string) => void)(key, value);
  };

  const handleServiceEdit = (i: number, value: string) => {
    const updated = [...state.services];
    updated[i] = value;
    setField("services", updated);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="w-full lg:w-[45%] flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
          {phase === "questions" && (
            <AIQuestions
              state={state}
              setField={setField as (k: keyof SetupState, v: string | number) => void}
              onGenerate={handleGenerate}
            />
          )}
          {phase === "generating" && (
            <AIGenerating onDone={handleGeneratingDone} />
          )}
          {phase === "editing" && (
            <AIEditMode
              state={state}
              setField={setField as (k: keyof SetupState, v: unknown) => void}
              checkUsername={checkUsername}
              onPublish={publishProfile}
            />
          )}
        </div>
      </div>

      {/* Right panel — desktop preview */}
      <div className="hidden lg:flex lg:w-[55%] bg-gray-50 items-center justify-center p-8 sticky top-0 h-screen overflow-y-auto">
        <div className="w-full max-w-sm">
          {phase === "generating" ? (
            <div className="space-y-4">
              {[80, 60, 100, 40].map((w, i) => (
                <div key={i} className="h-4 rounded-full animate-pulse bg-gray-200" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <ProfilePreview
              state={previewState}
              editMode={phase === "editing"}
              onField={handleFieldChange}
              onServiceEdit={handleServiceEdit}
            />
          )}
        </div>
      </div>

      {/* Mobile floating preview button */}
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="lg:hidden fixed bottom-6 right-6 flex items-center gap-2 text-white text-sm font-semibold px-4 py-3 rounded-full shadow-lg z-50"
        style={{ backgroundColor: "#f97316" }}
      >
        <Eye size={16} /> Preview
      </button>

      {/* Mobile preview overlay */}
      {showPreview && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-h-[90vh] overflow-y-auto w-full max-w-sm p-1">
            <ProfilePreview state={previewState} />
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="w-full mt-3 py-3 text-center text-sm text-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
