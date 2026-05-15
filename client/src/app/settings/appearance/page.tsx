"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useToastContext } from "@/context/ToastContext";
import { useUpdateProfileMutation, useGetPreferencesQuery, useUpdatePreferencesMutation } from "@/store/apiSlice";
import { useAppSelector } from "@/store/hooks";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import Button from "@/components/ui/Button";

const THEMES = [
  { id: "orange", label: "Teal",   color: "#f97316" },
  { id: "coral",  label: "Coral",  color: "#E05A2B" },
  { id: "royal",  label: "Royal",  color: "#1D4ED8" },
  { id: "forest", label: "Forest", color: "#15803D" },
  { id: "purple", label: "Purple", color: "#7C3AED" },
  { id: "gold",   label: "Gold",   color: "#B45309" },
  { id: "rose",   label: "Rose",   color: "#BE185D" },
  { id: "slate",  label: "Slate",  color: "#334155" },
];

const NAME_FORMATS = [
  { value: "full",         label: "Full name",         example: "John Kamau" },
  { value: "first",        label: "First name only",   example: "John" },
  { value: "professional", label: "Professional name", example: "John K. — Plumber" },
];

const LAYOUTS = [
  { value: "standard", label: "Standard",  description: "Photo top, bio below" },
  { value: "minimal",  label: "Minimal",   description: "No photo header, text only" },
  { value: "gallery",  label: "Gallery",   description: "Work photos prominent at top" },
];

export default function AppearancePage() {
  const { success, error } = useToastContext();
  const { profile } = useAppSelector((s) => s.auth);
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [updatePrefs] = useUpdatePreferencesMutation();
  const { data: prefsData } = useGetPreferencesQuery();

  const prefs: any = (prefsData as any)?.data ?? {};

  const [theme, setTheme] = useState("orange");
  const [nameFormat, setNameFormat] = useState("full");
  const [layout, setLayout] = useState("standard");

  useEffect(() => {
    if (prefs.displayNameFormat) setNameFormat(prefs.displayNameFormat);
    if (prefs.profileLayout) setLayout(prefs.profileLayout);
  }, [prefsData]);

  const handleSave = async () => {
    try {
      await Promise.all([
        updateProfile({ theme }).unwrap(),
        updatePrefs({ displayNameFormat: nameFormat, profileLayout: layout }).unwrap(),
      ]);
      success("Appearance saved");
    } catch {
      error("Failed to save appearance");
    }
  };

  const previewName = profile?.fullName || "John Kamau";
  const previewProfession = profile?.profession || "Plumber";

  const getPreviewName = () => {
    if (nameFormat === "first") return previewName.split(" ")[0];
    if (nameFormat === "professional") {
      const parts = previewName.split(" ");
      return `${parts[0]} ${parts[1]?.[0] ?? ""}. — ${previewProfession}`;
    }
    return previewName;
  };

  const selectedThemeColor = THEMES.find((t) => t.id === theme)?.color ?? "#f97316";

  return (
    <div className="space-y-6">
      <SettingsHeader title="Appearance" description="Customise how your profile looks" />

      {/* Theme swatches */}
      <SettingsSection title="Profile Theme">
        <div className="py-4 space-y-5">
          <div className="grid grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={t.label}
              >
                <div
                  className="w-14 h-14 rounded-full relative transition-transform group-hover:scale-105 shadow-sm"
                  style={{ background: t.color }}
                >
                  {theme === t.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={20} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Live preview */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="h-16" style={{ background: selectedThemeColor }} />
            <div className="px-4 pt-6 pb-4 bg-white">
              <div className="w-10 h-10 rounded-full -mt-10 mb-2 ring-2 ring-white" style={{ background: selectedThemeColor }} />
              <p className="font-semibold text-gray-900 text-sm">{getPreviewName()}</p>
              <p className="text-xs" style={{ color: selectedThemeColor }}>{previewProfession}</p>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Display name format */}
      <SettingsSection title="Display Name Format">
        <div className="py-4 space-y-3">
          {NAME_FORMATS.map((f) => (
            <label key={f.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="nameFormat"
                value={f.value}
                checked={nameFormat === f.value}
                onChange={() => setNameFormat(f.value)}
                className="w-4 h-4 accent-[#f97316]"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{f.label}</p>
                <p className="text-xs text-gray-400">{f.example}</p>
              </div>
            </label>
          ))}
        </div>
      </SettingsSection>

      {/* Profile layout */}
      <SettingsSection title="Profile Layout">
        <div className="py-4 space-y-3">
          {LAYOUTS.map((l) => (
            <label key={l.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="layout"
                value={l.value}
                checked={layout === l.value}
                onChange={() => setLayout(l.value)}
                className="w-4 h-4 accent-[#f97316]"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{l.label}</p>
                <p className="text-xs text-gray-400">{l.description}</p>
              </div>
            </label>
          ))}
        </div>
      </SettingsSection>

      <div className="pb-6">
        <Button onClick={handleSave} loading={saving} fullWidth>
          Save appearance
        </Button>
      </div>
    </div>
  );
}
