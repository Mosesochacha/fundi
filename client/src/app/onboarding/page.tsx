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
import "./onboarding.css";

const WORKER_TRADES = [
  "Plumber", "Electrician", "Carpenter", "Painter", "Mason", "House help",
  "Mechanic", "Gardener", "Welder", "Cleaner", "AC Tech", "Chef", "Tiler",
  "Security guard",
];
const EMPLOYER_TRADES = [
  "Plumber", "Electrician", "Carpenter", "Painter", "Mason", "House help",
  "Mechanic", "Gardener", "Cleaner",
];

const initialsOf = (n: string) =>
  n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U";

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
        dailyRate: dailyRate ? Number(dailyRate.replace(/[^0-9]/g, "")) : undefined,
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

  return (
    <div className="ob-root">
      <div className="ob-progress">
        <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="ob-logo">
        Fundi<em>.</em>
      </div>
      <p className="ob-tagline">Hire skilled workers. Anywhere. Instantly.</p>

      <div className="ob-card">
        <div className="ob-step">
          Step {step} of 2 — {step === 1 ? "Almost there" : "Last step"}
        </div>

        {/* Google prefill banner */}
        <div className="ob-prefill">
          <span className="ob-avatar">{initialsOf(name)}</span>
          <div className="ob-prefill-who">
            <span className="ob-prefill-name">{name}</span>
            <span className="ob-prefill-email">{email}</span>
          </div>
          <span className="ob-verified">
            <CircleCheck size={9} /> Google verified
          </span>
        </div>

        {step === 1 && (
          <>
            <h1 className="ob-title">How will you use Fundi?</h1>
            <p className="ob-sub">Choose your role. You can&apos;t change this later.</p>

            <div className="ob-roles">
              <button
                type="button"
                className={`ob-role${role === "worker" ? " selected" : ""}`}
                onClick={() => setRole("worker")}
              >
                <span className="ob-role-icon">
                  <Wrench size={20} />
                </span>
                <div className="ob-role-title">I am a fundi</div>
                <div className="ob-role-sub">I offer skilled services and want to find work</div>
              </button>
              <button
                type="button"
                className={`ob-role${role === "employer" ? " selected" : ""}`}
                onClick={() => setRole("employer")}
              >
                <span className="ob-role-icon">
                  <Home size={20} />
                </span>
                <div className="ob-role-title">I need a fundi</div>
                <div className="ob-role-sub">I want to hire skilled workers for jobs</div>
              </button>
            </div>

            <button
              type="button"
              className="ob-btn"
              disabled={!role}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && role === "worker" && (
          <>
            <h1 className="ob-title">Set up your fundi profile</h1>
            <p className="ob-sub">This is what employers will see when they search for you.</p>

            <div className="ob-field">
              <span className="ob-label">Trade</span>
              <div className="ob-pills">
                {WORKER_TRADES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`ob-pill${trade === t ? " selected" : ""}`}
                    onClick={() => setTrade(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="ob-field">
              <label className="ob-label" htmlFor="w-location">Location</label>
              <input
                id="w-location"
                className="ob-input"
                placeholder="e.g. Westlands, Nairobi"
                value={wLocation}
                onChange={(e) => setWLocation(e.target.value)}
              />
            </div>

            <div className="ob-field">
              <label className="ob-label" htmlFor="w-rate">Daily rate (KSh) — optional</label>
              <input
                id="w-rate"
                className="ob-input"
                inputMode="numeric"
                placeholder="e.g. 2500"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
              />
              <div className="ob-hint">You can set this later from your profile</div>
            </div>

            <label className="ob-terms">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>
                I agree to Fundi&apos;s <a href="/terms">Terms of Service</a> and{" "}
                <a href="/privacy">Privacy Policy</a>
              </span>
            </label>

            <button type="button" className="ob-btn" disabled={!workerValid || saving} onClick={submitWorker}>
              <CircleCheck size={15} /> {saving ? "Creating…" : "Create my account"}
            </button>
            <button type="button" className="ob-back" onClick={() => setStep(1)}>← Back</button>
          </>
        )}

        {step === 2 && role === "employer" && (
          <>
            <h1 className="ob-title">Tell us what you need</h1>
            <p className="ob-sub">We&apos;ll show you the right fundis for your needs.</p>

            <div className="ob-field">
              <label className="ob-label" htmlFor="e-location">Location</label>
              <input
                id="e-location"
                className="ob-input"
                placeholder="e.g. Kilimani, Nairobi"
                value={eLocation}
                onChange={(e) => setELocation(e.target.value)}
              />
            </div>

            <div className="ob-field">
              <span className="ob-label">What do you usually need?</span>
              <div className="ob-hint" style={{ marginTop: 0, marginBottom: 8 }}>Select all that apply</div>
              <div className="ob-pills">
                {EMPLOYER_TRADES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`ob-pill${interested.includes(t) ? " selected" : ""}`}
                    onClick={() => toggleInterested(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="ob-terms">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>
                I agree to Fundi&apos;s <a href="/terms">Terms of Service</a> and{" "}
                <a href="/privacy">Privacy Policy</a>
              </span>
            </label>

            <button type="button" className="ob-btn" disabled={!employerValid || saving} onClick={submitEmployer}>
              <CircleCheck size={15} /> {saving ? "Creating…" : "Create my account"}
            </button>
            <button type="button" className="ob-back" onClick={() => setStep(1)}>← Back</button>
          </>
        )}
      </div>

      <div className="ob-footer">
        © 2026 Fundi · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
      </div>
    </div>
  );
}
