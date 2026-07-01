"use client";

import { useEffect, useRef, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  type NotificationSettings,
  useUpdateNotifications,
  type WorkerSettings,
} from "@/features/worker/settings";
import {
  apiError,
  Panel,
  PanelBody,
  SavedPill,
  ToggleRow,
} from "../_components/ui";

type Key = keyof NotificationSettings;

type Group = {
  title: string;
  rows: { key: Key; title: string; sub?: string }[];
};

const DELIVERY_GROUP: Group = {
  title: "Delivery method",
  rows: [
    { key: "push", title: "Push notifications" },
    { key: "email", title: "Email notifications" },
    { key: "sms", title: "SMS notifications" },
  ],
};

/** Worker-facing notification groups (they receive requests, reviews, views). */
const WORKER_GROUPS: Group[] = [
  {
    title: "Job requests",
    rows: [
      { key: "newRequests", title: "New job requests" },
      { key: "jobAccepted", title: "Job accepted confirmation" },
      {
        key: "jobReminders",
        title: "Job reminders",
        sub: "24 hours before a scheduled job",
      },
    ],
  },
  { title: "Messages", rows: [{ key: "newMessages", title: "New messages" }] },
  {
    title: "Reviews & profile",
    rows: [
      { key: "newReviews", title: "New reviews" },
      {
        key: "profileViews",
        title: "Profile views",
        sub: "Weekly summary of who viewed your profile",
      },
    ],
  },
  DELIVERY_GROUP,
];

/** Employer-facing groups: they send requests, so they care about responses. */
const EMPLOYER_GROUPS: Group[] = [
  {
    title: "Hires",
    rows: [
      { key: "jobAccepted", title: "A fundi accepts your request" },
      {
        key: "jobReminders",
        title: "Job reminders",
        sub: "24 hours before a scheduled job",
      },
    ],
  },
  { title: "Messages", rows: [{ key: "newMessages", title: "New messages" }] },
  DELIVERY_GROUP,
];

export default function NotificationsPanel({
  settings,
  role = "worker",
}: {
  settings: WorkerSettings;
  role?: "worker" | "employer";
}) {
  const groups = role === "employer" ? EMPLOYER_GROUPS : WORKER_GROUPS;
  const { error: toastError } = useToastContext();
  const update = useUpdateNotifications();
  const [prefs, setPrefs] = useState<NotificationSettings>(
    settings.notifications,
  );
  const [savedAt, setSavedAt] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  async function toggle(key: Key, next: boolean) {
    const prev = prefs;
    setPrefs({ ...prev, [key]: next });
    try {
      await update.mutateAsync({ [key]: next });
      setSavedAt(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedAt(false), 2000);
    } catch (e) {
      setPrefs(prev);
      toastError(apiError(e, "Could not save notification settings"));
    }
  }

  return (
    <Panel
      id="notifications"
      title="Notifications"
      subtitle="Choose what we notify you about. Changes save automatically."
      action={savedAt ? <SavedPill /> : null}
    >
      <PanelBody>
        {groups.map((group) => (
          <div className="[&+&]:mt-[22px]" key={group.title}>
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-3 mb-1.5">
              {group.title}
            </div>
            {group.rows.map((row) => (
              <ToggleRow
                key={row.key}
                title={row.title}
                sub={row.sub}
                checked={prefs[row.key]}
                onChange={(next) => toggle(row.key, next)}
              />
            ))}
          </div>
        ))}
      </PanelBody>
    </Panel>
  );
}
