"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  useForgotPassword,
  useResendOtp,
  useResetPassword,
  useVerifyOtp,
} from "@/features/auth";
import "./forgot.css";

const STRENGTH_COLORS = ["#e5e0d5", "#dc2626", "#f59e0b", "#c9a84c", "#16a34a"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const OTP_IDS = ["otp-0", "otp-1", "otp-2", "otp-3"];
const SEG_IDS = ["seg-1", "seg-2", "seg-3", "seg-4"];

function passwordScore(v: string): number {
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  return score;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const { error: toastError, success } = useToastContext();
  const forgotPasswordMutation = useForgotPassword();
  const sending = forgotPasswordMutation.isPending;
  const resendOtpMutation = useResendOtp();
  const verifyOtpMutation = useVerifyOtp();
  const verifying = verifyOtpMutation.isPending;
  const resetPasswordMutation = useResetPassword();
  const resetting = resetPasswordMutation.isPending;

  const [screen, setScreen] = useState<1 | 2 | 3 | 4>(1);

  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState("");

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendLeft, setResendLeft] = useState(0);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [pwError, setPwError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const isEmail = identifier.includes("@");
  const score = passwordScore(newPassword);

  // Scroll to top on every screen change.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Resend countdown tick.
  useEffect(() => {
    if (resendLeft <= 0) return;
    const t = setTimeout(() => setResendLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendLeft]);

  const goToScreen = (n: 1 | 2 | 3 | 4) => {
    setScreen(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Screen 1 — request reset ──────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setIdentifierError("Please enter your email or phone number");
      return;
    }
    try {
      await forgotPasswordMutation.mutateAsync({ identifier: identifier.trim() });
      setOtp(["", "", "", ""]);
      setOtpError("");
      setResendLeft(30);
      goToScreen(2);
    } catch {
      toastError("Something went wrong. Please try again.");
    }
  };

  // ── Screen 2 — OTP ────────────────────────────────────────────────────────
  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (otpError) setOtpError("");
    if (digit && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const onOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendLeft > 0) return;
    try {
      await resendOtpMutation.mutateAsync({ identifier: identifier.trim() });
      success("A new code has been sent.");
      setResendLeft(30);
    } catch {
      toastError("Could not resend the code. Please try again.");
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 4) {
      setOtpError("Enter the 4-digit code");
      return;
    }
    try {
      await verifyOtpMutation.mutateAsync({
        identifier: identifier.trim(),
        otp: code,
      });
      goToScreen(3);
    } catch {
      setOtpError("Invalid code. Please try again.");
    }
  };

  // ── Screen 3 — new password ───────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    let ok = true;
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      ok = false;
    } else {
      setPwError("");
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      ok = false;
    } else {
      setConfirmError("");
    }
    if (!ok) return;

    try {
      await resetPasswordMutation.mutateAsync({
        identifier: identifier.trim(),
        otp: otp.join(""),
        newPassword,
      });
      goToScreen(4);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not reset your password. Please try again.";
      toastError(message);
    }
  };

  return (
    <div className="fp">
      <div className="top">
        <Link href="/" className="logo">
          Fundi<span>.</span>
        </Link>
        <div className="tagline">The global skilled worker marketplace</div>
      </div>

      <div className="card">
        {/* SCREEN 1 — request reset */}
        {screen === 1 && (
          <form className="screen" onSubmit={handleSend} noValidate>
            <span className="icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <div className="card-title">
              Forgot your <em>password?</em>
            </div>
            <p className="card-sub">
              No worries. Enter your email or phone and we’ll send you a reset
              code.
            </p>

            <div className="field">
              <label className="label" htmlFor="fp-identifier">
                Email or phone number
              </label>
              <input
                id="fp-identifier"
                className={`input${identifierError ? " error" : ""}`}
                placeholder="john@email.com or +254 7XX XXX XXX"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (identifierError) setIdentifierError("");
                }}
                autoComplete="username"
              />
              {identifierError && <div className="err">{identifierError}</div>}
            </div>

            <button type="submit" className="btn" disabled={sending}>
              {sending ? "Sending…" : "Send reset code"}
            </button>

            <p className="below">
              Remember your password?{" "}
              <Link href="/login" className="link">
                Sign in →
              </Link>
            </p>
          </form>
        )}

        {/* SCREEN 2 — OTP verification */}
        {screen === 2 && (
          <div className="screen">
            <span className="icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M10 18h4" />
              </svg>
            </span>
            <div className="card-title">
              Enter the <em>code</em>
            </div>
            <p className="card-sub">
              {isEmail
                ? "We sent a 4-digit code to your email. Enter it below."
                : "We sent a 4-digit code to your phone number. Enter it below."}
            </p>

            <div className="otp-grid">
              {OTP_IDS.map((id, i) => (
                <input
                  key={id}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  className={`otp-box${otp[i] ? " filled" : ""}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i]}
                  aria-label={`Digit ${i + 1}`}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                />
              ))}
            </div>
            {otpError && <div className="otp-err">{otpError}</div>}

            <div className="resend">
              Didn’t get it?{" "}
              <button
                type="button"
                className="link"
                onClick={handleResend}
                disabled={resendLeft > 0}
              >
                Resend code{resendLeft > 0 ? ` (${resendLeft}s)` : ""}
              </button>
            </div>

            <button
              type="button"
              className="btn"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? "Verifying…" : "Verify code"}
            </button>

            <p className="below">
              <button
                type="button"
                className="link"
                onClick={() => goToScreen(1)}
              >
                ← Change email / phone
              </button>
            </p>
          </div>
        )}

        {/* SCREEN 3 — set new password */}
        {screen === 3 && (
          <form className="screen" onSubmit={handleReset} noValidate>
            <span className="icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <div className="card-title">
              Set new <em>password</em>
            </div>
            <p className="card-sub">
              Choose a strong password you haven’t used before.
            </p>

            <div className="field">
              <label className="label" htmlFor="fp-new">
                New password
              </label>
              <div className="pw-wrap">
                <input
                  id="fp-new"
                  className={`input${pwError ? " error" : ""}`}
                  type={showPw1 ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (pwError) setPwError("");
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pw-eye"
                  onClick={() => setShowPw1((s) => !s)}
                  aria-label={showPw1 ? "Hide password" : "Show password"}
                >
                  <EyeIcon />
                </button>
              </div>
              <div className="strength-wrap">
                {SEG_IDS.map((id, i) => (
                  <div
                    key={id}
                    className="strength-seg"
                    style={{
                      background:
                        i < score ? STRENGTH_COLORS[score] : "#e5e0d5",
                    }}
                  />
                ))}
              </div>
              <div
                className="strength-label"
                style={{ color: STRENGTH_COLORS[score] }}
              >
                {newPassword ? STRENGTH_LABELS[score] : ""}
              </div>
              {pwError && <div className="err">{pwError}</div>}
            </div>

            <div className="field">
              <label className="label" htmlFor="fp-confirm">
                Confirm new password
              </label>
              <div className="pw-wrap">
                <input
                  id="fp-confirm"
                  className={`input${confirmError ? " error" : ""}`}
                  type={showPw2 ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError("");
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pw-eye"
                  onClick={() => setShowPw2((s) => !s)}
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                >
                  <EyeIcon />
                </button>
              </div>
              {confirmError && <div className="err">{confirmError}</div>}
            </div>

            <button type="submit" className="btn" disabled={resetting}>
              {resetting ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}

        {/* SCREEN 4 — success */}
        {screen === 4 && (
          <div className="screen">
            <span className="icon success">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div className="card-title">
              Password <em>reset!</em>
            </div>
            <p className="card-sub">
              Your password has been updated. You can now sign in with your new
              password.
            </p>
            <Link
              href="/login"
              className="btn"
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>

      <div className="foot">
        <span>© 2026 Fundi</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </div>
    </div>
  );
}
