"use client";

import { CheckCircle, Monitor, Smartphone, XCircle } from "lucide-react";
import { useState } from "react";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsRow from "@/components/settings/SettingsRow";
import SettingsSection from "@/components/settings/SettingsSection";
import Button from "@/components/ui/Button";
import { useToastContext } from "@/context/ToastContext";
import {
  useAuth,
  useChangePassword,
  useGetLoginHistory,
  useGetSessions,
  useRevokeAllSessions,
  useRevokeSession,
  useStartVerification,
} from "@/features/auth";

function strengthLabel(p: string): {
  label: string;
  color: string;
  width: string;
} {
  if (p.length === 0) return { label: "", color: "bg-gray-200", width: "0%" };
  if (p.length < 6)
    return { label: "Too short", color: "bg-red-400", width: "20%" };
  if (p.length < 8)
    return { label: "Weak", color: "bg-orange-400", width: "40%" };
  if (!/[A-Z]/.test(p) || !/[0-9]/.test(p))
    return { label: "Fair", color: "bg-yellow-400", width: "60%" };
  if (!/[^A-Za-z0-9]/.test(p))
    return { label: "Good", color: "bg-blue-400", width: "75%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

function parseAgent(ua: string) {
  if (!ua) return { device: "Unknown", icon: Monitor };
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const browser =
    ua.match(/(Chrome|Firefox|Safari|Edge|Opera|OPR)\//i)?.[1] || "Browser";
  const os = ua.match(/(Windows|Mac OS|Linux|Android|iOS)/i)?.[1] || "OS";
  return {
    device: `${browser} on ${os}`,
    icon: isMobile ? Smartphone : Monitor,
  };
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SecuritySettingsPage() {
  const { success, error } = useToastContext();
  const { user } = useAuth();
  const resendVerification = useStartVerification();
  const resending = resendVerification.isPending;

  const changePassword = useChangePassword();
  const changingPwd = changePassword.isPending;
  const revokeSession = useRevokeSession();
  const revokeAll = useRevokeAllSessions();
  const revokingAll = revokeAll.isPending;
  const { data: sessionsData } = useGetSessions();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { data: historyData } = useGetLoginHistory(showAllHistory ? 30 : 5);

  const [pwdForm, setPwdForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const strength = strengthLabel(pwdForm.next);
  const sessions: any[] = sessionsData ?? [];
  const history: any[] = historyData ?? [];

  const handlePasswordChange = async () => {
    if (!pwdForm.current) {
      error("Enter your current password");
      return;
    }
    if (pwdForm.next.length < 8) {
      error("New password must be at least 8 characters");
      return;
    }
    if (pwdForm.next !== pwdForm.confirm) {
      error("Passwords do not match");
      return;
    }
    try {
      await changePassword.mutateAsync({
        currentPassword: pwdForm.current,
        newPassword: pwdForm.next,
      });
      success("Password updated. Please sign in again.");
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to update password");
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSession.mutateAsync(id);
      success("Session signed out");
    } catch {
      error("Failed to sign out session");
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAll.mutateAsync();
      success("All other sessions signed out");
    } catch {
      error("Failed to sign out sessions");
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-colors";

  return (
    <div className="space-y-6">
      <SettingsHeader title="Security" description="Keep your account safe" />

      {/* Change password */}
      <SettingsSection title="Password">
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Current password
            </label>
            <div className="relative">
              <input
                type={showPwd.current ? "text" : "password"}
                className={`${inputClass} pr-10`}
                value={pwdForm.current}
                onChange={(e) =>
                  setPwdForm((f) => ({ ...f, current: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() =>
                  setShowPwd((s) => ({ ...s, current: !s.current }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showPwd.current ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showPwd.next ? "text" : "password"}
                className={`${inputClass} pr-10`}
                value={pwdForm.next}
                onChange={(e) =>
                  setPwdForm((f) => ({ ...f, next: e.target.value }))
                }
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showPwd.next ? "Hide" : "Show"}
              </button>
            </div>
            {pwdForm.next && (
              <div className="mt-1.5">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{strength.label}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Confirm new password
            </label>
            <input
              type={showPwd.confirm ? "text" : "password"}
              className={inputClass}
              value={pwdForm.confirm}
              onChange={(e) =>
                setPwdForm((f) => ({ ...f, confirm: e.target.value }))
              }
            />
          </div>
          <Button
            onClick={handlePasswordChange}
            loading={changingPwd}
            variant="primary"
          >
            Update password
          </Button>
        </div>
      </SettingsSection>

      {/* Active sessions */}
      <SettingsSection title="Active Sessions">
        <div className="py-2">
          {sessions.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              No active sessions found
            </p>
          )}
          {sessions.map((s: any, i: number) => {
            const { device, icon: DeviceIcon } = parseAgent(s.userAgent || "");
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 py-3.5 ${i < sessions.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <DeviceIcon size={18} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {device}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.ipAddress || "Unknown IP"} · {timeAgo(s.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0"
                >
                  Sign out
                </button>
              </div>
            );
          })}
          {sessions.length > 1 && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={handleRevokeAll}
                disabled={revokingAll}
                className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {revokingAll ? "Signing out..." : "Sign out all other devices"}
              </button>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Login history */}
      <SettingsSection title="Login History">
        <div className="py-2">
          {history.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              No login history
            </p>
          )}
          {history.map((h: any, i: number) => (
            <div
              key={h.id}
              className={`flex items-center gap-3 py-3 ${i < history.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              {h.status === "success" ? (
                <CheckCircle size={16} className="text-green-500 shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">
                  {parseAgent(h.userAgent || "").device}
                </p>
                <p className="text-xs text-gray-400">
                  {h.ipAddress || "Unknown"} · {timeAgo(h.createdAt)}
                </p>
              </div>
              <span
                className={`text-xs font-medium shrink-0 ${h.status === "success" ? "text-green-500" : "text-red-400"}`}
              >
                {h.status === "success" ? "Success" : "Failed"}
              </span>
            </div>
          ))}
          {!showAllHistory && history.length >= 5 && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowAllHistory(true)}
                className="text-sm text-[#f97316] font-medium"
              >
                View all
              </button>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Account status */}
      <SettingsSection title="Account Status">
        <SettingsRow
          label="Email verification"
          description={
            user?.emailVerified
              ? "Your email is verified"
              : "Your email is not yet verified"
          }
          last
        >
          {user?.emailVerified ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Verified
            </span>
          ) : (
            <button
              disabled={resending}
              onClick={async () => {
                if (!user?.email) return;
                try {
                  await resendVerification.mutateAsync({
                    identifier: user.email,
                  });
                  success("Verification email sent — check your inbox");
                } catch {
                  error("Failed to send. Please try again.");
                }
              }}
              className="text-xs font-medium text-[#f97316] hover:text-orange-600 disabled:opacity-50 transition-colors"
            >
              {resending ? "Sending…" : "Resend"}
            </button>
          )}
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
