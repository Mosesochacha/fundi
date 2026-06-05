"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import { accountStepSchema } from "@/lib/validations/auth";
import { useRegister } from "@/features/auth";
import "./signup.css";

type AccountType = "employer" | "worker";

const EMPLOYER_TRADES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Cleaning",
  "Masonry",
  "Gardening",
  "Other",
];
const WORKER_TRADES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mason",
  "Welder",
  "Mechanic",
  "Chef",
  "Cleaner",
  "Tailor",
  "AC Tech",
  "Tiler",
  "Gardener",
  "Roofing",
  "Other",
];

const STRENGTH_COLORS = ["#e5e0d5", "#dc2626", "#f59e0b", "#c9a84c", "#16a34a"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

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

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  location: "",
  dailyRate: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const isLoading = register.isPending;
  const { error: toastError } = useToastContext();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [trade, setTrade] = useState<string>("");
  const [interestedTrades, setInterestedTrades] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set =
    (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      if (errors[k]) setErrors((prev) => ({ ...prev, [k]: "" }));
    };

  const score = useMemo(() => passwordScore(form.password), [form.password]);
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const goToStep2 = () => {
    const result = accountStepSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const goToStep3 = () => {
    if (!accountType) {
      toastError("Please choose how you'll use Fundi");
      return;
    }
    setStep(3);
  };

  const toggleInterested = (t: string) =>
    setInterestedTrades((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const submit = async () => {
    const next: Record<string, string> = {};
    if (form.location.trim().length < 2)
      next.location = "Please enter your location";
    if (accountType === "worker" && !trade)
      next.trade = "Please select your main trade";
    if (!agreedToTerms) next.agreedToTerms = "You must agree to continue";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await register.mutateAsync({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        accountType: accountType as AccountType,
        location: form.location.trim(),
        ...(accountType === "worker" ? { trade } : {}),
        ...(accountType === "employer" ? { interestedTrades } : {}),
        ...(accountType === "worker" && form.dailyRate
          ? { dailyRate: Number(form.dailyRate.replace(/[^0-9]/g, "")) }
          : {}),
        agreedToTerms,
      });

      posthog.capture("user_registered", {
        accountType,
        location: form.location,
      });
      setStep(4);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed. Please try again.";
      toastError(message);
    }
  };

  const inputClass = (k: string, extra = "") =>
    `input${errors[k] ? " error" : ""}${extra}`;

  return (
    <div className="su">
      <div className="top">
        <Link href="/" className="logo">
          Fundi<span>.</span>
        </Link>
        <div className="tagline">The skilled worker marketplace for Kenya</div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="card">
        {/* STEP 1 — account */}
        {step === 1 && (
          <div>
            <div className="card-title">
              Create your <em>account</em>
            </div>
            <p className="card-sub">
              Already have an account? <Link href="/login">Sign in →</Link>
            </p>

            <button
              type="button"
              className="btn-google"
              onClick={() => toastError("Google sign-up is coming soon")}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
              >
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

            <div className="divider">or sign up with email</div>

            <div className="field-row">
              <div className="field">
                <span className="label">First name</span>
                <input
                  className={inputClass("firstName")}
                  placeholder="John"
                  value={form.firstName}
                  onChange={set("firstName")}
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <div className="err">{errors.firstName}</div>
                )}
              </div>
              <div className="field">
                <span className="label">Last name</span>
                <input
                  className={inputClass("lastName")}
                  placeholder="Kamau"
                  value={form.lastName}
                  onChange={set("lastName")}
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <div className="err">{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className="field">
              <span className="label">Email address</span>
              <input
                className={inputClass("email")}
                type="email"
                placeholder="john@email.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                inputMode="email"
              />
              {errors.email && <div className="err">{errors.email}</div>}
            </div>

            <div className="field">
              <span className="label">Phone number</span>
              <input
                className={inputClass("phoneNumber")}
                type="tel"
                placeholder="Phone number with country code"
                value={form.phoneNumber}
                onChange={set("phoneNumber")}
                autoComplete="tel"
                inputMode="tel"
              />
              {errors.phoneNumber ? (
                <div className="err">{errors.phoneNumber}</div>
              ) : (
                <div className="hint">
                  Include your country code (e.g. +254, +44, +1). For
                  verification only — never shown publicly.
                </div>
              )}
            </div>

            <div className="field">
              <span className="label">Password</span>
              <div className="pw-wrap">
                <input
                  className={inputClass("password")}
                  type={showPw1 ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set("password")}
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
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
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
                {form.password ? STRENGTH_LABELS[score] : ""}
              </div>
              {errors.password && <div className="err">{errors.password}</div>}
            </div>

            <div className="field">
              <span className="label">Confirm password</span>
              <div className="pw-wrap">
                <input
                  className={inputClass("confirmPassword")}
                  type={showPw2 ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
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
              {errors.confirmPassword && (
                <div className="err">{errors.confirmPassword}</div>
              )}
            </div>

            <div className="btn-row">
              <button type="button" className="btn-next" onClick={goToStep2}>
                Next →
              </button>
            </div>
            <p className="terms">
              By continuing you agree to our <Link href="/terms">Terms</Link>{" "}
              and <Link href="/privacy">Privacy Policy</Link>
            </p>
          </div>
        )}

        {/* STEP 2 — role */}
        {step === 2 && (
          <div>
            <div className="card-title">
              You are a<em>…</em>
            </div>
            <p className="card-sub">
              This helps us personalise your experience
            </p>
            <div className="role-grid">
              <button
                type="button"
                className={`role-card${accountType === "employer" ? " selected" : ""}`}
                onClick={() => setAccountType("employer")}
                aria-pressed={accountType === "employer"}
              >
                <span className="role-card-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    <path d="M2 13h20" />
                  </svg>
                </span>
                <div className="role-card-title">I need a fundi</div>
                <div className="role-card-desc">
                  Hire verified workers for any job
                </div>
              </button>
              <button
                type="button"
                className={`role-card${accountType === "worker" ? " selected" : ""}`}
                onClick={() => setAccountType("worker")}
                aria-pressed={accountType === "worker"}
              >
                <span className="role-card-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </span>
                <div className="role-card-title">I am a fundi</div>
                <div className="role-card-desc">
                  Find jobs and grow your career
                </div>
              </button>
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn-back"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button type="button" className="btn-next" onClick={goToStep3}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — employer */}
        {step === 3 && accountType === "employer" && (
          <div>
            <div className="card-title">
              Where are <em>you based?</em>
            </div>
            <p className="card-sub">We’ll show you fundis near you first</p>
            <div className="field">
              <span className="label">Your location</span>
              <input
                className={inputClass("location")}
                placeholder="e.g. Westlands, Nairobi"
                value={form.location}
                onChange={set("location")}
              />
              {errors.location && <div className="err">{errors.location}</div>}
            </div>
            <div className="field">
              <span className="label">
                What kind of work do you usually need?
              </span>
              <div className="trade-grid">
                {EMPLOYER_TRADES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`trade-pill${interestedTrades.includes(t) ? " selected" : ""}`}
                    onClick={() => toggleInterested(t)}
                    aria-pressed={interestedTrades.includes(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="hint" style={{ marginTop: 8 }}>
                Select all that apply
              </div>
            </div>
            <div className="field">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms">Terms &amp; Conditions</Link> and{" "}
                  <Link href="/privacy">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreedToTerms && (
                <div className="err">{errors.agreedToTerms}</div>
              )}
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn-back"
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn-next"
                onClick={submit}
                disabled={isLoading}
              >
                {isLoading ? "Creating…" : "Create account →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — worker */}
        {step === 3 && accountType === "worker" && (
          <div>
            <div className="card-title">
              Your <em>trade &amp; location</em>
            </div>
            <p className="card-sub">Help employers find you faster</p>
            <div className="field">
              <span className="label">Your location</span>
              <input
                className={inputClass("location")}
                placeholder="e.g. Westlands, Nairobi"
                value={form.location}
                onChange={set("location")}
              />
              {errors.location && <div className="err">{errors.location}</div>}
            </div>
            <div className="field">
              <span className="label">Your main trade</span>
              <div className="trade-grid">
                {WORKER_TRADES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`trade-pill${trade === t ? " selected" : ""}`}
                    onClick={() => {
                      setTrade(t);
                      if (errors.trade) setErrors((p) => ({ ...p, trade: "" }));
                    }}
                    aria-pressed={trade === t}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.trade && <div className="err">{errors.trade}</div>}
            </div>
            <div className="field">
              <span className="label">Daily rate (optional)</span>
              <input
                className={inputClass("dailyRate")}
                placeholder="e.g. KSh 2,500"
                value={form.dailyRate}
                onChange={set("dailyRate")}
                inputMode="numeric"
              />
              <div className="hint">
                You can update this anytime on your profile
              </div>
            </div>
            <div className="field">
              <label className="check-item">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms">Terms &amp; Conditions</Link> and{" "}
                  <Link href="/privacy">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreedToTerms && (
                <div className="err">{errors.agreedToTerms}</div>
              )}
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn-back"
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                type="button"
                className="btn-next"
                onClick={submit}
                disabled={isLoading}
              >
                {isLoading ? "Creating…" : "Create my profile →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — success */}
        {step === 4 && (
          <div className="success-wrap">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="card-title" style={{ textAlign: "center" }}>
              You’re on <em>Fundi!</em>
            </div>
            <p className="success-msg">
              {accountType === "employer"
                ? "Your account is ready. Let’s find you a great fundi."
                : "Your profile is live. Employers can now find you."}
              <br />
              <span style={{ color: "var(--ink3)", fontSize: 13 }}>
                First, verify your email to secure your account.
              </span>
            </p>
            <button
              type="button"
              className="btn-next"
              style={{ width: "100%" }}
              onClick={() =>
                router.push(
                  `/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}&accountType=${accountType ?? "worker"}`,
                )
              }
            >
              Go to dashboard →
            </button>
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
