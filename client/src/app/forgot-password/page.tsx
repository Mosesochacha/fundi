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
import { cn } from "@/lib/utils";

const STRENGTH_COLORS = ["#e5e0d5", "#dc2626", "#f59e0b", "#c9a84c", "#16a34a"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const OTP_IDS = ["otp-0", "otp-1", "otp-2", "otp-3"];
const SEG_IDS = ["seg-1", "seg-2", "seg-3", "seg-4"];

const LABEL_CLASS =
  "block text-xs font-medium text-ink-2 mb-1.5 tracking-[0.02em]";
const ERR_CLASS = "text-xs text-red-600 mt-1.5";
const LINK_CLASS =
  "text-xs text-gold-dark underline underline-offset-2 hover:text-navy disabled:opacity-45 disabled:cursor-default disabled:pointer-events-none";
const BTN_CLASS =
  "w-full mt-5 py-3 rounded-md text-sm font-medium bg-gold text-navy transition-all hover:bg-gold-dark disabled:opacity-60 disabled:cursor-not-allowed";
const ICON_WRAP =
  "w-14 h-14 rounded-full bg-gold-light flex items-center justify-center mx-auto mb-4 [&_svg]:w-[26px] [&_svg]:h-[26px] [&_svg]:stroke-gold-dark [&_svg]:fill-none [&_svg]:[stroke-width:1.6] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]";

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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-[15px] h-[15px] stroke-current fill-none [stroke-width:1.5]"
    >
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

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full px-3.5 py-2.5 border rounded-md text-sm bg-cream text-ink outline-none transition-all placeholder:text-ink-3 focus:border-gold focus:bg-white",
      hasError ? "border-red-600 bg-red-50" : "border-border",
    );

  // ── Screen 1 — request reset ──────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setIdentifierError("Please enter your email or phone number");
      return;
    }
    try {
      await forgotPasswordMutation.mutateAsync({
        identifier: identifier.trim(),
      });
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
    <div className="min-h-screen bg-cream text-ink font-sans flex flex-col items-center justify-center px-4 pt-10 pb-14">
      <div className="text-center mb-6">
        <Link
          href="/"
          className="font-serif text-[22px] font-medium text-navy no-underline"
        >
          Tesilix<span className="italic text-gold font-light">.</span>
        </Link>
        <div className="text-xs text-ink-3 mt-0.5">
          The global skilled worker marketplace
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-8 w-full max-w-[400px]">
        {/* SCREEN 1 — request reset */}
        {screen === 1 && (
          <form onSubmit={handleSend} noValidate>
            <span className={ICON_WRAP}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <div className="font-serif text-[24px] font-normal text-navy text-center mb-1.5">
              Forgot your{" "}
              <em className="italic font-light text-gold-dark">password?</em>
            </div>
            <p className="text-[13px] text-ink-3 text-center mb-6 leading-relaxed">
              No worries. Enter your email or phone and we’ll send you a reset
              code.
            </p>

            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="fp-identifier">
                Email or phone number
              </label>
              <input
                id="fp-identifier"
                className={inputClass(!!identifierError)}
                placeholder="john@email.com or +254 7XX XXX XXX"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (identifierError) setIdentifierError("");
                }}
                autoComplete="username"
              />
              {identifierError && (
                <div className={ERR_CLASS}>{identifierError}</div>
              )}
            </div>

            <button type="submit" className={BTN_CLASS} disabled={sending}>
              {sending ? "Sending…" : "Send reset code"}
            </button>

            <p className="text-center mt-4 text-[13px] text-ink-3">
              Remember your password?{" "}
              <Link href="/login" className={LINK_CLASS}>
                Sign in →
              </Link>
            </p>
          </form>
        )}

        {/* SCREEN 2 — OTP verification */}
        {screen === 2 && (
          <div>
            <span className={ICON_WRAP}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M10 18h4" />
              </svg>
            </span>
            <div className="font-serif text-[24px] font-normal text-navy text-center mb-1.5">
              Enter the{" "}
              <em className="italic font-light text-gold-dark">code</em>
            </div>
            <p className="text-[13px] text-ink-3 text-center mb-6 leading-relaxed">
              {isEmail
                ? "We sent a 4-digit code to your email. Enter it below."
                : "We sent a 4-digit code to your phone number. Enter it below."}
            </p>

            <div className="flex gap-2.5 justify-center mt-2 mb-1">
              {OTP_IDS.map((id, i) => (
                <input
                  key={id}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  className={cn(
                    "w-[52px] h-14 border rounded-lg text-[22px] text-center text-ink bg-cream outline-none transition-all focus:border-gold focus:bg-white",
                    otp[i] ? "border-gold bg-gold-light" : "border-border",
                  )}
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i]}
                  aria-label={`Digit ${i + 1}`}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                />
              ))}
            </div>
            {otpError && (
              <div className="text-xs text-red-600 mt-2 text-center">
                {otpError}
              </div>
            )}

            <div className="text-xs text-ink-3 text-center mt-3.5">
              Didn’t get it?{" "}
              <button
                type="button"
                className={LINK_CLASS}
                onClick={handleResend}
                disabled={resendLeft > 0}
              >
                Resend code{resendLeft > 0 ? ` (${resendLeft}s)` : ""}
              </button>
            </div>

            <button
              type="button"
              className={BTN_CLASS}
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? "Verifying…" : "Verify code"}
            </button>

            <p className="text-center mt-4 text-[13px] text-ink-3">
              <button
                type="button"
                className={LINK_CLASS}
                onClick={() => goToScreen(1)}
              >
                ← Change email / phone
              </button>
            </p>
          </div>
        )}

        {/* SCREEN 3 — set new password */}
        {screen === 3 && (
          <form onSubmit={handleReset} noValidate>
            <span className={ICON_WRAP}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <div className="font-serif text-[24px] font-normal text-navy text-center mb-1.5">
              Set new{" "}
              <em className="italic font-light text-gold-dark">password</em>
            </div>
            <p className="text-[13px] text-ink-3 text-center mb-6 leading-relaxed">
              Choose a strong password you haven’t used before.
            </p>

            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="fp-new">
                New password
              </label>
              <div className="relative">
                <input
                  id="fp-new"
                  className={cn(inputClass(!!pwError), "pr-[42px]")}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 leading-none"
                  onClick={() => setShowPw1((s) => !s)}
                  aria-label={showPw1 ? "Hide password" : "Show password"}
                >
                  <EyeIcon />
                </button>
              </div>
              <div className="flex gap-1 mt-1.5">
                {SEG_IDS.map((id, i) => (
                  <div
                    key={id}
                    className="h-[3px] flex-1 rounded-sm transition-colors duration-300"
                    style={{
                      background:
                        i < score ? STRENGTH_COLORS[score] : "#e5e0d5",
                    }}
                  />
                ))}
              </div>
              <div
                className="text-[11px] mt-1 min-h-[14px]"
                style={{ color: STRENGTH_COLORS[score] }}
              >
                {newPassword ? STRENGTH_LABELS[score] : ""}
              </div>
              {pwError && <div className={ERR_CLASS}>{pwError}</div>}
            </div>

            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="fp-confirm">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="fp-confirm"
                  className={cn(inputClass(!!confirmError), "pr-[42px]")}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 leading-none"
                  onClick={() => setShowPw2((s) => !s)}
                  aria-label={showPw2 ? "Hide password" : "Show password"}
                >
                  <EyeIcon />
                </button>
              </div>
              {confirmError && <div className={ERR_CLASS}>{confirmError}</div>}
            </div>

            <button type="submit" className={BTN_CLASS} disabled={resetting}>
              {resetting ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}

        {/* SCREEN 4 — success */}
        {screen === 4 && (
          <div>
            <span
              className={cn(
                ICON_WRAP,
                "bg-green-50 [&_svg]:stroke-green-600 [&_svg]:[stroke-width:2]",
              )}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div className="font-serif text-[24px] font-normal text-navy text-center mb-1.5">
              Password{" "}
              <em className="italic font-light text-gold-dark">reset!</em>
            </div>
            <p className="text-[13px] text-ink-3 text-center mb-6 leading-relaxed">
              Your password has been updated. You can now sign in with your new
              password.
            </p>
            <Link
              href="/login"
              className={cn(BTN_CLASS, "block text-center no-underline")}
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>

      <div className="mt-7 flex items-center justify-center gap-3.5 text-[11px] text-ink-3">
        <span>© 2026 Tesilix</span>
        <Link
          href="/privacy"
          className="text-ink-3 no-underline hover:text-ink-2"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="text-ink-3 no-underline hover:text-ink-2"
        >
          Terms
        </Link>
      </div>
    </div>
  );
}
