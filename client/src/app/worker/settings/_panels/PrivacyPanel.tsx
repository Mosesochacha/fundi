"use client";

import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  type PrivacySettings,
  useUpdatePrivacy,
  type WorkerSettings,
} from "@/features/worker/settings";
import {
  apiError,
  Panel,
  PanelBody,
  SaveBar,
  ToggleRow,
} from "../_components/ui";

type Key = keyof PrivacySettings;

const ROWS: { key: Key; title: string; sub: string }[] = [
  {
    key: "publicProfile",
    title: "Public profile",
    sub: "Your profile is visible to anyone browsing Fundi",
  },
  {
    key: "showPhone",
    title: "Show phone number",
    sub: "Phone number shared only after a job is confirmed",
  },
  {
    key: "showRate",
    title: "Show daily rate",
    sub: "Display your rate on your public profile",
  },
  {
    key: "showOnline",
    title: "Show online status",
    sub: "Let employers see when you are active",
  },
  {
    key: "allowDirectMessages",
    title: "Allow direct messages",
    sub: "Employers can message you without a job request",
  },
  {
    key: "appearInSearch",
    title: "Appear in search results",
    sub: "Show up when employers search for your trade",
  },
];

const sameAs = (a: PrivacySettings, b: PrivacySettings) =>
  (Object.keys(a) as Key[]).every((k) => a[k] === b[k]);

export default function PrivacyPanel({
  settings,
  onDirty,
}: {
  settings: WorkerSettings;
  onDirty: (dirty: boolean) => void;
}) {
  const { success, error: toastError } = useToastContext();
  const update = useUpdatePrivacy();
  const [prefs, setPrefs] = useState<PrivacySettings>(settings.privacy);

  const dirty = !sameAs(prefs, settings.privacy);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  async function save() {
    try {
      await update.mutateAsync(prefs);
      success("Settings saved");
    } catch (e) {
      toastError(apiError(e, "Could not save privacy settings"));
    }
  }

  return (
    <Panel
      id="privacy"
      title="Privacy"
      subtitle="Control what employers can see and how they reach you."
    >
      <PanelBody>
        {ROWS.map((row) => (
          <ToggleRow
            key={row.key}
            title={row.title}
            sub={row.sub}
            checked={prefs[row.key]}
            onChange={(next) => setPrefs({ ...prefs, [row.key]: next })}
          />
        ))}
      </PanelBody>
      <SaveBar
        onCancel={() => setPrefs(settings.privacy)}
        onSave={save}
        saving={update.isPending}
        disabled={!dirty}
      />
    </Panel>
  );
}
