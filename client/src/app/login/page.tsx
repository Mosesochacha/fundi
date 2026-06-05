"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useLogin } from "@/features/auth";
import { dashboardPathForRole, redirectPathForRole } from "@/lib/authRedirect";
import "./login.css";

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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useLogin();
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
      if (user && !user.isOnboarded) {
        router.push("/setup");
      } else {
        success("Welcome back!");
        router.push(
          user
            ? redirectPathForRole(user, profile)
            : dashboardPathForRole(undefined),
        );
      }
    } catch {
      // NextAuth credentials only surfaces a generic failure — count the attempt
      // client-side and offer the email-verification path heuristically.
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

  const clearError = (field: "identifier" | "password") => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const locked = lockSecondsLeft > 0;

  return (
    <div className="lg">
      <div className="top">
        <Link href="/" className="logo">
          Fundi<span>.</span>
        </Link>
        <div className="tagline">The global skilled worker marketplace</div>
      </div>

      <div className="card">
        <div className="card-title">
          Welcome <em>back</em>
        </div>
        <p className="card-sub">
          Don’t have an account? <Link href="/register">Create one free →</Link>
        </p>

        {locked && (
          <div className="notice notice-lock">
            Account locked. Try again in{" "}
            <strong>{formatLock(lockSecondsLeft)}</strong>
          </div>
        )}

        {unverifiedEmail && (
          <div className="notice notice-verify">
            Your email isn’t verified yet.{" "}
            <Link
              href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
            >
              Enter verification code →
            </Link>
          </div>
        )}

        <button
          type="button"
          className="btn-google"
          // Role isn't known until the OAuth round-trip finishes, so land on
          // /login — middleware bounces the authenticated user to their
          // role-based dashboard.
          onClick={() => signIn("google", { callbackUrl: "/login" })}
        >
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
          Continue with Google
        </button>

        <div className="divider">or</div>

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="identifier">
              Email or phone number
            </label>
            <input
              id="identifier"
              className={`input${errors.identifier ? " error" : ""}`}
              placeholder="Email or phone (with country code)"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                clearError("identifier");
              }}
              autoComplete="username"
              disabled={locked}
            />
            {errors.identifier && (
              <div className="err">{errors.identifier}</div>
            )}
          </div>

          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="pw-wrap">
              <input
                id="password"
                className={`input${errors.password ? " error" : ""}`}
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
                className="pw-eye"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <EyeIcon />
              </button>
            </div>
            {errors.password && <div className="err">{errors.password}</div>}
            <div className="forgot-row">
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="btn-signin"
            disabled={isLoading || locked}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="terms">
          By continuing you agree to our <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </div>

      <div className="foot">
        <span>© 2026 Fundi</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </div>
    </div>
  );
}
