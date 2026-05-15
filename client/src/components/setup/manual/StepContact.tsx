"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import UsernameInput from "../shared/UsernameInput";
import PublishButton from "../shared/PublishButton";
import type { SetupState } from "@/hooks/useProfileSetup";

interface Props {
  state: SetupState;
  setField: (k: keyof SetupState, v: unknown) => void;
  checkUsername: (u: string) => void;
  publishProfile: () => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
}

export default function StepContact({ state, setField, checkUsername, publishProfile, onBack }: Props) {
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setError(null);
    const r = await publishProfile();
    if (!r.success) setError(r.error || "Failed to publish");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-1">Contact &amp; URL</h2>
        <p className="text-gray-500 text-sm">How clients can reach you</p>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
        <div className="flex items-center gap-0">
          <span className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-l-xl text-sm text-gray-500 border-r-0 shrink-0">+254</span>
          <input
            type="tel"
            value={state.phone}
            onChange={(e) => {
              const v = e.target.value;
              setField("phone", v);
              if (whatsappSame) setField("whatsapp", v);
            }}
            placeholder="712 345 678"
            className="flex-1 border border-gray-200 rounded-r-xl px-3 py-3 text-sm outline-none focus:border-[#f97316] transition-colors"
          />
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={whatsappSame}
            onChange={(e) => {
              setWhatsappSame(e.target.checked);
              if (e.target.checked) setField("whatsapp", state.phone);
            }}
            className="accent-[#f97316]"
          />
          WhatsApp is the same as my phone number
        </label>
        {!whatsappSame && (
          <div className="flex items-center gap-0">
            <span className="px-3 py-3 bg-gray-50 border border-gray-200 rounded-l-xl text-sm text-gray-500 border-r-0 shrink-0">+254</span>
            <input
              type="tel"
              value={state.whatsapp}
              onChange={(e) => setField("whatsapp", e.target.value)}
              placeholder="WhatsApp number"
              className="flex-1 border border-gray-200 rounded-r-xl px-3 py-3 text-sm outline-none focus:border-[#f97316] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Username */}
      <UsernameInput
        value={state.username}
        onChange={checkUsername}
        available={state.usernameAvailable}
        checking={state.usernameChecking}
        suggestion={state.usernameSuggestion}
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex-1">
          <PublishButton
            username={state.username}
            isPublishing={state.isPublishing}
            onPublish={handlePublish}
            disabled={!state.profession || !state.location}
          />
        </div>
      </div>
    </div>
  );
}
