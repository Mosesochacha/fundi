"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  usePendingVerification,
  useResendVerification,
  useVerifyEmail,
} from "@/features/auth";
import { redirectPathForRole } from "@/lib/authRedirect";
import "./verify.css";

const CODE_TTL = 300; // seconds — code expires after 5:00
const RESEND_COOLDOWN = 30; // seconds before "Resend code" re-enables
const BOX_IDS = ["d0", "d1", "d2", "d3", "d4", "d5"];

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function dashboardFor(accountType: string | null | undefined): string {
  return accountType === "employer"
    ? "/employer/dashboard"
    : "/worker/dashboard";
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const { success, error: toastError } = useToastContext();

  // The email being verified lives in a server session cookie — this fetch
  // returns only a masked version and the account type. A failure means the
  // session expired, so we bounce back to register.
  const {
    data: pending,
    isLoading: checking,
    isError: noSession,
  } = usePendingVerification();

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [expiresIn, setExpiresIn] = useState(CODE_TTL);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN);
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);
  const [verified, setVerified] = useState(false);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const redirectedRef = useRef(false);

  // No valid pending-verification session → send the user back to register.
  // Guarded with a ref so it fires exactly once: the toast helpers are new
  // function refs on every render, so they must not gate this effect (doing so
  // would re-toast + re-navigate in a loop).
  // biome-ignore lint/correctness/useExhaustiveDependencies: toastError is a fresh ref each render; the ref guard keeps this one-shot
  useEffect(() => {
    if (noSession && !redirectedRef.current) {
      redirectedRef.current = true;
      toastError("Session expired, please register again.");
      router.replace("/register");
    }
  }, [noSession, router]);

  // Single ticking clock drives both the expiry countdown and the resend
  // cooldown. Stops once the email is verified.
  useEffect(() => {
    if (verified) return;
    const t = setInterval(() => {
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [verified]);

  // Auto-focus the first box once the session check resolves.
  useEffect(() => {
    if (pending) inputs.current[0]?.focus();
  }, [pending]);

  const code = digits.join("");
  const complete = code.length === 6 && digits.every((d) => d !== "");
  const expired = expiresIn === 0;

  const focusBox = (i: number) => inputs.current[i]?.focus();

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (errorMsg) setErrorMsg("");
    if (digit && index < 5) focusBox(index + 1);
  };

  const onKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusBox(index - 1);
    }
  };

  // Pasting a 6-digit code fills every box at once.
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (errorMsg) setErrorMsg("");
    focusBox(Math.min(text.length, 5));
  };

  const clearBoxes = () => {
    setDigits(["", "", "", "", "", ""]);
    focusBox(0);
  };

  const onVerify = async () => {
    if (!complete || verifyMutation.isPending) return;
    try {
      // A successful verify also establishes the session (auto-login), so we can
      // route straight into the authenticated dashboard.
      const session = await verifyMutation.mutateAsync({ code });
      posthog.capture("email_verified");
      setVerified(true);
      const user = session?.backendUser ?? null;
      const dest = user
        ? user.isOnboarded
          ? redirectPathForRole(user, session?.backendProfile ?? null)
          : "/setup"
        : dashboardFor(pending?.accountType ?? null);
      setTimeout(() => router.push(dest), 1500);
    } catch {
      // The no-session case is already handled on mount; by the time the form is
      // submittable, a failure means the code itself was wrong or expired.
      setErrorMsg("Incorrect code. Try again.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      clearBoxes();
    }
  };

  const onResend = async () => {
    if (resendIn > 0 || resendMutation.isPending) return;
    try {
      await resendMutation.mutateAsync();
      setExpiresIn(CODE_TTL);
      setResendIn(RESEND_COOLDOWN);
      setErrorMsg("");
      clearBoxes();
      success("New code sent");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toastError("Session expired, please register again.");
        router.replace("/register");
        return;
      }
      toastError("Could not resend the code. Please try again.");
    }
  };

  return (
    <div className="ve">
      <div className="top">
        <Link href="/" className="logo">
          Fundi<span>.</span>
        </Link>
        <div className="tagline">
          Hire skilled workers. Anywhere. Instantly.
        </div>
      </div>

      <div className="card">
        {verified ? (
          /* ── Success state ─────────────────────────────────────────────── */
          <>
            <span className="icon success">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="8 12 11 15 16 9" />
              </svg>
            </span>
            <div className="card-title">Email verified!</div>
            <p className="card-sub">
              Your account is ready. Taking you to your dashboard…
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span className="spinner dark" />
            </div>
          </>
        ) : checking || !pending ? (
          /* ── Checking session ──────────────────────────────────────────── */
          <p className="checking">Loading…</p>
        ) : (
          /* ── Verification form ─────────────────────────────────────────── */
          <>
            <span className="icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <div className="card-title">Verify your email</div>
            <p className="card-sub">
              We sent a 6-digit code to <strong>{pending.emailMasked}</strong>.
              Enter it below to confirm your account.
            </p>

            <div className={`otp-grid${shake ? " shake" : ""}`}>
              {BOX_IDS.map((id, i) => (
                <input
                  key={id}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  className={`otp-box${digits[i] ? " filled" : ""}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digits[i]}
                  aria-label={`Digit ${i + 1}`}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  onPaste={onPaste}
                  disabled={verifyMutation.isPending}
                />
              ))}
            </div>

            {errorMsg && <div className="otp-err">{errorMsg}</div>}

            <div className="timer">
              {expired ? (
                <>
                  Code expired.{" "}
                  <button
                    type="button"
                    className="link"
                    onClick={onResend}
                    disabled={resendMutation.isPending}
                  >
                    Resend code
                  </button>
                </>
              ) : (
                <>
                  Code expires in <b>{formatTime(expiresIn)}</b>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn"
              onClick={onVerify}
              disabled={!complete || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <span className="spinner" /> Verifying…
                </>
              ) : (
                "Verify email"
              )}
            </button>

            <div className="resend">
              {resendIn > 0 ? (
                <>Didn’t get the code? Resend in {resendIn}s</>
              ) : (
                <>
                  Didn’t get the code?{" "}
                  <button
                    type="button"
                    className="link"
                    onClick={onResend}
                    disabled={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? "Sending…" : "Resend code"}
                  </button>
                </>
              )}
            </div>

            <p className="hint">Check your spam folder if you don’t see it.</p>

            <div className="back">
              <Link href="/register">← Wrong email? Go back</Link>
            </div>
          </>
        )}
      </div>

      <div className="foot">
        <span>© 2026 Fundi</span>
        <span>·</span>
        <Link href="/privacy">Privacy</Link>
        <span>·</span>
        <Link href="/terms">Terms</Link>
      </div>
    </div>
  );
}
