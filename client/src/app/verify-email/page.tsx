"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { useToastContext } from "@/context/ToastContext";
import {
  usePendingVerification,
  useResendVerification,
  useVerifyEmail,
} from "@/features/auth";
import { redirectPathForRole } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";

const CODE_TTL = 300;
const RESEND_COOLDOWN = 30;
const BOX_IDS = ["d0", "d1", "d2", "d3", "d4", "d5"];

const LINK_CLASS =
  "text-gold-dark underline underline-offset-2 font-medium hover:text-navy disabled:text-ink-3 disabled:no-underline disabled:cursor-default disabled:pointer-events-none disabled:font-normal";

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: toastError is a fresh ref each render; the ref guard keeps this one-shot
  useEffect(() => {
    if (noSession && !redirectedRef.current) {
      redirectedRef.current = true;
      toastError("Session expired, please register again.");
      router.replace("/register");
    }
  }, [noSession, router]);

  useEffect(() => {
    if (verified) return;
    const t = setInterval(() => {
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [verified]);

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
      const session = await verifyMutation.mutateAsync({ code });
      posthog.capture("email_verified");
      setVerified(true);
      const user = session?.backendUser ?? null;
      const dest = user
        ? user.isProfileComplete
          ? redirectPathForRole(user, session?.backendProfile ?? null)
          : "/onboarding"
        : dashboardFor(pending?.accountType ?? null);
      setTimeout(() => router.push(dest), 1500);
    } catch {
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
    } catch (err) {
      if (
        (err as { response?: { status?: number } })?.response?.status === 409
      ) {
        toastError("Session expired, please register again.");
        router.replace("/register");
        return;
      }
      toastError("Could not resend the code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-cream text-ink font-sans flex flex-col items-center justify-center px-4 pt-10 pb-14">
      <div className="text-center mb-8">
        <Logo href="/" size="lg" />
        <div className="text-sm text-ink-3 mt-1.5">
          Hire skilled workers. Anywhere. Instantly.
        </div>
      </div>

      <div className="bg-white border-[0.5px] border-border rounded-2xl px-8 py-9 w-full max-w-[420px] shadow-[0_4px_24px_rgba(13,27,42,0.05)]">
        {verified ? (
          <>
            <span className="w-14 h-14 rounded-[14px] bg-green-50 border border-green-600 flex items-center justify-center mx-auto mb-5 [&_svg]:w-[26px] [&_svg]:h-[26px] [&_svg]:stroke-green-600 [&_svg]:fill-none [&_svg]:[stroke-width:2] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="8 12 11 15 16 9" />
              </svg>
            </span>
            <div className="font-serif text-[22px] font-normal text-navy text-center mb-2">
              Email verified!
            </div>
            <p className="text-sm text-ink-3 text-center mb-6 leading-relaxed">
              Your account is ready. Taking you to your dashboard…
            </p>
            <div className="flex justify-center">
              <span className="w-[15px] h-[15px] rounded-full border-2 border-green-600/25 border-t-green-600 animate-spin" />
            </div>
          </>
        ) : checking || !pending ? (
          <p className="text-sm text-ink-3 text-center py-6">Loading…</p>
        ) : (
          <>
            <span className="w-14 h-14 rounded-[14px] bg-gold-light border border-gold flex items-center justify-center mx-auto mb-5 [&_svg]:w-[26px] [&_svg]:h-[26px] [&_svg]:stroke-gold-dark [&_svg]:fill-none [&_svg]:[stroke-width:1.6] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <div className="font-serif text-[22px] font-normal text-navy text-center mb-2">
              Verify your email
            </div>
            <p className="text-sm text-ink-3 text-center mb-6 leading-relaxed">
              We sent a 6-digit code to{" "}
              <strong className="text-ink-2 font-semibold">
                {pending.emailMasked}
              </strong>
              . Enter it below to confirm your account.
            </p>

            <div
              className={cn(
                "flex gap-2 justify-center my-1",
                shake && "animate-pulse",
              )}
            >
              {BOX_IDS.map((id, i) => (
                <input
                  key={id}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  className={cn(
                    "w-[46px] h-[54px] border-[1.5px] rounded-[10px] text-[22px] font-medium text-center text-ink outline-none transition-all focus:border-gold focus:bg-white focus:ring-3 focus:ring-gold/12",
                    digits[i]
                      ? "border-gold bg-gold-light"
                      : "border-border bg-cream",
                  )}
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

            {errorMsg && (
              <div className="text-sm text-red-600 mt-2.5 text-center">
                {errorMsg}
              </div>
            )}

            <div className="text-sm text-ink-3 text-center mt-4">
              {expired ? (
                <>
                  Code expired.{" "}
                  <button
                    type="button"
                    className={LINK_CLASS}
                    onClick={onResend}
                    disabled={resendMutation.isPending}
                  >
                    Resend code
                  </button>
                </>
              ) : (
                <>
                  Code expires in{" "}
                  <b className="text-gold-dark font-semibold tabular-nums">
                    {formatTime(expiresIn)}
                  </b>
                </>
              )}
            </div>

            <button
              type="button"
              className="w-full mt-5 py-[13px] rounded-[10px] text-sm font-semibold bg-gold text-navy flex items-center justify-center gap-2 transition-all enabled:hover:bg-gold-dark disabled:bg-border disabled:text-ink-3 disabled:cursor-not-allowed"
              onClick={onVerify}
              disabled={!complete || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <span className="w-[15px] h-[15px] rounded-full border-2 border-navy/25 border-t-navy animate-spin" />{" "}
                  Verifying…
                </>
              ) : (
                "Verify email"
              )}
            </button>

            <div className="text-sm text-ink-3 text-center mt-[18px]">
              {resendIn > 0 ? (
                <>Didn’t get the code? Resend in {resendIn}s</>
              ) : (
                <>
                  Didn’t get the code?{" "}
                  <button
                    type="button"
                    className={LINK_CLASS}
                    onClick={onResend}
                    disabled={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? "Sending…" : "Resend code"}
                  </button>
                </>
              )}
            </div>

            <p className="text-[11px] text-ink-3 italic text-center mt-3.5">
              Check your spam folder if you don’t see it.
            </p>

            <div className="text-center mt-5">
              <Link
                href="/register"
                className="text-sm text-ink-3 no-underline hover:text-ink-2"
              >
                ← Wrong email? Go back
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-ink-3">
        <span>© 2026 Tesilix</span>
        <span>·</span>
        <Link
          href="/privacy"
          className="text-ink-3 no-underline hover:text-ink-2"
        >
          Privacy
        </Link>
        <span>·</span>
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
