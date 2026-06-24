"use client";

import { CircleCheck, Home, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/features/auth";
import {
  useEmployerOnboarding,
  useWorkerOnboarding,
} from "@/features/onboarding";
import { dashboardPathForRole, roleForUser } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";

const WORKER_TRADES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mason",
  "House help",
  "Mechanic",
  "Gardener",
  "Welder",
  "Cleaner",
  "AC Tech",
  "Chef",
  "Tiler",
  "Security guard",
];
const EMPLOYER_TRADES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mason",
  "House help",
  "Mechanic",
  "Gardener",
  "Cleaner",
];

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

const FIELD_LABEL =
  "block text-xs font-semibold text-ink-2 tracking-[0.02em] mb-2";
const FIELD_INPUT =
  "w-full px-3.5 py-[11px] border border-border rounded-lg text-sm bg-cream text-ink font-sans outline-none transition-all placeholder:text-ink-3 focus:border-gold focus:bg-white";
const TRADE_PILL_BASE =
  "appearance-none px-[15px] py-2 border rounded-full text-[13px] cursor-pointer font-sans select-none transition-all hover:border-gold";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, isLoading } = useAuth();
  const { error: toastError } = useToastContext();
  const workerOnb = useWorkerOnboarding();
  const employerOnb = useEmployerOnboarding();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"worker" | "employer" | null>(null);
  const [trade, setTrade] = useState("");
  const [wLocation, setWLocation] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [eLocation, setELocation] = useState("");
  const [interested, setInterested] = useState<string[]>([]);
  const [terms, setTerms] = useState(false);

  // Guard: not signed in → login; already complete → dashboard.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (!isLoading && user?.isProfileComplete) {
      router.replace(dashboardPathForRole(roleForUser(user)));
    }
  }, [status, isLoading, user, router]);

  const name = session?.user?.name?.trim() || "there";
  const email = session?.user?.email ?? "";
  const progress = step === 1 ? 50 : 100;
  const saving = workerOnb.isPending || employerOnb.isPending;

  const toggleInterested = (t: string) =>
    setInterested((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  async function submitWorker() {
    try {
      await workerOnb.mutateAsync({
        trade,
        location: wLocation.trim(),
        dailyRate: dailyRate
          ? Number(dailyRate.replace(/[^0-9]/g, ""))
          : undefined,
      });
      // JWT auto-heals in the auth jwt callback (re-pulls /auth/me while the
      // cached user is incomplete), so middleware lets the dashboard through.
      router.push("/worker/dashboard?welcome=true");
    } catch {
      toastError("Could not complete setup. Please try again.");
    }
  }

  async function submitEmployer() {
    try {
      await employerOnb.mutateAsync({
        location: eLocation.trim(),
        interestedTrades: interested,
      });
      router.push("/employer/dashboard?welcome=true");
    } catch {
      toastError("Could not complete setup. Please try again.");
    }
  }

  const workerValid = !!trade && !!wLocation.trim() && terms;
  const employerValid = !!eLocation.trim() && terms;

  const nextBtn =
    "w-full py-3 rounded-lg border-0 text-sm font-semibold font-sans bg-gold text-navy cursor-pointer transition-all hover:bg-gold-dark disabled:bg-border disabled:text-ink-3 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-cream text-ink font-sans flex flex-col items-center px-4 pt-[clamp(32px,7vh,72px)] pb-14">
      <div className="text-center mb-[22px]">
        <span className="font-serif text-2xl font-medium text-navy">
          Tesilix<span className="italic text-gold font-light">.</span>
        </span>
      </div>

      <div className="w-full max-w-[440px] h-[3px] bg-border rounded-[2px] mb-[18px] overflow-hidden">
        <div
          className="h-full bg-gold rounded-[2px] transition-[width] duration-[400ms] ease"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white border border-border rounded-[14px] px-8 pt-[30px] pb-8 w-full max-w-[440px] shadow-[0_6px_24px_-16px_rgba(13,27,42,0.18)]">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.06em] uppercase text-gold-dark mb-4">
          <span>Step {step} of 2</span>
          <span className="text-ink-3 font-medium">
            {step === 1 ? "Almost there" : "Last step"}
          </span>
        </div>

        {/* Prefilled identity from the OAuth session */}
        <div className="flex items-center gap-[11px] bg-cream border border-border rounded-[10px] px-[13px] py-[11px] mb-6">
          <span className="w-[38px] h-[38px] rounded-full bg-gold-light border border-gold/30 text-gold-dark grid place-items-center text-xs font-semibold shrink-0">
            {initialsOf(name)}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-ink truncate">
              {name}
            </span>
            <span className="text-xs text-ink-3 truncate">{email}</span>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 bg-green-50 border border-green-600/25 rounded-full px-[9px] py-[3px] text-[10px] font-semibold text-green-600 whitespace-nowrap shrink-0">
            <CircleCheck size={11} /> Verified
          </span>
        </div>

        {step === 1 && (
          <>
            <h1 className="font-serif text-[25px] font-normal text-navy mb-1.5 leading-[1.15]">
              How will you use Tesilix?
            </h1>
            <p className="text-[13px] text-ink-3 leading-normal mb-[22px]">
              Choose your role — this can&apos;t be changed later.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 max-[380px]:grid-cols-1">
              <button
                type="button"
                className={cn(
                  "group w-full font-sans appearance-none px-4 py-[22px] border-[1.5px] rounded-xl cursor-pointer text-center transition-all hover:border-gold",
                  role === "worker"
                    ? "border-gold bg-gold-light"
                    : "border-border bg-cream",
                )}
                onClick={() => setRole("worker")}
              >
                <span
                  className={cn(
                    "w-[46px] h-[46px] rounded-xl border flex items-center justify-center mx-auto mb-[13px] transition-all [&_svg]:w-[22px] [&_svg]:h-[22px] [&_svg]:stroke-gold-dark [&_svg]:fill-none [&_svg]:[stroke-width:1.6]",
                    role === "worker"
                      ? "bg-white border-gold"
                      : "bg-gold-light border-gold/25",
                  )}
                >
                  <Wrench />
                </span>
                <div
                  className={cn(
                    "text-sm font-semibold mb-1",
                    role === "worker" ? "text-gold-dark" : "text-ink",
                  )}
                >
                  I am a fundi
                </div>
                <div className="text-xs text-ink-3 leading-normal">
                  Offer your skills and find work
                </div>
              </button>
              <button
                type="button"
                className={cn(
                  "group w-full font-sans appearance-none px-4 py-[22px] border-[1.5px] rounded-xl cursor-pointer text-center transition-all hover:border-gold",
                  role === "employer"
                    ? "border-gold bg-gold-light"
                    : "border-border bg-cream",
                )}
                onClick={() => setRole("employer")}
              >
                <span
                  className={cn(
                    "w-[46px] h-[46px] rounded-xl border flex items-center justify-center mx-auto mb-[13px] transition-all [&_svg]:w-[22px] [&_svg]:h-[22px] [&_svg]:stroke-gold-dark [&_svg]:fill-none [&_svg]:[stroke-width:1.6]",
                    role === "employer"
                      ? "bg-white border-gold"
                      : "bg-gold-light border-gold/25",
                  )}
                >
                  <Home />
                </span>
                <div
                  className={cn(
                    "text-sm font-semibold mb-1",
                    role === "employer" ? "text-gold-dark" : "text-ink",
                  )}
                >
                  I need a fundi
                </div>
                <div className="text-xs text-ink-3 leading-normal">
                  Hire skilled workers for jobs
                </div>
              </button>
            </div>

            <button
              type="button"
              className={nextBtn}
              disabled={!role}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && role === "worker" && (
          <>
            <h1 className="font-serif text-[25px] font-normal text-navy mb-1.5 leading-[1.15]">
              Set up your profile
            </h1>
            <p className="text-[13px] text-ink-3 leading-normal mb-[22px]">
              This is what employers see when they search for you.
            </p>

            <div className="mb-[18px]">
              <span className={FIELD_LABEL}>Your trade</span>
              <div className="flex flex-wrap gap-2">
                {WORKER_TRADES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={cn(
                      TRADE_PILL_BASE,
                      trade === t
                        ? "border-gold bg-gold-light text-gold-dark font-medium"
                        : "border-border bg-cream text-ink-2",
                    )}
                    onClick={() => setTrade(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-[18px]">
              <label className={FIELD_LABEL} htmlFor="w-location">
                Location
              </label>
              <input
                id="w-location"
                className={FIELD_INPUT}
                placeholder="e.g. Westlands, Nairobi"
                value={wLocation}
                onChange={(e) => setWLocation(e.target.value)}
              />
            </div>

            <div className="mb-[18px]">
              <label className={FIELD_LABEL} htmlFor="w-rate">
                Daily rate (KSh){" "}
                <span className="font-normal text-ink-3">— optional</span>
              </label>
              <input
                id="w-rate"
                className={FIELD_INPUT}
                inputMode="numeric"
                placeholder="e.g. 2500"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
              />
              <div className="text-[11px] text-ink-3 mt-1.5">
                You can set this later from your profile.
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-[13px] text-ink-2 leading-normal mt-5 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 w-[15px] h-[15px] shrink-0 accent-gold"
              />
              <span>
                I agree to Tesilix&apos;s{" "}
                <a
                  href="/terms"
                  className="text-gold-dark no-underline hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-gold-dark no-underline hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <div className="flex gap-2.5 mt-[22px]">
              <button
                type="button"
                className="shrink-0 px-[22px] py-3 rounded-lg text-sm font-medium font-sans border border-border bg-transparent text-ink-2 cursor-pointer transition-all hover:border-ink-3"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className={cn(nextBtn, "flex-1")}
                disabled={!workerValid || saving}
                onClick={submitWorker}
              >
                {saving ? "Creating…" : "Create account"}
              </button>
            </div>
          </>
        )}

        {step === 2 && role === "employer" && (
          <>
            <h1 className="font-serif text-[25px] font-normal text-navy mb-1.5 leading-[1.15]">
              Tell us what you need
            </h1>
            <p className="text-[13px] text-ink-3 leading-normal mb-[22px]">
              We&apos;ll show you the right fundis for the job.
            </p>

            <div className="mb-[18px]">
              <label className={FIELD_LABEL} htmlFor="e-location">
                Location
              </label>
              <input
                id="e-location"
                className={FIELD_INPUT}
                placeholder="e.g. Kilimani, Nairobi"
                value={eLocation}
                onChange={(e) => setELocation(e.target.value)}
              />
            </div>

            <div className="mb-[18px]">
              <span className={FIELD_LABEL}>
                What do you usually need?{" "}
                <span className="font-normal text-ink-3">— optional</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {EMPLOYER_TRADES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={cn(
                      TRADE_PILL_BASE,
                      interested.includes(t)
                        ? "border-gold bg-gold-light text-gold-dark font-medium"
                        : "border-border bg-cream text-ink-2",
                    )}
                    onClick={() => toggleInterested(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-[13px] text-ink-2 leading-normal mt-5 mb-1 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 w-[15px] h-[15px] shrink-0 accent-gold"
              />
              <span>
                I agree to Tesilix&apos;s{" "}
                <a
                  href="/terms"
                  className="text-gold-dark no-underline hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-gold-dark no-underline hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            <div className="flex gap-2.5 mt-[22px]">
              <button
                type="button"
                className="shrink-0 px-[22px] py-3 rounded-lg text-sm font-medium font-sans border border-border bg-transparent text-ink-2 cursor-pointer transition-all hover:border-ink-3"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className={cn(nextBtn, "flex-1")}
                disabled={!employerValid || saving}
                onClick={submitEmployer}
              >
                {saving ? "Creating…" : "Create account"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-7 flex items-center gap-3.5 text-[11px] text-ink-3">
        <span>© 2026 Tesilix</span>
        <a href="/privacy" className="text-ink-3 no-underline hover:text-ink-2">
          Privacy
        </a>
        <a href="/terms" className="text-ink-3 no-underline hover:text-ink-2">
          Terms
        </a>
      </div>
    </div>
  );
}
