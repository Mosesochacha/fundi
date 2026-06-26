"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button, Input } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import { useGoogleAuth, useLogin, useStartVerification } from "@/features/auth";
import { dashboardPathForRole, redirectPathForRole } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";

const ATTEMPTS_KEY = "fundi_login_attempts";
const LOCKED_KEY = "fundi_login_locked_until";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

function getRemainingLockSeconds(): number {
  if (typeof window === "undefined") return 0;
  const until = Number(localStorage.getItem(LOCKED_KEY) ?? 0);
  const remaining = Math.ceil((until - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * The `?next=` param set by middleware, but only when it's a safe same-site
 * relative path. Rejects absolute URLs and protocol-relative `//host` to
 * prevent open redirects. Read from the URL directly (in handlers) so the page
 * needn't be wrapped in a Suspense boundary for `useSearchParams`.
 */
function getSafeNext(): string | null {
  if (typeof window === "undefined") return null;
  const n = new URLSearchParams(window.location.search).get("next");
  return n?.startsWith("/") && !n.startsWith("//") ? n : null;
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

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useLogin();
  const { googleSignIn, isLoading: googleLoading } = useGoogleAuth();
  const startVerification = useStartVerification();
  const { error: toastError, success, warning } = useToastContext();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    setLockSecondsLeft(getRemainingLockSeconds());
    const interval = setInterval(() => {
      const r = getRemainingLockSeconds();
      setLockSecondsLeft(r);
      if (r === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLock = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSecondsLeft > 0) return;

    const nextErrors: typeof errors = {};
    if (!identifier.trim())
      nextErrors.identifier = "Please enter your email or phone number";
    if (!password) nextErrors.password = "Please enter your password";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const session = await login(identifier.trim(), password);
      const user = session?.backendUser ?? null;
      const profile = session?.backendProfile ?? null;
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKED_KEY);
      setUnverifiedEmail(null);
      if (user && !user.isProfileComplete) {
        router.push("/onboarding");
      } else {
        success("Welcome back!");
        router.push(
          getSafeNext() ??
            (user
              ? redirectPathForRole(user, profile)
              : dashboardPathForRole(undefined)),
        );
      }
    } catch {
      const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(attempts));

      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCK_DURATION_MS;
        localStorage.setItem(LOCKED_KEY, String(lockedUntil));
        setLockSecondsLeft(Math.ceil(LOCK_DURATION_MS / 1000));
        toastError("Too many failed attempts. Please wait 5 minutes.");
        return;
      }

      const remaining = MAX_ATTEMPTS - attempts;
      if (remaining <= 2) {
        warning(
          `${remaining} attempt${remaining === 1 ? "" : "s"} remaining before temporary lockout.`,
        );
      }

      setUnverifiedEmail(
        identifier.includes("@") ? identifier.trim().toLowerCase() : null,
      );
      toastError(
        "Incorrect email/phone or password. If you just signed up, verify your email first.",
      );
    }
  };

  const onGoogle = async () => {
    try {
      const session = await googleSignIn();
      if (!session) return;
      const user = session.backendUser ?? null;
      const profile = session.backendProfile ?? null;
      if (user && !user.isProfileComplete) {
        router.push("/onboarding");
      } else {
        success("Welcome back!");
        router.push(
          getSafeNext() ??
            (user
              ? redirectPathForRole(user, profile)
              : dashboardPathForRole(undefined)),
        );
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  const clearError = (field: "identifier" | "password") => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onVerifyEmail = async () => {
    if (!unverifiedEmail) return;
    try {
      await startVerification.mutateAsync({ identifier: unverifiedEmail });
    } catch {}
    router.push("/verify-email");
  };

  const locked = lockSecondsLeft > 0;

  return (
    <div className="min-h-screen bg-cream text-ink font-sans flex flex-col items-center justify-center px-4 pt-10 pb-14">
      <div className="text-center mb-6">
        <Logo href="/" size="md" />
        <div className="text-sm text-ink-3 mt-0.5">
          The global skilled worker marketplace
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-8 w-full max-w-[400px]">
        <div className="font-serif text-[26px] font-normal text-navy mb-1">
          Welcome <em className="italic font-light text-gold-dark">back</em>
        </div>
        <p className="text-sm text-ink-3 mb-6 leading-normal">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-gold-dark font-medium no-underline hover:text-navy"
          >
            Create one free →
          </Link>
        </p>

        {locked && (
          <div className="rounded-lg px-3.5 py-3 text-sm leading-normal mb-4 bg-red-50 border border-red-600/25 text-red-700">
            Account locked. Try again in{" "}
            <strong className="font-semibold">
              {formatLock(lockSecondsLeft)}
            </strong>
          </div>
        )}

        {unverifiedEmail && (
          <div className="rounded-lg px-3.5 py-3 text-sm leading-normal mb-4 bg-gold-light border border-gold/30 text-gold-dark">
            Your email isn’t verified yet.{" "}
            <button
              type="button"
              onClick={onVerifyEmail}
              disabled={startVerification.isPending}
              className="text-gold-dark font-semibold underline underline-offset-2 disabled:opacity-60 disabled:cursor-default"
            >
              {startVerification.isPending
                ? "Sending code…"
                : "Enter verification code →"}
            </button>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full bg-white"
          onClick={onGoogle}
          disabled={googleLoading || locked}
          icon={
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          }
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-4 text-sm text-ink-3 before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
          or
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <Input
              id="identifier"
              label="Email or phone number"
              placeholder="Email or phone (with country code)"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                clearError("identifier");
              }}
              autoComplete="username"
              disabled={locked}
              error={errors.identifier}
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-sm font-medium text-ink-2 mb-1.5 tracking-[0.02em]"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className={cn(
                  "w-full pl-3.5 pr-[42px] py-2.5 border rounded-lg text-sm bg-cream text-ink font-sans outline-none transition-all placeholder:text-ink-3 focus:border-gold focus:bg-white",
                  errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-border",
                )}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                autoComplete="current-password"
                disabled={locked}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 leading-none"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <EyeIcon />
              </button>
            </div>
            {errors.password && (
              <div className="text-sm text-red-600 mt-1.5">
                {errors.password}
              </div>
            )}
            <div className="flex justify-end mt-2">
              <Link
                href="/forgot-password"
                className="text-sm text-gold-dark underline underline-offset-2 hover:text-navy"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            className="w-full mt-5"
            disabled={isLoading || locked}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-[11px] text-ink-3 text-center mt-3.5 leading-relaxed">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="text-gold-dark no-underline hover:text-navy"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-gold-dark no-underline hover:text-navy"
          >
            Privacy Policy
          </Link>
        </p>
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
