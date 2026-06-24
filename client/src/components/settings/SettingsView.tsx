"use client";

import { useCallback, useEffect, useState } from "react";
import AccountPanel from "@/app/worker/settings/_panels/AccountPanel";
import AvailabilityPrivacyPanel from "@/app/worker/settings/_panels/AvailabilityPrivacyPanel";
import DangerPanel from "@/app/worker/settings/_panels/DangerPanel";
import NotificationsPanel from "@/app/worker/settings/_panels/NotificationsPanel";
import {
  DEFAULT_SETTINGS,
  useGetWorkerSettings,
  type WorkerSettings,
} from "@/features/worker/settings";

/**
 * Shared account settings, used by both worker and employer. One component —
 * the only role difference is that the Availability controls are worker-only
 * (employers see just the privacy controls). Account, notifications and the
 * danger zone are identical for everyone.
 */
export default function SettingsView({
  role,
}: {
  role: "worker" | "employer";
}) {
  const { data, isLoading } = useGetWorkerSettings();
  const settings: WorkerSettings = data ?? DEFAULT_SETTINGS;
  const isWorker = role === "worker";

  const [dirty, setDirty] = useState(false);

  // Warn before a full page unload while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const onDirty = useCallback((d: boolean) => setDirty(d), []);

  return (
    <div className="flex flex-col gap-5 font-sans text-ink-2">
      <div className="flex flex-col gap-0.5">
        <h1 className="font-serif text-[26px] font-normal text-ink m-0">
          Settings
        </h1>
        <p className="text-[13px] text-ink-3 m-0">
          Manage your account, notifications
          {isWorker ? ", availability" : ""} and privacy.
        </p>
      </div>

      <div className="min-w-0 flex flex-col gap-5">
        {isLoading ? (
          <PanelSkeleton />
        ) : (
          <>
            <AccountPanel settings={settings} />
            <NotificationsPanel settings={settings} />
            <AvailabilityPrivacyPanel
              settings={settings}
              onDirty={onDirty}
              showAvailability={isWorker}
            />
            <DangerPanel />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Loading skeleton — mirrors a panel's shape ───────────────────────────── */
const SKEL = "bg-border rounded-md animate-pulse";

function PanelSkeleton() {
  return (
    <div className="bg-white border-[0.5px] border-border rounded-xl overflow-hidden">
      <div className="py-4 px-5 border-b-[0.5px] border-border">
        <div className={`${SKEL} w-[140px] h-3.5`} />
        <div className={`${SKEL} w-[220px] h-[11px] mt-2`} />
      </div>
      <div className="p-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows
            key={i}
            className="mb-4"
          >
            <div className={`${SKEL} w-[90px] h-[11px]`} />
            <div className={`${SKEL} w-full h-[38px] mt-1.5`} />
          </div>
        ))}
      </div>
    </div>
  );
}
