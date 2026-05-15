"use client";

import { useState, useEffect } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useGetPrivacyQuery, useUpdatePrivacyMutation } from "@/store/apiSlice";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsRow from "@/components/settings/SettingsRow";
import ToggleSwitch from "@/components/settings/ToggleSwitch";

const VISIBILITY_TOGGLES = [
  { key: "profilePublic",       label: "Public profile",          description: "Anyone can find and view your profile" },
  { key: "showPhone",           label: "Show phone number",        description: "Visitors can see your number" },
  { key: "showEmail",           label: "Show email",               description: "Visitors can see your email" },
  { key: "showYearsExperience", label: "Show years of experience", description: "Show how long you have worked" },
  { key: "showProfileViews",    label: "Show profile views",       description: "Show view count on your profile" },
];

const DISCOVERY_TOGGLES = [
  { key: "appearInSearch", label: "Appear in search results", description: "Show in platform search" },
];

const COMMUNITY_TOGGLES = [
  { key: "allowComments",  label: "Allow comments",         description: "Allow comments on your posts" },
  { key: "allowFollowers", label: "Allow followers",        description: "Allow others to follow you" },
];

export default function PrivacyPage() {
  const { error } = useToastContext();
  const { data } = useGetPrivacyQuery();
  const [updatePrivacy] = useUpdatePrivacyMutation();

  const serverPrefs: Record<string, boolean> = (data as any)?.data ?? {};
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Object.keys(serverPrefs).length > 0) setPrefs(serverPrefs);
  }, [data]);

  const handleToggle = async (key: string, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await updatePrivacy({ [key]: value }).unwrap();
    } catch {
      setPrefs((p) => ({ ...p, [key]: !value }));
      error("Failed to save. Please try again.");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const renderToggles = (toggles: typeof VISIBILITY_TOGGLES) =>
    toggles.map(({ key, label, description }, i) => (
      <SettingsRow key={key} label={label} description={description} last={i === toggles.length - 1}>
        <ToggleSwitch
          label={label}
          checked={prefs[key] ?? true}
          onChange={(v) => handleToggle(key, v)}
          loading={saving[key]}
        />
      </SettingsRow>
    ));

  return (
    <div className="space-y-6">
      <SettingsHeader title="Privacy" description="Control who sees what" />
      <SettingsSection title="Profile Visibility">{renderToggles(VISIBILITY_TOGGLES)}</SettingsSection>
      <SettingsSection title="Search & Discovery">{renderToggles(DISCOVERY_TOGGLES)}</SettingsSection>
      <SettingsSection title="Community">{renderToggles(COMMUNITY_TOGGLES)}</SettingsSection>
    </div>
  );
}
