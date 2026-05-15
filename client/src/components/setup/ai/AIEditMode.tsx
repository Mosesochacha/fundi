"use client";

import { useState } from "react";
import ThemeSelector from "../shared/ThemeSelector";
import ServiceTags from "../shared/ServiceTags";
import UsernameInput from "../shared/UsernameInput";
import PhotoUploadGrid from "../shared/PhotoUploadGrid";
import PublishButton from "../shared/PublishButton";
import { THEME_COLORS } from "../shared/ThemeSelector";
import type { SetupState } from "@/hooks/useProfileSetup";
import { useAppSelector } from "@/store/hooks";

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: unknown) => void;
  checkUsername: (u: string) => void;
  onPublish: () => Promise<{ success: boolean; error?: string }>;
}

export default function AIEditMode({ state, setField, checkUsername, onPublish }: Props) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const color = THEME_COLORS[state.theme] || THEME_COLORS.orange;

  const handlePublish = async () => {
    setError(null);
    const r = await onPublish();
    if (!r.success) setError(r.error || "Failed to publish");
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Theme */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose your theme</h3>
        <ThemeSelector value={state.theme} onChange={(t) => setField("theme", t)} />
      </section>

      {/* Services */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Your services</h3>
        <ServiceTags
          services={state.services}
          onChange={(s) => setField("services", s)}
          themeColor={color}
        />
      </section>

      {/* Contact */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Your contact details</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="shrink-0 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-l-xl text-sm text-gray-500 border-r-0">+254</span>
            <input
              type="tel"
              value={state.phone}
              onChange={(e) => {
                const v = e.target.value;
                setField("phone", v);
                if (whatsappSame) setField("whatsapp", v);
              }}
              placeholder="712 345 678"
              className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2.5 text-sm outline-none focus:border-[#f97316] transition-colors"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappSame}
              onChange={(e) => {
                setWhatsappSame(e.target.checked);
                if (e.target.checked) setField("whatsapp", state.phone);
              }}
              className="accent-[#f97316]"
            />
            WhatsApp is the same number
          </label>
          {!whatsappSame && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-l-xl text-sm text-gray-500 border-r-0">+254</span>
              <input
                type="tel"
                value={state.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
                placeholder="WhatsApp number"
                className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2.5 text-sm outline-none focus:border-[#f97316] transition-colors"
              />
            </div>
          )}
        </div>
      </section>

      {/* Username */}
      <section>
        <UsernameInput
          value={state.username}
          onChange={checkUsername}
          available={state.usernameAvailable}
          checking={state.usernameChecking}
          suggestion={state.usernameSuggestion}
        />
      </section>

      {/* Photos */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Add work photos <span className="font-normal text-gray-400">(optional)</span></h3>
        <PhotoUploadGrid
          photos={state.photos}
          onAdd={(url) => setField("photos", [...state.photos, url])}
          onRemove={(i) => setField("photos", state.photos.filter((_, idx) => idx !== i))}
          token={accessToken}
        />
        <button type="button" className="text-xs text-gray-400 mt-2 underline">Skip — add later</button>
      </section>

      {/* Error */}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {/* Publish */}
      <PublishButton
        username={state.username}
        isPublishing={state.isPublishing}
        onPublish={handlePublish}
        disabled={!state.profession || !state.location}
      />
    </div>
  );
}
