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
import "@/app/worker/settings/settings.css";

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
    <div className="ws">
      <div className="ws-pagehead">
        <h1 className="ws-pagetitle">Settings</h1>
        <p className="ws-pagesub">
          Manage your account, notifications
          {isWorker ? ", availability" : ""} and privacy.
        </p>
      </div>

      <div className="ws-panels">
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
function PanelSkeleton() {
  return (
    <div className="ws-panel">
      <div className="ws-panel-head">
        <div className="ws-skel" style={{ width: 140, height: 14 }} />
        <div
          className="ws-skel"
          style={{ width: 220, height: 11, marginTop: 8 }}
        />
      </div>
      <div className="ws-panel-body">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton rows
            key={i}
            style={{ marginBottom: 16 }}
          >
            <div className="ws-skel" style={{ width: 90, height: 11 }} />
            <div
              className="ws-skel"
              style={{ width: "100%", height: 38, marginTop: 6 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
