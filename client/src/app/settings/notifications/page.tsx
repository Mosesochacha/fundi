"use client";

import { useState, useEffect } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useGetNotifications, useUpdateNotifications } from "@/features/settings";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsRow from "@/components/settings/SettingsRow";
import ToggleSwitch from "@/components/settings/ToggleSwitch";

const EMAIL_TOGGLES = [
  { key: "emailProfileViewed", label: "Profile viewed",   description: "When someone views your profile" },
  { key: "emailNewFollower",   label: "New follower",     description: "When someone follows you" },
  { key: "emailPostLiked",     label: "Post liked",       description: "When someone likes your post" },
  { key: "emailPostComment",   label: "Post comment",     description: "When someone comments on your post" },
  { key: "emailWeeklySummary", label: "Weekly summary",   description: "Your weekly profile stats" },
  { key: "emailProductUpdates",label: "Tips and updates", description: "Product updates from Fundi" },
];

export default function NotificationsPage() {
  const { error } = useToastContext();
  const { data } = useGetNotifications();
  const updateNotifications = useUpdateNotifications();

  const serverPrefs: Record<string, boolean> = data ?? {};
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (Object.keys(serverPrefs).length > 0) setPrefs(serverPrefs);
  }, [data]);

  const handleToggle = async (key: string, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await updateNotifications.mutateAsync({ [key]: value });
    } catch {
      setPrefs((p) => ({ ...p, [key]: !value }));
      error("Failed to save. Please try again.");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <SettingsHeader title="Notifications" description="Choose what you hear about" />

      <SettingsSection title="Email Notifications">
        {EMAIL_TOGGLES.map(({ key, label, description }, i) => (
          <SettingsRow
            key={key}
            label={label}
            description={description}
            last={i === EMAIL_TOGGLES.length - 1}
          >
            <ToggleSwitch
              label={label}
              checked={prefs[key] ?? true}
              onChange={(v) => handleToggle(key, v)}
              loading={saving[key]}
            />
          </SettingsRow>
        ))}
      </SettingsSection>

      <SettingsSection title="Push Notifications">
        <div className="py-4 flex items-center gap-3">
          <span className="text-xs font-semibold bg-orange-50 text-[#f97316] border border-orange-100 rounded-full px-2.5 py-1">
            Coming soon
          </span>
          <p className="text-sm text-gray-400">Push notifications are not yet available</p>
        </div>
      </SettingsSection>
    </div>
  );
}
