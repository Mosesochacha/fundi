"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import {
  DEFAULT_SETTINGS,
  useGetWorkerSettings,
  type WorkerSettings,
} from "@/features/worker/settings";
import AccountPanel from "./_panels/AccountPanel";
import AvailabilityPrivacyPanel from "./_panels/AvailabilityPrivacyPanel";
import DangerPanel from "./_panels/DangerPanel";
import NotificationsPanel from "./_panels/NotificationsPanel";
import "./settings.css";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

export default function WorkerSettingsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data, isLoading } = useGetWorkerSettings();

  const settings: WorkerSettings = data ?? DEFAULT_SETTINGS;

  const [dirty, setDirty] = useState(false);

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Worker";
  const shellUser = { name, initials: initialsOf(name) };

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
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="worker" user={shellUser} currentPath={pathname}>
      <div className="ws">
        <div className="ws-pagehead">
          <h1 className="ws-pagetitle">Settings</h1>
          <p className="ws-pagesub">
            Manage your account, notifications, availability and privacy.
          </p>
        </div>

        <div className="ws-panels">
          {isLoading ? (
            <PanelSkeleton />
          ) : (
            <>
              <AccountPanel settings={settings} />
              <NotificationsPanel settings={settings} />
              <AvailabilityPrivacyPanel settings={settings} onDirty={onDirty} />
              <DangerPanel />
            </>
          )}
        </div>
      </div>
    </Shell>
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
