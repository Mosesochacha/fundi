"use client";

import {
  Briefcase,
  Clock,
  MessageSquare,
  Navigation,
  Search,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Shell from "@/components/dashboard/Shell";
import WelcomeToast from "@/components/WelcomeToast";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/features/auth";
import type {
  ActiveJob,
  RecentHire,
  SpendItem,
  SuggestedWorker,
} from "@/features/employer/dashboard";
import {
  useCancelJob,
  useGetEmployerDashboard,
  useMarkComplete,
} from "@/features/employer/dashboard";
import HireModal from "./HireModal";
import ReviewModal from "./ReviewModal";
import "./dashboard.css";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const longDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Plain KSh amount with thousands separators. */
const fmtMoney = (n: number) => n.toLocaleString("en-US");

/** Compact money, e.g. 28400 → "28.4k". */
const fmtK = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

function summary(active: number, pending: number) {
  if (active === 0 && pending === 0) return "No active jobs right now.";
  const parts: string[] = [];
  if (active > 0) parts.push(`${active} active job${active === 1 ? "" : "s"}`);
  if (pending > 0)
    parts.push(`${pending} pending response${pending === 1 ? "" : "s"}`);
  return `You have ${parts.join(" and ")}.`;
}

const mapsHref = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

type HireTarget = { id: string; name: string; trade: string };
type ReviewTarget = { jobId: string; workerName: string; jobType: string };

export default function EmployerDashboardPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data, isLoading, isError, refetch } = useGetEmployerDashboard();
  const { success } = useToastContext();

  const markComplete = useMarkComplete();
  const cancelJob = useCancelJob();

  const [hireTarget, setHireTarget] = useState<HireTarget | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";
  const firstName = name.split(" ")[0];
  const shellUser = { name, initials: initialsOf(name) };
  const employerLocation = profile?.location ?? "";

  const now = new Date();
  const stats = data?.stats;
  const activeJobs = data?.activeJobs ?? [];
  const brandNew =
    !isLoading && (stats?.totalHires ?? 0) === 0 && activeJobs.length === 0;

  const onComplete = async (job: ActiveJob) => {
    await markComplete.mutateAsync(job.id);
    success("Job marked as complete.");
    setReviewTarget({
      jobId: job.id,
      workerName: job.workerName,
      jobType: job.jobType,
    });
  };

  const onCancel = async (job: ActiveJob) => {
    await cancelJob.mutateAsync(job.id);
    success("Request cancelled.");
  };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <WelcomeToast role="employer" firstName={firstName} />
      <div className="ed">
        {/* ── Welcome row ─────────────────────────────────────────────── */}
        <div className="ed-welcome">
          <div>
            <div className="ed-date">{longDate(now)}</div>
            <h1 className="ed-greeting">
              {greeting(now)}, {firstName}.
            </h1>
            <p className="ed-sub">
              {summary(stats?.activeJobs ?? 0, stats?.pendingResponses ?? 0)}
            </p>
          </div>
          <div className="ed-welcome-actions">
            <Link
              href="/employer/hires"
              className="ed-btn ed-btn-sm ed-btn-outline"
            >
              <Clock size={14} /> Past hires
            </Link>
            <Link
              href="/employer/search"
              className="ed-btn ed-btn-sm ed-btn-gold"
            >
              <Search size={14} /> Find a fundi
            </Link>
          </div>
        </div>

        {isError && (
          <button type="button" className="ed-error" onClick={() => refetch()}>
            Could not load your dashboard. Tap to retry.
          </button>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── Stats grid ───────────────────────────────────────────── */}
            <div className="ed-stats">
              <StatCard
                accent="#c9a84c"
                numGold
                value={stats?.activeJobs ?? 0}
                label="Active jobs"
                sub="In progress now"
              />
              <StatCard
                accent="#3b82f6"
                value={stats?.pendingResponses ?? 0}
                label="Pending responses"
                sub="Awaiting fundi reply"
              />
              <StatCard
                accent="#4ade80"
                value={stats?.totalHires ?? 0}
                label="Total hires"
                sub="Since joining Fundi"
              />
              <StatCard
                accent="#8b5cf6"
                value={fmtK(stats?.totalSpent ?? 0)}
                label="Total spent this month"
                sub="KSh this month"
                trend={
                  (stats?.weekTrend ?? 0) > 0
                    ? `↑ ${stats?.weekTrend} jobs this week`
                    : undefined
                }
              />
            </div>

            {brandNew ? (
              <FirstRunHero />
            ) : (
              <div className="ed-cols">
                {/* LEFT */}
                <div className="ed-col">
                  <ActiveJobsCard
                    jobs={activeJobs}
                    onComplete={onComplete}
                    onCancel={onCancel}
                    onReview={(job) =>
                      setReviewTarget({
                        jobId: job.id,
                        workerName: job.workerName,
                        jobType: job.jobType,
                      })
                    }
                  />
                  <SuggestedFundisCard
                    workers={data?.suggestedWorkers ?? []}
                    onHire={(w) =>
                      setHireTarget({ id: w.id, name: w.name, trade: w.trade })
                    }
                  />
                </div>

                {/* RIGHT */}
                <div className="ed-col">
                  <QuickActionsCard />
                  <SpendingCard
                    items={data?.spending.items ?? []}
                    total={data?.spending.total ?? 0}
                  />
                  <RecentHiresCard
                    hires={data?.recentHires ?? []}
                    onHireAgain={(h) =>
                      setHireTarget({
                        id: h.workerId,
                        name: h.workerName,
                        trade: h.jobType,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <HireModal
        worker={hireTarget}
        defaultLocation={employerLocation}
        onClose={() => setHireTarget(null)}
      />
      <ReviewModal target={reviewTarget} onClose={() => setReviewTarget(null)} />
    </Shell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Stat card
   ───────────────────────────────────────────────────────────────────────── */
function StatCard({
  value,
  label,
  sub,
  accent,
  numGold,
  trend,
}: {
  value: number | string;
  label: string;
  sub?: string;
  accent: string;
  numGold?: boolean;
  trend?: string;
}) {
  return (
    <div className="ed-stat">
      <div className="ed-stat-bar" style={{ background: accent }} />
      <div className={`ed-stat-num${numGold ? " gold" : ""}`}>{value}</div>
      <div className="ed-stat-label">{label}</div>
      {trend ? (
        <div className="ed-trend">
          <TrendingUp size={11} /> {trend}
        </div>
      ) : sub ? (
        <div className="ed-stat-sub">{sub}</div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Avatar
   ───────────────────────────────────────────────────────────────────────── */
function Avatar({
  name,
  url,
  size = "",
}: {
  name: string;
  url?: string | null;
  size?: "" | "sm" | "xs";
}) {
  const cls = `ed-avatar${size ? ` ed-avatar-${size}` : ""}`;
  return (
    <span className={cls}>
      {url ? <img src={url} alt="" /> : initialsOf(name)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Active jobs
   ───────────────────────────────────────────────────────────────────────── */
function ActiveJobsCard({
  jobs,
  onComplete,
  onCancel,
  onReview,
}: {
  jobs: ActiveJob[];
  onComplete: (job: ActiveJob) => Promise<void>;
  onCancel: (job: ActiveJob) => Promise<void>;
  onReview: (job: ActiveJob) => void;
}) {
  return (
    <div className="ed-card">
      <div className="ed-card-head">
        <div className="ed-card-title">
          Active jobs
          {jobs.length > 0 && (
            <span className="ed-count-badge">{jobs.length}</span>
          )}
        </div>
        {jobs.length > 0 && (
          <Link href="/employer/jobs" className="ed-card-link">
            View all →
          </Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={40} />}
          title="No active jobs"
          sub="Hire a fundi to get started."
          cta={{ label: "Find a fundi", href: "/employer/search" }}
        />
      ) : (
        jobs.map((job) => (
          <ActiveJobItem
            key={job.id}
            job={job}
            onComplete={onComplete}
            onCancel={onCancel}
            onReview={onReview}
          />
        ))
      )}
    </div>
  );
}

function JobBadge({ job }: { job: ActiveJob }) {
  if (job.state === "today") {
    return (
      <span className="ed-badge ed-badge-today">
        <Zap size={10} /> Today{job.time ? ` · ${job.time}` : ""}
      </span>
    );
  }
  if (job.state === "in_progress") {
    return (
      <span className="ed-badge ed-badge-progress">
        Day {job.dayX ?? 1} of {job.dayY ?? 1}
      </span>
    );
  }
  return (
    <span className="ed-badge ed-badge-pending">
      <Clock size={10} /> Awaiting reply
    </span>
  );
}

function ActiveJobItem({
  job,
  onComplete,
  onCancel,
  onReview,
}: {
  job: ActiveJob;
  onComplete: (job: ActiveJob) => Promise<void>;
  onCancel: (job: ActiveJob) => Promise<void>;
  onReview: (job: ActiveJob) => void;
}) {
  const { error: toastError } = useToastContext();
  const [confirm, setConfirm] = useState<null | "complete" | "cancel">(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      setConfirm(null);
    } catch (e) {
      const msg =
        typeof e === "object" &&
        e !== null &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toastError(typeof msg === "string" ? msg : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ed-job">
      <div className="ed-avatar-wrap">
        <Avatar name={job.workerName} url={job.avatarUrl} />
      </div>
      <div className="ed-job-body">
        <div className="ed-job-top">
          <span className="ed-job-name">
            {job.workerName}
            {job.trade ? ` — ${job.trade}` : ""}
          </span>
          <JobBadge job={job} />
        </div>
        <div className="ed-job-meta">
          {job.jobType} · {job.location}
        </div>

        {confirm === "complete" ? (
          <div className="ed-confirm">
            <div className="ed-confirm-title">Mark this job as complete?</div>
            <div className="ed-confirm-sub">
              The fundi will be notified and you can leave a review.
            </div>
            <div className="ed-confirm-actions">
              <button
                type="button"
                className="ed-btn ed-btn-sm ed-btn-gold"
                disabled={busy}
                onClick={() => run(() => onComplete(job))}
              >
                {busy ? "Completing…" : "Yes, complete"}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn-sm ed-btn-outline"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : confirm === "cancel" ? (
          <div className="ed-confirm">
            <div className="ed-confirm-title">Cancel this request?</div>
            <div className="ed-confirm-sub">The fundi will be notified.</div>
            <div className="ed-confirm-actions">
              <button
                type="button"
                className="ed-btn ed-btn-sm ed-btn-danger"
                disabled={busy}
                onClick={() => run(() => onCancel(job))}
              >
                {busy ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn-sm ed-btn-outline"
                onClick={() => setConfirm(null)}
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <div className="ed-job-actions">
            <Link
              href={`/employer/messages?to=${job.workerId}`}
              className="ed-btn ed-btn-sm ed-btn-outline"
            >
              Message
            </Link>

            {job.state === "today" && (
              <>
                <a
                  href={mapsHref(job.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-btn ed-btn-sm ed-btn-outline"
                >
                  <Navigation size={13} /> Directions
                </a>
                {job.endPassed && (
                  <button
                    type="button"
                    className="ed-btn ed-btn-sm ed-btn-gold"
                    onClick={() => onReview(job)}
                  >
                    Leave review
                  </button>
                )}
              </>
            )}

            {job.state === "in_progress" && (
              <button
                type="button"
                className="ed-btn ed-btn-sm ed-btn-gold"
                onClick={() => setConfirm("complete")}
              >
                Mark complete
              </button>
            )}

            {job.state === "pending" && (
              <button
                type="button"
                className="ed-btn ed-btn-sm ed-btn-danger"
                onClick={() => setConfirm("cancel")}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Suggested fundis
   ───────────────────────────────────────────────────────────────────────── */
function SuggestedFundisCard({
  workers,
  onHire,
}: {
  workers: SuggestedWorker[];
  onHire: (w: SuggestedWorker) => void;
}) {
  return (
    <div className="ed-card">
      <div className="ed-card-head">
        <div className="ed-card-title">Suggested fundis near you</div>
        {workers.length > 0 && (
          <Link href="/employer/search" className="ed-card-link">
            Browse all →
          </Link>
        )}
      </div>

      {workers.length === 0 ? (
        <EmptyState
          sm
          icon={<Users size={36} />}
          title="No suggestions yet"
          sub="Browse workers to get recommendations."
          cta={{ label: "Browse workers", href: "/employer/search" }}
        />
      ) : (
        workers.map((w) => (
          <div key={w.id} className="ed-worker">
            <div className="ed-avatar-wrap">
              <Avatar name={w.name} url={w.avatarUrl} size="sm" />
            </div>
            <div className="ed-worker-body">
              <div className="ed-worker-name">{w.name}</div>
              <div className="ed-worker-trade">
                {w.trade}
                {w.location ? ` · ${w.location}` : ""}
              </div>
              <div className="ed-worker-stats">
                <span className="ed-worker-rating">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  {w.rating > 0 ? w.rating.toFixed(1) : "New"}
                  {w.jobCount > 0 ? ` · ${w.jobCount} jobs` : ""}
                </span>
                {w.rate != null && (
                  <span className="ed-rate-pill">
                    KSh {fmtMoney(w.rate)}/day
                  </span>
                )}
              </div>
              <div className="ed-worker-actions">
                <Link
                  href={`/worker/${w.id}`}
                  className="ed-btn ed-btn-sm ed-btn-outline"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="ed-btn ed-btn-sm ed-btn-gold"
                  onClick={() => onHire(w)}
                >
                  Hire
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Quick actions
   ───────────────────────────────────────────────────────────────────────── */
function QuickActionsCard() {
  return (
    <div className="ed-card">
      <div className="ed-card-head">
        <div className="ed-card-title">Quick actions</div>
      </div>
      <div className="ed-actions-grid">
        <QuickAction
          href="/employer/search"
          icon={<Search size={15} />}
          label="Find fundi"
          sub="Browse by trade"
        />
        <QuickAction
          href="/employer/messages"
          icon={<MessageSquare size={15} />}
          label="Messages"
          sub="Chat with fundis"
        />
        <QuickAction
          href="/employer/hires"
          icon={<Clock size={15} />}
          label="Past hires"
          sub="Hire again"
        />
        <QuickAction
          href="/employer/reviews"
          icon={<Star size={15} />}
          label="Reviews"
          sub="Manage feedback"
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link href={href} className="ed-action">
      <span className="ed-action-icon">{icon}</span>
      <span className="ed-action-label">{label}</span>
      <span className="ed-action-sub">{sub}</span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Spending this month
   ───────────────────────────────────────────────────────────────────────── */
function SpendingCard({ items, total }: { items: SpendItem[]; total: number }) {
  const max = items.reduce((m, i) => Math.max(m, i.amount), 0) || 1;
  return (
    <div className="ed-card">
      <div className="ed-card-head">
        <div className="ed-card-title">Spending this month</div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          sm
          icon={<TrendingUp size={36} />}
          title="No spending yet"
          sub="No spending yet this month."
        />
      ) : (
        <>
          {items.map((it) => (
            <div key={it.category} className="ed-spend">
              <div className="ed-spend-top">
                <span>
                  <span className="ed-spend-cat">{it.category}</span>{" "}
                  <span className="ed-spend-count">
                    · {it.jobCount} job{it.jobCount === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="ed-spend-amt">KSh {fmtMoney(it.amount)}</span>
              </div>
              <div className="ed-spend-bar">
                <div
                  className="ed-spend-fill"
                  style={{ width: `${Math.round((it.amount / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          <div className="ed-spend-total">
            <span className="ed-spend-total-label">Total this month</span>
            <span className="ed-spend-total-amt">KSh {fmtMoney(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Recent hires
   ───────────────────────────────────────────────────────────────────────── */
function RecentHiresCard({
  hires,
  onHireAgain,
}: {
  hires: RecentHire[];
  onHireAgain: (h: RecentHire) => void;
}) {
  return (
    <div className="ed-card">
      <div className="ed-card-head">
        <div className="ed-card-title">Recent hires</div>
        {hires.length > 0 && (
          <Link href="/employer/hires" className="ed-card-link">
            View all →
          </Link>
        )}
      </div>

      {hires.length === 0 ? (
        <EmptyState
          sm
          icon={<Clock size={36} />}
          title="No hires yet"
          sub="Your hire history will appear here."
        />
      ) : (
        hires.map((h) => (
          <div key={h.id} className="ed-hire">
            <div className="ed-avatar-wrap">
              <Avatar name={h.workerName} url={h.avatarUrl} size="xs" />
            </div>
            <div className="ed-hire-body">
              <div className="ed-hire-name">
                {h.workerName} · {h.jobType}
              </div>
              <div className="ed-hire-meta">
                {shortDate(h.date)}
                {h.location ? ` · ${h.location}` : ""}
              </div>
            </div>
            <div className="ed-hire-right">
              {h.rate > 0 && (
                <span className="ed-hire-rate">KSh {fmtMoney(h.rate)}</span>
              )}
              {h.rating != null && <Stars value={h.rating} />}
              <button
                type="button"
                className="ed-hire-again"
                onClick={() => onHireAgain(h)}
              >
                Hire again
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="ed-stars" role="img" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-star row
          key={i}
          size={11}
          fill={i < Math.round(value) ? "currentColor" : "none"}
          strokeWidth={i < Math.round(value) ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared empty state
   ───────────────────────────────────────────────────────────────────────── */
function EmptyState({
  icon,
  title,
  sub,
  cta,
  sm,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  cta?: { label: string; href: string };
  sm?: boolean;
}) {
  return (
    <div className={`ed-empty${sm ? " sm" : ""}`}>
      <span className="ed-empty-icon">{icon}</span>
      <div className="ed-empty-title">{title}</div>
      <p className="ed-empty-sub">{sub}</p>
      {cta && (
        <Link href={cta.href} className="ed-btn ed-btn-sm ed-btn-gold">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   First-run hero (brand-new employer: no hires, no active jobs)
   ───────────────────────────────────────────────────────────────────────── */
function FirstRunHero() {
  return (
    <div className="ed-hero">
      <span className="ed-empty-emoji">🔧</span>
      <div className="ed-empty-title">Find your first fundi</div>
      <p className="ed-empty-sub">
        Browse verified plumbers, electricians, carpenters and more near you.
      </p>
      <Link href="/employer/search" className="ed-btn ed-btn-gold">
        Browse workers
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Loading skeleton — mirrors the real layout
   ───────────────────────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <>
      <div className="ed-stats">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
            key={i}
            className="ed-stat"
          >
            <div
              className="ed-stat-bar"
              style={{ background: "var(--border)" }}
            />
            <div className="ed-skel" style={{ width: 48, height: 26 }} />
            <div
              className="ed-skel"
              style={{ width: "70%", height: 12, marginTop: 12 }}
            />
            <div
              className="ed-skel"
              style={{ width: "55%", height: 10, marginTop: 8 }}
            />
          </div>
        ))}
      </div>
      <div className="ed-cols">
        <div className="ed-col">
          <SkeletonCard rows={3} height={86} />
          <SkeletonCard rows={3} height={64} />
        </div>
        <div className="ed-col">
          <SkeletonCard rows={2} height={48} />
          <SkeletonCard rows={3} height={28} />
          <SkeletonCard rows={2} height={44} />
        </div>
      </div>
    </>
  );
}

function SkeletonCard({ rows, height }: { rows: number; height: number }) {
  return (
    <div className="ed-card">
      <div className="ed-card-head">
        <div className="ed-skel" style={{ width: 120, height: 14 }} />
      </div>
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {Array.from({ length: rows }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
            key={i}
            className="ed-skel"
            style={{ width: "100%", height }}
          />
        ))}
      </div>
    </div>
  );
}
