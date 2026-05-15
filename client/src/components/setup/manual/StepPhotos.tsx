"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";
import PhotoUploadGrid from "../shared/PhotoUploadGrid";
import type { SetupState } from "@/hooks/useProfileSetup";
import { useAppSelector } from "@/store/hooks";

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: unknown) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepPhotos({ state, setField, onNext, onBack }: Props) {
  const { accessToken } = useAppSelector((s) => s.auth);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-1">Add work photos</h2>
        <p className="text-gray-500 text-sm">Show clients what you&apos;ve built or done — optional</p>
      </div>

      <PhotoUploadGrid
        photos={state.photos}
        onAdd={(url) => setField("photos", [...state.photos, url])}
        onRemove={(i) => setField("photos", state.photos.filter((_, idx) => idx !== i))}
        token={accessToken}
      />

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
      <button type="button" onClick={onNext} className="w-full text-center text-sm text-gray-400 underline">
        Skip — add later
      </button>
    </div>
  );
}
