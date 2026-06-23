"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Shell from "@/components/dashboard/Shell";
import { useToastContext } from "@/context/ToastContext";
import { useAuth, useChangeEmail, useChangePassword } from "@/features/auth";
import {
  useGetNotifications,
  useGetPrivacy,
  useUpdateNotifications,
  useUpdatePrivacy,
} from "@/features/settings";
import "./settings.css";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

function errMessage(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string } } })?.response
    ?.data?.message;
  return msg || fallback;
}

const NOTIFICATION_TOGGLES = [
  { key: "emailWeeklySummary", title: "Weekly summary", sub: "A weekly digest of your hiring activity." },
  { key: "emailProductUpdates", title: "Product updates", sub: "News and improvements from Fundi." },
];

const PRIVACY_TOGGLES = [
  { key: "profilePublic", title: "Public profile", sub: "Let fundis see your profile." },
  { key: "showPhone", title: "Show phone number", sub: "Display your phone on your profile." },
  { key: "showEmail", title: "Show email", sub: "Display your email on your profile." },
];

export default function EmployerSettingsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";
  const shellUser = { name, initials: initialsOf(name) };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <div className="set">
        <div>
          <div className="set-eyebrow">Account</div>
          <h1 className="set-title">Settings</h1>
        </div>

        <AccountPanel currentEmail={user?.email ?? ""} />
        <TogglePanel
          title="Notifications"
          sub="Choose which emails you’d like to receive."
          toggles={NOTIFICATION_TOGGLES}
          useGet={useGetNotifications}
          useUpdate={useUpdateNotifications}
        />
        <TogglePanel
          title="Privacy"
          sub="Control what others can see."
          toggles={PRIVACY_TOGGLES}
          useGet={useGetPrivacy}
          useUpdate={useUpdatePrivacy}
        />
      </div>
    </Shell>
  );
}

/* ── Account: change email + password ─────────────────────────────────────── */
function AccountPanel({ currentEmail }: { currentEmail: string }) {
  const { success, error: toastError } = useToastContext();
  const changeEmail = useChangeEmail();
  const changePassword = useChangePassword();

  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const submitEmail = async () => {
    if (!newEmail.trim() || !emailPw) return toastError("Enter a new email and your password.");
    try {
      await changeEmail.mutateAsync({ newEmail: newEmail.trim(), currentPassword: emailPw });
      success("Email updated.");
      setNewEmail("");
      setEmailPw("");
    } catch (e) {
      toastError(errMessage(e, "Could not update email."));
    }
  };

  const submitPassword = async () => {
    if (!currentPw || newPw.length < 8)
      return toastError("New password must be at least 8 characters.");
    try {
      await changePassword.mutateAsync({ currentPassword: currentPw, newPassword: newPw });
      success("Password changed.");
      setCurrentPw("");
      setNewPw("");
    } catch (e) {
      toastError(errMessage(e, "Could not change password."));
    }
  };

  return (
    <>
      <section className="set-panel">
        <div className="set-panel-head">
          <div className="set-panel-title">Email</div>
          <div className="set-panel-sub">
            Current: {currentEmail || "—"}
          </div>
        </div>
        <div className="set-panel-body">
          <div className="set-field">
            <label className="set-label" htmlFor="new-email">New email</label>
            <input
              id="new-email"
              type="email"
              className="set-input"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="set-field">
            <label className="set-label" htmlFor="email-pw">Current password</label>
            <input
              id="email-pw"
              type="password"
              className="set-input"
              value={emailPw}
              onChange={(e) => setEmailPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            className="set-btn"
            onClick={submitEmail}
            disabled={changeEmail.isPending}
          >
            {changeEmail.isPending ? "Updating…" : "Update email"}
          </button>
        </div>
      </section>

      <section className="set-panel">
        <div className="set-panel-head">
          <div className="set-panel-title">Password</div>
          <div className="set-panel-sub">Use at least 8 characters.</div>
        </div>
        <div className="set-panel-body">
          <div className="set-field">
            <label className="set-label" htmlFor="cur-pw">Current password</label>
            <input
              id="cur-pw"
              type="password"
              className="set-input"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="set-field">
            <label className="set-label" htmlFor="new-pw">New password</label>
            <input
              id="new-pw"
              type="password"
              className="set-input"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            className="set-btn"
            onClick={submitPassword}
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? "Saving…" : "Change password"}
          </button>
        </div>
      </section>
    </>
  );
}

/* ── Generic toggle panel (notifications / privacy) ───────────────────────── */
function TogglePanel({
  title,
  sub,
  toggles,
  useGet,
  useUpdate,
}: {
  title: string;
  sub: string;
  toggles: { key: string; title: string; sub: string }[];
  useGet: () => { data?: Record<string, unknown>; isLoading: boolean };
  useUpdate: () => {
    mutate: (data: Record<string, boolean>) => void;
    isPending: boolean;
  };
}) {
  const { data, isLoading } = useGet();
  const update = useUpdate();

  return (
    <section className="set-panel">
      <div className="set-panel-head">
        <div className="set-panel-title">{title}</div>
        <div className="set-panel-sub">{sub}</div>
      </div>
      <div className="set-panel-body">
        {isLoading ? (
          <>
            <div className="set-skel" />
            <div className="set-skel" />
          </>
        ) : (
          toggles.map((t) => {
            const checked = !!data?.[t.key];
            return (
              <div key={t.key} className="set-toggle-row">
                <div className="set-toggle-text">
                  <div className="set-toggle-title">{t.title}</div>
                  <div className="set-toggle-sub">{t.sub}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-label={t.title}
                  className={`set-switch${checked ? " on" : ""}`}
                  disabled={update.isPending}
                  onClick={() => update.mutate({ [t.key]: !checked })}
                >
                  <span className="set-switch-dot" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
