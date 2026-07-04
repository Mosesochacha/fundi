"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { CurrencySelect } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import { useGoogleAuth, useRegister } from "@/features/auth";
import { redirectPathForRole } from "@/lib/authRedirect";
import { DEFAULT_CURRENCY, symbolOf } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { accountStepSchema } from "@/lib/validations/auth";

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

const STRENGTH_COLORS = [
  "var(--color-border)",
  "#dc2626",
  "#f59e0b",
  "var(--color-gold)",
  "#16a34a",
];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

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

const LABEL_CLASS =
  "block text-sm font-medium text-ink-2 mb-1.5 tracking-[0.02em]";
const HINT_CLASS = "text-[11px] text-ink-3 mt-1";
const ERR_CLASS = "text-[11px] text-red-600 mt-1";
const TERMS_LINK_CLASS = "text-gold-dark no-underline hover:text-navy";

const BTN_NEXT_CLASS =
  "flex-1 py-3 rounded-md text-sm font-medium bg-gold text-navy transition-all hover:bg-gold-dark disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_BACK_CLASS =
  "flex-none px-5 py-[11px] rounded-md text-sm font-medium border border-border bg-transparent text-ink-2 transition-all hover:border-ink-3";

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const isLoading = register.isPending;
  const { googleSignIn, isLoading: googleLoading } = useGoogleAuth();
  const { error: toastError } = useToastContext();
  const { data: session } = useSession();
  const prefillName =
    session?.user?.name ||
    [session?.backendUser?.firstName, session?.backendUser?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "";
  const prefillEmail =
    session?.user?.email || session?.backendUser?.email || "";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [trade, setTrade] = useState<string>("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
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
      toastError("Please choose how you'll use Tesilix");
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
        currency,
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

  const onGoogle = async () => {
    try {
      const session = await googleSignIn();
      if (!session) return;
      const user = session.backendUser ?? null;
      const profile = session.backendProfile ?? null;
      if (!user || !user.isProfileComplete) {
        router.push("/onboarding");
      } else {
        router.push(redirectPathForRole(user, profile));
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  const inputClass = (k: string) =>
    cn(
      "w-full px-3.5 py-2.5 border rounded-md text-sm bg-cream text-ink outline-none transition-all placeholder:text-ink-3 focus:border-gold focus:bg-white",
      errors[k] ? "border-red-600" : "border-border",
    );

  return (
    <main className="min-h-screen bg-cream text-ink font-sans flex flex-col items-center px-4 pt-10 pb-14">
      <div className="text-center mb-6">
        <Logo href="/" size="md" />
        <div className="text-sm text-ink-3 mt-0.5">
          The global skilled worker marketplace
        </div>
      </div>

      <div className="w-full max-w-[420px] h-[3px] bg-border rounded-sm mb-5 overflow-hidden">
        <div
          className="h-full bg-gold rounded-sm transition-[width] duration-[400ms] ease"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white border border-border rounded-xl p-8 w-full max-w-[420px]">
        {step === 1 && (
          <div>
            <div className="font-serif text-[24px] font-normal text-ink mb-1">
              Create your{" "}
              <em className="italic font-light text-gold-dark">account</em>
            </div>
            <p className="text-sm text-ink-3 mb-6 leading-normal">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-gold-dark font-medium no-underline hover:text-navy"
              >
                Sign in →
              </Link>
            </p>

            <button
              type="button"
              className="w-full py-[11px] rounded-md text-sm font-medium border border-border bg-white text-ink flex items-center justify-center gap-2 transition-all hover:border-ink-3 disabled:opacity-60"
              onClick={onGoogle}
              disabled={googleLoading}
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

            <div className="flex items-center gap-3 my-4 text-sm text-ink-3 before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
              or sign up with email
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="mb-4">
                <label className={LABEL_CLASS} htmlFor="reg-firstName">
                  First name
                </label>
                <input
                  id="reg-firstName"
                  className={inputClass("firstName")}
                  placeholder="John"
                  value={form.firstName}
                  onChange={set("firstName")}
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <div className={ERR_CLASS}>{errors.firstName}</div>
                )}
              </div>
              <div className="mb-4">
                <label className={LABEL_CLASS} htmlFor="reg-lastName">
                  Last name
                </label>
                <input
                  id="reg-lastName"
                  className={inputClass("lastName")}
                  placeholder="Kamau"
                  value={form.lastName}
                  onChange={set("lastName")}
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <div className={ERR_CLASS}>{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="reg-email">
                Email address
              </label>
              <input
                id="reg-email"
                className={inputClass("email")}
                type="email"
                placeholder="john@email.com"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
                inputMode="email"
              />
              {errors.email && <div className={ERR_CLASS}>{errors.email}</div>}
            </div>

            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="reg-phone">
                Phone number
              </label>
              <input
                id="reg-phone"
                className={inputClass("phoneNumber")}
                type="tel"
                placeholder="Phone number with country code"
                value={form.phoneNumber}
                onChange={set("phoneNumber")}
                autoComplete="tel"
                inputMode="tel"
              />
              {errors.phoneNumber ? (
                <div className={ERR_CLASS}>{errors.phoneNumber}</div>
              ) : (
                <div className={HINT_CLASS}>
                  Include your country code (e.g. +254, +44, +1). For
                  verification only - never shown publicly.
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  className={cn(inputClass("password"), "pr-[42px]")}
                  type={showPw1 ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set("password")}
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
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[3px] flex-1 rounded-sm transition-colors duration-300"
                    style={{
                      background:
                        i < score
                          ? STRENGTH_COLORS[score]
                          : "var(--color-border)",
                    }}
                  />
                ))}
              </div>
              <div
                className="text-[11px] mt-1 min-h-[14px]"
                style={{ color: STRENGTH_COLORS[score] }}
              >
                {form.password ? STRENGTH_LABELS[score] : ""}
              </div>
              {errors.password && (
                <div className={ERR_CLASS}>{errors.password}</div>
              )}
            </div>

            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="reg-confirm-password">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  className={cn(inputClass("confirmPassword"), "pr-[42px]")}
                  type={showPw2 ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
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
              {errors.confirmPassword && (
                <div className={ERR_CLASS}>{errors.confirmPassword}</div>
              )}
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                className={BTN_NEXT_CLASS}
                onClick={goToStep2}
              >
                Next →
              </button>
            </div>
            <p className="text-[11px] text-ink-3 text-center mt-3.5 leading-relaxed">
              By continuing you agree to our{" "}
              <Link href="/terms" className={TERMS_LINK_CLASS}>
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={TERMS_LINK_CLASS}>
                Privacy Policy
              </Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-serif text-[20px] font-normal text-navy mb-1">
              How will you use Tesilix?
            </h1>
            <p className="text-[12px] text-ink-3 mb-6 leading-normal">
              Choose your role. You can&apos;t change this later.
            </p>
            {session && (
              <div className="flex items-center gap-[11px] bg-cream-2 border border-border rounded-[10px] px-[13px] py-[11px] mb-6">
                <span className="w-[38px] h-[38px] rounded-full bg-gold-light border border-gold/30 text-gold-dark grid place-items-center text-sm font-semibold shrink-0">
                  {initialsOf(prefillName)}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-ink truncate">
                    {prefillName}
                  </span>
                  <span className="text-sm text-ink-3 truncate">
                    {prefillEmail}
                  </span>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 bg-green-50 border border-green-600/25 rounded-full px-[9px] py-[3px] text-[10px] font-semibold text-green-600 whitespace-nowrap shrink-0">
                  <CircleCheck size={11} /> Google verified
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5 mb-2">
              <RoleCard
                selected={accountType === "employer"}
                onClick={() => setAccountType("employer")}
                title="I need a fundi"
                desc="Hire verified workers for any job"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  <path d="M2 13h20" />
                </svg>
              </RoleCard>
              <RoleCard
                selected={accountType === "worker"}
                onClick={() => setAccountType("worker")}
                title="I am a fundi"
                desc="Find jobs and grow your career"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </RoleCard>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                className={BTN_BACK_CLASS}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 py-3 rounded-md text-sm font-medium transition-all",
                  accountType
                    ? "bg-gold text-navy hover:bg-gold-dark cursor-pointer"
                    : "bg-border text-ink-3 cursor-not-allowed",
                )}
                disabled={!accountType}
                onClick={goToStep3}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && accountType === "employer" && (
          <div>
            <div className="font-serif text-[24px] font-normal text-ink mb-1">
              Where are{" "}
              <em className="italic font-light text-gold-dark">you based?</em>
            </div>
            <p className="text-sm text-ink-3 mb-6 leading-normal">
              We’ll show you fundis near you first
            </p>
            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="reg-location">
                Your location
              </label>
              <input
                id="reg-location"
                className={inputClass("location")}
                placeholder="e.g. your city or area"
                value={form.location}
                onChange={set("location")}
              />
              {errors.location && (
                <div className={ERR_CLASS}>{errors.location}</div>
              )}
            </div>
            <div className="mb-4">
              <span className={LABEL_CLASS}>
                What kind of work do you usually need?
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {EMPLOYER_TRADES.map((t) => (
                  <TradePill
                    key={t}
                    selected={interestedTrades.includes(t)}
                    onClick={() => toggleInterested(t)}
                  >
                    {t}
                  </TradePill>
                ))}
              </div>
              <div className={cn(HINT_CLASS, "mt-2")}>
                Select all that apply
              </div>
            </div>
            <TermsCheckbox
              checked={agreedToTerms}
              onChange={setAgreedToTerms}
              error={errors.agreedToTerms}
            />
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                className={BTN_BACK_CLASS}
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                type="button"
                className={BTN_NEXT_CLASS}
                onClick={submit}
                disabled={isLoading}
              >
                {isLoading ? "Creating…" : "Create account →"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && accountType === "worker" && (
          <div>
            <div className="font-serif text-[24px] font-normal text-ink mb-1">
              Your{" "}
              <em className="italic font-light text-gold-dark">
                trade &amp; location
              </em>
            </div>
            <p className="text-sm text-ink-3 mb-6 leading-normal">
              Help employers find you faster
            </p>
            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="reg-location">
                Your location
              </label>
              <input
                id="reg-location"
                className={inputClass("location")}
                placeholder="e.g. your city or area"
                value={form.location}
                onChange={set("location")}
              />
              {errors.location && (
                <div className={ERR_CLASS}>{errors.location}</div>
              )}
            </div>
            <div className="mb-4">
              <span className={LABEL_CLASS}>Your main trade</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {WORKER_TRADES.map((t) => (
                  <TradePill
                    key={t}
                    selected={trade === t}
                    onClick={() => {
                      setTrade(t);
                      if (errors.trade) setErrors((p) => ({ ...p, trade: "" }));
                    }}
                  >
                    {t}
                  </TradePill>
                ))}
              </div>
              {errors.trade && <div className={ERR_CLASS}>{errors.trade}</div>}
            </div>
            <div className="mb-4">
              <label className={LABEL_CLASS} htmlFor="reg-daily-rate">
                Daily rate (optional)
              </label>
              <div className="flex gap-2">
                <div className="w-[150px] shrink-0">
                  <CurrencySelect value={currency} onChange={setCurrency} />
                </div>
                <input
                  id="reg-daily-rate"
                  className={cn(inputClass("dailyRate"), "flex-1")}
                  placeholder={`e.g. ${symbolOf(currency)} 2,500`}
                  value={form.dailyRate}
                  onChange={set("dailyRate")}
                  inputMode="numeric"
                />
              </div>
              <div className={HINT_CLASS}>
                You can update this anytime on your profile
              </div>
            </div>
            <TermsCheckbox
              checked={agreedToTerms}
              onChange={setAgreedToTerms}
              error={errors.agreedToTerms}
            />
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                className={BTN_BACK_CLASS}
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                type="button"
                className={BTN_NEXT_CLASS}
                onClick={submit}
                disabled={isLoading}
              >
                {isLoading ? "Creating…" : "Create my profile →"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-gold-light border-2 border-gold/30 flex items-center justify-center mx-auto mb-5">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="w-7 h-7 stroke-gold-dark fill-none [stroke-width:2]"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="font-serif text-[24px] font-normal text-ink mb-1 text-center">
              You’re on{" "}
              <em className="italic font-light text-gold-dark">Tesilix!</em>
            </div>
            <p className="text-sm text-ink-2 mt-2 mb-7 leading-relaxed">
              {accountType === "employer"
                ? "Your account is ready. Let’s find you a great fundi."
                : "Your profile is live. Employers can now find you."}
              <br />
              <span className="text-ink-3 text-sm">
                First, verify your email to secure your account.
              </span>
            </p>
            <button
              type="button"
              className={cn(BTN_NEXT_CLASS, "w-full")}
              onClick={() => router.push("/verify-email")}
            >
              Verify your email →
            </button>
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
    </main>
  );
}

function RoleCard({
  selected,
  onClick,
  title,
  desc,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full p-5 px-4 border-[1.5px] rounded-[10px] text-center transition-all",
        selected
          ? "border-gold bg-gold-light"
          : "border-border bg-cream hover:border-gold",
      )}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span
        className={cn(
          "w-11 h-11 rounded-[11px] flex items-center justify-center mx-auto mb-3 transition-all border [&_svg]:w-6 [&_svg]:h-6 [&_svg]:fill-none [&_svg]:[stroke-width:1.6] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]",
          selected
            ? "bg-gold/20 border-gold [&_svg]:stroke-gold-dark"
            : "bg-gray-100 border-border [&_svg]:stroke-gray-400",
        )}
      >
        {children}
      </span>
      <div
        className={cn(
          "text-sm font-medium mb-1",
          selected ? "text-gold-dark" : "text-ink",
        )}
      >
        {title}
      </div>
      <div className="text-[11px] text-ink-3 leading-normal">{desc}</div>
    </button>
  );
}

function TradePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "px-3.5 py-[7px] border rounded-[20px] text-sm transition-all select-none",
        selected
          ? "border-gold bg-gold-light text-gold-dark font-medium"
          : "border-border bg-cream text-ink-2 hover:border-gold",
      )}
      onClick={onClick}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}

function TermsCheckbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label className="flex items-start gap-2.5 text-sm text-ink-2 mb-1 cursor-pointer leading-normal">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-[15px] h-[15px] flex-shrink-0 accent-gold"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-gold-dark no-underline">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-gold-dark no-underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {error && <div className={ERR_CLASS}>{error}</div>}
    </div>
  );
}
