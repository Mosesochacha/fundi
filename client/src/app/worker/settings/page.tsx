"use client";

import { AlertTriangle, Bell, Lock, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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

type IconType = ComponentType<{ size?: number | string }>;
type PanelKey =
  | "account"
  | "notifications"
  | "availability"
  | "danger";

const NAV: { key: PanelKey; label: string; icon: IconType; flag?: boolean }[] =
  [
    { key: "account", label: "Account & security", icon: Lock },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "availability", label: "Availability & privacy", icon: Shield },
    { key: "danger", label: "Danger zone", icon: AlertTriangle, flag: true },
  ];

const KEYS = NAV.map((n) => n.key);
const isPanelKey = (v: string): v is PanelKey => (KEYS as string[]).includes(v);

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

  const [active, setActive] = useState<PanelKey>("account");
  const [dirty, setDirty] = useState(false);
  const panelsRef = useRef<HTMLDivElement>(null);

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Worker";
  const shellUser = { name, initials: initialsOf(name) };

  // Sync active panel from the URL hash (initial load, back/forward, deep link).
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (isPanelKey(h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

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

  const go = useCallback(
    (key: PanelKey) => {
      if (key === active) return;
      if (
        dirty &&
        !window.confirm("You have unsaved changes. Leave this section anyway?")
      ) {
        return;
      }
      setDirty(false);
      setActive(key);
      // Reflect in the URL without adding a noisy history entry per click.
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${key}`);
      }
      panelsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [active, dirty],
  );

  // Reset the dirty flag whenever we switch panels (each panel re-reports it).
  const onDirty = useCallback((d: boolean) => setDirty(d), []);

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="worker" user={shellUser} currentPath={pathname}>
      <div className="ws">
        {/* ── Left navigation ── */}
        <nav className="ws-nav" aria-label="Settings sections">
          <div className="ws-nav-head">Settings</div>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                className={`ws-navitem${active === item.key ? " active" : ""}`}
                onClick={() => go(item.key)}
                aria-current={active === item.key ? "true" : undefined}
              >
                <Icon size={15} />
                <span className="ws-navlabel">{item.label}</span>
                {item.flag && <span className="ws-nav-flag">!</span>}
              </button>
            );
          })}
        </nav>

        {/* Mobile dropdown nav */}
        <select
          className="ws-nav-select"
          value={active}
          onChange={(e) => go(e.target.value as PanelKey)}
          aria-label="Settings section"
        >
          {NAV.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>

        {/* ── Right panels ── */}
        <div className="ws-panels" ref={panelsRef}>
          {isLoading ? (
            <PanelSkeleton />
          ) : active === "account" ? (
            <AccountPanel settings={settings} />
          ) : active === "notifications" ? (
            <NotificationsPanel settings={settings} />
          ) : active === "availability" ? (
            <AvailabilityPrivacyPanel settings={settings} onDirty={onDirty} />
          ) : (
            <DangerPanel />
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
