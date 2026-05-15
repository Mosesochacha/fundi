"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useToastContext } from "@/context/ToastContext";
import { useChangeEmailMutation, useUpdatePreferencesMutation, useGetPreferencesQuery } from "@/store/apiSlice";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsRow from "@/components/settings/SettingsRow";
import DangerZone from "@/components/settings/DangerZone";
import Button from "@/components/ui/Button";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
];

const COUNTRIES = [
  { value: "KE", label: "Kenya" },
  { value: "UG", label: "Uganda" },
  { value: "TZ", label: "Tanzania" },
  { value: "RW", label: "Rwanda" },
];

const TIMEZONES = [
  { value: "Africa/Nairobi", label: "Nairobi (EAT, UTC+3)" },
  { value: "Africa/Kampala", label: "Kampala (EAT, UTC+3)" },
  { value: "Africa/Dar_es_Salaam", label: "Dar es Salaam (EAT, UTC+3)" },
  { value: "UTC", label: "UTC" },
];

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name[0]}${"*".repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
}

export default function AccountSettingsPage() {
  const { user, profile } = useAppSelector((s) => s.auth);
  const { success, error } = useToastContext();
  const [changeEmail, { isLoading: changingEmail }] = useChangeEmailMutation();
  const [updatePrefs, { isLoading: savingPrefs }] = useUpdatePreferencesMutation();
  const { data: prefsData } = useGetPreferencesQuery();

  const prefs: any = (prefsData as any)?.data ?? {};

  const [emailForm, setEmailForm] = useState({ newEmail: "", password: "" });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prefForm, setPrefForm] = useState({
    language: prefs.language || "en",
    country: prefs.country || "KE",
    timezone: prefs.timezone || "Africa/Nairobi",
  });

  const profileUrl = `https://fundi.co.ke/${profile?.username ?? ""}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailChange = async () => {
    if (!emailForm.newEmail || !emailForm.password) {
      error("Fill in all fields");
      return;
    }
    try {
      await changeEmail({ newEmail: emailForm.newEmail, currentPassword: emailForm.password }).unwrap();
      success("Email updated successfully");
      setShowEmailForm(false);
      setEmailForm({ newEmail: "", password: "" });
    } catch (e: any) {
      error(e?.data?.message || "Failed to update email");
    }
  };

  const handleSavePrefs = async () => {
    try {
      await updatePrefs(prefForm).unwrap();
      success("Preferences saved");
    } catch {
      error("Failed to save preferences");
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-colors";
  const selectClass = `${inputClass} bg-white`;

  return (
    <div className="space-y-6">
      <SettingsHeader title="Account" description="Manage your account details" />

      {/* Email */}
      <SettingsSection title="Email Address">
        <SettingsRow
          label="Email address"
          description={user?.email ? maskEmail(user.email) : ""}
          last={!showEmailForm}
        >
          {!showEmailForm && (
            <button onClick={() => setShowEmailForm(true)} className="text-sm font-semibold text-[#f97316] hover:text-orange-600">
              Change
            </button>
          )}
        </SettingsRow>
        {showEmailForm && (
          <div className="py-4 space-y-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">We will update your email immediately.</p>
            <input
              className={inputClass}
              type="email"
              placeholder="New email address"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
            />
            <input
              className={inputClass}
              type="password"
              placeholder="Current password to confirm"
              value={emailForm.password}
              onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowEmailForm(false)} className="flex-1 h-10 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <Button onClick={handleEmailChange} loading={changingEmail}>
                Update email
              </Button>
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Language & region */}
      <SettingsSection title="Language & Region">
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Language</label>
            <select className={selectClass} value={prefForm.language} onChange={(e) => setPrefForm((f) => ({ ...f, language: e.target.value }))}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Country</label>
            <select className={selectClass} value={prefForm.country} onChange={(e) => setPrefForm((f) => ({ ...f, country: e.target.value }))}>
              {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Timezone</label>
            <select className={selectClass} value={prefForm.timezone} onChange={(e) => setPrefForm((f) => ({ ...f, timezone: e.target.value }))}>
              {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Button onClick={handleSavePrefs} loading={savingPrefs} variant="primary">
            Save preferences
          </Button>
        </div>
      </SettingsSection>

      {/* Profile URL */}
      <SettingsSection title="Profile URL">
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 bg-gray-50 truncate">
              {profileUrl}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Danger zone */}
      <DangerZone />
    </div>
  );
}
