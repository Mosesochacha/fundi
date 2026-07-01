"use client";

import {
  Briefcase,
  Clock,
  MessageSquare,
  Navigation,
  Search,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
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
import { symbolOf } from "@/lib/currency";
import HireModal from "./HireModal";
import ReviewModal from "./ReviewModal";

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

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** Plain amount with thousands separators (symbol is prepended by callers). */
const fmtMoney = (n: number) => n.toLocaleString("en-US");

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

const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg border whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed no-underline";
const BTN_SM = "text-sm px-[11px] py-1.5";
const BTN_GOLD =
  "bg-gold text-navy border-gold hover:bg-gold-dark hover:border-gold-dark";
const BTN_OUTLINE =
  "bg-white text-ink-2 border-border hover:border-gold hover:bg-gold-light hover:text-ink";
const BTN_DANGER = "bg-white text-red-600 border-red-300 hover:bg-red-50";

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
      {/* biome-ignore lint/a11y/useValidAriaRole: `role` is a WelcomeToast prop, not an ARIA attribute */}
      <WelcomeToast role="employer" firstName={firstName} />
      <div className="flex flex-col gap-4 text-ink-2">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-[26px] font-normal text-ink leading-[1.15]">
              {greeting(now)}, {firstName}.
            </h1>
            <p className="text-[13px] text-ink-3 mt-1">
              {summary(stats?.activeJobs ?? 0, stats?.pendingResponses ?? 0)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/employer/hires"
              className={`${BTN_BASE} ${BTN_SM} ${BTN_OUTLINE}`}
            >
              <Clock size={14} /> Past hires
            </Link>
            <Link
              href="/employer/search"
              className={`${BTN_BASE} ${BTN_SM} ${BTN_GOLD}`}
            >
              <Search size={14} /> Find a fundi
            </Link>
          </div>
        </div>

        {isError && (
          <button
            type="button"
            className="block w-full text-center bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm font-medium cursor-pointer"
            onClick={() => refetch()}
          >
            Could not load your dashboard. Tap to retry.
          </button>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={<Briefcase size={16} />}
                number={stats?.activeJobs ?? 0}
                label="Active jobs"
              />
              <StatCard
                icon={<Clock size={16} />}
                number={stats?.pendingResponses ?? 0}
                label="Pending responses"
              />
              <StatCard
                icon={<UserCheck size={16} />}
                number={stats?.totalHires ?? 0}
                label="Total hires"
              />
              <StatCard
                icon={<Wallet size={16} />}
                number={`${symbolOf(user?.currency)} ${fmtMoney(stats?.totalSpent ?? 0)}`}
                label="Spent this month"
              />
            </div>

            {brandNew ? (
              <GetStartedPanel />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
                <div className="flex flex-col gap-4">
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

                <div className="flex flex-col gap-4">
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
      <ReviewModal
        target={reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
    </Shell>
  );
}

function Avatar({
  name,
  url,
  size = "",
}: {
  name: string;
  url?: string | null;
  size?: "" | "sm" | "xs";
}) {
  const dims =
    size === "sm"
      ? "w-9 h-9 text-sm"
      : size === "xs"
        ? "w-8 h-8 text-[11px]"
        : "w-10 h-10 text-sm";
  return (
    <span
      className={`${dims} rounded-full bg-gold-light border-[1.5px] border-gold/30 text-gold-dark font-semibold flex items-center justify-center overflow-hidden`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        // biome-ignore lint/performance/noImgElement: avatar URLs are arbitrary external hosts
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      {children}
    </div>
  );
}

function CardHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-border">
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
      {children}
    </div>
  );
}

function CardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-gold-dark underline whitespace-nowrap"
    >
      {children}
    </Link>
  );
}

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
    <CardShell>
      <CardHead>
        <CardTitle>
          Active jobs
          {jobs.length > 0 && (
            <span className="bg-gold-light text-gold-dark border border-gold/30 text-[11px] font-semibold rounded-full px-[7px] leading-[18px]">
              {jobs.length}
            </span>
          )}
        </CardTitle>
        {jobs.length > 0 && (
          <CardLink href="/employer/jobs">View all →</CardLink>
        )}
      </CardHead>

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
    </CardShell>
  );
}

function JobBadge({ job }: { job: ActiveJob }) {
  if (job.state === "today") {
    return (
      <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 bg-orange-50 text-orange-600">
        <Zap size={10} /> Today{job.time ? ` · ${job.time}` : ""}
      </span>
    );
  }
  if (job.state === "in_progress") {
    return (
      <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 bg-blue-50 text-blue-600">
        Day {job.dayX ?? 1} of {job.dayY ?? 1}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0 bg-gold-light text-gold-dark">
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
    <div className="flex gap-3 px-4 py-3.5 border-b border-border last:border-b-0 cursor-pointer transition-colors hover:bg-cream">
      <div className="relative shrink-0">
        <Avatar name={job.workerName} url={job.avatarUrl} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink">
            {job.workerName}
            {job.trade ? ` - ${job.trade}` : ""}
          </span>
          <JobBadge job={job} />
        </div>
        <div className="text-sm text-ink-3 mt-1">
          {job.jobType} · {job.location}
        </div>

        {confirm === "complete" ? (
          <div className="mt-2.5 px-3 py-2.5 bg-cream border border-border rounded-lg">
            <div className="text-sm font-semibold text-ink">
              Mark this job as complete?
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5 leading-normal">
              The fundi will be notified and you can leave a review.
            </div>
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                className={`${BTN_BASE} ${BTN_SM} ${BTN_GOLD}`}
                disabled={busy}
                onClick={() => run(() => onComplete(job))}
              >
                {busy ? "Completing…" : "Yes, complete"}
              </button>
              <button
                type="button"
                className={`${BTN_BASE} ${BTN_SM} ${BTN_OUTLINE}`}
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : confirm === "cancel" ? (
          <div className="mt-2.5 px-3 py-2.5 bg-cream border border-border rounded-lg">
            <div className="text-sm font-semibold text-ink">
              Cancel this request?
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5 leading-normal">
              The fundi will be notified.
            </div>
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                className={`${BTN_BASE} ${BTN_SM} ${BTN_DANGER}`}
                disabled={busy}
                onClick={() => run(() => onCancel(job))}
              >
                {busy ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                type="button"
                className={`${BTN_BASE} ${BTN_SM} ${BTN_OUTLINE}`}
                onClick={() => setConfirm(null)}
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2.5">
            <Link
              href={`/employer/messages?to=${job.workerId}`}
              className={`${BTN_BASE} ${BTN_SM} ${BTN_OUTLINE}`}
            >
              Message
            </Link>

            {job.state === "today" && (
              <>
                <a
                  href={mapsHref(job.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN_BASE} ${BTN_SM} ${BTN_OUTLINE}`}
                >
                  <Navigation size={13} /> Directions
                </a>
                {job.endPassed && (
                  <button
                    type="button"
                    className={`${BTN_BASE} ${BTN_SM} ${BTN_GOLD}`}
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
                className={`${BTN_BASE} ${BTN_SM} ${BTN_GOLD}`}
                onClick={() => setConfirm("complete")}
              >
                Mark complete
              </button>
            )}

            {job.state === "pending" && (
              <button
                type="button"
                className={`${BTN_BASE} ${BTN_SM} ${BTN_DANGER}`}
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

function SuggestedFundisCard({
  workers,
  onHire,
}: {
  workers: SuggestedWorker[];
  onHire: (w: SuggestedWorker) => void;
}) {
  const { user } = useAuth();
  const sym = symbolOf(user?.currency);
  return (
    <CardShell>
      <CardHead>
        <CardTitle>Suggested fundis near you</CardTitle>
        {workers.length > 0 && (
          <CardLink href="/employer/search">Browse all →</CardLink>
        )}
      </CardHead>

      {workers.length === 0 ? (
        <EmptyState
          sm
          icon={<Users size={36} />}
          title="No suggestions yet"
          sub="Browse fundis to get recommendations."
          cta={{ label: "Browse fundis", href: "/employer/search" }}
        />
      ) : (
        workers.map((w) => (
          <div
            key={w.id}
            className="flex gap-3 px-4 py-3 border-b border-border last:border-b-0"
          >
            <div className="relative shrink-0">
              <Avatar name={w.name} url={w.avatarUrl} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">{w.name}</div>
              <div className="text-[11px] text-ink-2 mt-px">
                {w.trade}
                {w.location ? ` · ${w.location}` : ""}
              </div>
              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                <span className="inline-flex items-center gap-[3px] text-[11px] text-ink-3">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  {w.rating > 0 ? w.rating.toFixed(1) : "New"}
                  {w.jobCount > 0 ? ` · ${w.jobCount} jobs` : ""}
                </span>
                {w.rate != null && (
                  <span className="bg-gold-light border border-gold/40 text-gold-dark text-[11px] font-semibold rounded-full px-2 py-px">
                    {sym} {fmtMoney(w.rate)}/day
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 mt-2.5">
                <Link
                  href={`/worker/${w.id}`}
                  className={`${BTN_BASE} ${BTN_SM} ${BTN_OUTLINE}`}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className={`${BTN_BASE} ${BTN_SM} ${BTN_GOLD}`}
                  onClick={() => onHire(w)}
                >
                  Hire
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </CardShell>
  );
}

function QuickActionsCard() {
  return (
    <CardShell>
      <CardHead>
        <CardTitle>Quick actions</CardTitle>
      </CardHead>
      <div className="grid grid-cols-2 gap-2 px-4 py-3.5">
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
    </CardShell>
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
    <Link
      href={href}
      className="flex flex-col gap-1.5 p-3 rounded-lg bg-cream border border-border text-left no-underline transition-colors hover:border-gold hover:bg-gold-light"
    >
      <span className="w-7 h-7 rounded-lg bg-gold-light text-gold-dark flex items-center justify-center">
        {icon}
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="text-[10px] text-ink-3">{sub}</span>
    </Link>
  );
}

function SpendingCard({ items, total }: { items: SpendItem[]; total: number }) {
  const { user } = useAuth();
  const sym = symbolOf(user?.currency);
  const max = items.reduce((m, i) => Math.max(m, i.amount), 0) || 1;
  return (
    <CardShell>
      <CardHead>
        <CardTitle>Spending this month</CardTitle>
      </CardHead>

      {items.length === 0 ? (
        <EmptyState
          sm
          icon={<TrendingUp size={36} />}
          title="No spending yet"
          sub="Once you hire and pay a fundi, it'll show up here."
        />
      ) : (
        <>
          {items.map((it) => (
            <div key={it.category} className="px-4 py-3 border-b border-border">
              <div className="flex items-baseline justify-between gap-2">
                <span>
                  <span className="text-sm font-medium text-ink">
                    {it.category}
                  </span>{" "}
                  <span className="text-[11px] text-ink-3">
                    · {it.jobCount} job{it.jobCount === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="text-sm font-medium text-ink-2">
                  {sym} {fmtMoney(it.amount)}
                </span>
              </div>
              <div className="h-1 rounded-full bg-cream-2 overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gold rounded-full"
                  style={{ width: `${Math.round((it.amount / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-ink-2">
              Total this month
            </span>
            <span className="font-serif text-base text-gold-dark">
              {sym} {fmtMoney(total)}
            </span>
          </div>
        </>
      )}
    </CardShell>
  );
}

function RecentHiresCard({
  hires,
  onHireAgain,
}: {
  hires: RecentHire[];
  onHireAgain: (h: RecentHire) => void;
}) {
  const { user } = useAuth();
  const sym = symbolOf(user?.currency);
  return (
    <CardShell>
      <CardHead>
        <CardTitle>Recent hires</CardTitle>
        {hires.length > 0 && (
          <CardLink href="/employer/hires">View all →</CardLink>
        )}
      </CardHead>

      {hires.length === 0 ? (
        <EmptyState
          sm
          icon={<Clock size={36} />}
          title="No hires yet"
          sub="Your hire history will appear here."
        />
      ) : (
        hires.map((h) => (
          <div
            key={h.id}
            className="flex gap-3 px-4 py-3 border-b border-border last:border-b-0"
          >
            <div className="relative shrink-0">
              <Avatar name={h.workerName} url={h.avatarUrl} size="xs" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">
                {h.workerName} · {h.jobType}
              </div>
              <div className="text-[11px] text-ink-3 mt-0.5">
                {shortDate(h.date)}
                {h.location ? ` · ${h.location}` : ""}
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {h.rate > 0 && (
                <span className="text-[11px] font-medium text-gold-dark">
                  {sym} {fmtMoney(h.rate)}
                </span>
              )}
              {h.rating != null && <Stars value={h.rating} />}
              <button
                type="button"
                className="text-[10px] text-gold-dark underline bg-none border-0 cursor-pointer p-0"
                onClick={() => onHireAgain(h)}
              >
                Hire again
              </button>
            </div>
          </div>
        ))
      )}
    </CardShell>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex gap-px text-gold"
      role="img"
      aria-label={`${value} out of 5`}
    >
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
    <div
      className={`flex flex-col items-center text-center ${sm ? "px-6 py-7" : "px-6 py-10"}`}
    >
      <span className="text-ink-4 leading-none">{icon}</span>
      <div className="text-sm font-medium text-ink-2 mt-3">{title}</div>
      <p className="text-sm text-ink-3 leading-relaxed max-w-[260px] mt-1">
        {sub}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className={`${BTN_BASE} ${BTN_SM} ${BTN_GOLD} mt-3.5`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function StatCard({
  icon,
  number,
  label,
}: {
  icon: React.ReactNode;
  number: React.ReactNode;
  label: string;
}) {
  return (
    <div className="bg-white border-[0.5px] border-border rounded-xl p-4">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-navy text-gold">
        {icon}
      </span>
      <div className="text-[24px] font-medium text-ink leading-none mt-3.5">
        {number}
      </div>
      <div className="text-xs text-ink-3 mt-0.5">{label}</div>
    </div>
  );
}

const GET_STARTED_STEPS = [
  "Search by trade and area",
  "Message and agree on price",
  "Get the job done, leave a review",
];

/**
 * First-run panel shown until the employer has any jobs or hires. Once they
 * post their first job this is replaced by their active jobs list, and the
 * highlighted step should track their real progress.
 */
function GetStartedPanel() {
  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 bg-navy rounded-xl px-8 py-9">
        <div className="flex-1">
          <div className="text-[11px] font-medium uppercase tracking-[0.6px] text-gold">
            Get started
          </div>
          <h2 className="font-serif text-[22px] font-normal text-cream leading-[1.2] mt-2">
            Find your first fundi in under two minutes
          </h2>
          <p className="text-[13px] text-ink-4 leading-relaxed max-w-[380px] mt-2">
            Browse verified fundis near you, compare rates and reviews, then
            send a hire request — they can start right away.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-5">
            <Link
              href="/employer/search"
              className={`${BTN_BASE} ${BTN_SM} bg-gold border-gold text-navy hover:bg-gold-dark hover:border-gold-dark`}
            >
              Browse fundis
            </Link>
            <Link
              href="/employer/messages"
              className={`${BTN_BASE} ${BTN_SM} bg-transparent border-navy-2 text-cream hover:border-gold`}
            >
              Go to messages
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 lg:min-w-[200px]">
          {GET_STARTED_STEPS.map((label, i) => {
            const active = i === 0;
            return (
              <div
                key={label}
                className="flex items-center gap-2.5 bg-ink rounded-lg px-3 py-2.5"
              >
                <span
                  className={`flex items-center justify-center w-[22px] h-[22px] shrink-0 rounded-full text-[11px] font-medium ${
                    active ? "bg-gold text-navy" : "bg-navy-2 text-ink-4"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-cream-2">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <TradeChips />
    </div>
  );
}

const POPULAR_TRADES = [
  "Plumbers",
  "Electricians",
  "House help",
  "Carpenters",
  "Painters",
];

function TradeChips() {
  return (
    <div className="mt-3.5">
      <div className="text-[11px] text-ink-3">Popular near you</div>
      <div className="flex flex-wrap gap-2 mt-2">
        {POPULAR_TRADES.map((trade) => (
          <Link
            key={trade}
            href={`/browse?trade=${encodeURIComponent(trade)}`}
            className="bg-white border-[0.5px] border-border rounded-[20px] px-3.5 py-1.5 text-xs text-ink no-underline transition-colors hover:border-gold"
          >
            {trade}
          </Link>
        ))}
      </div>
    </div>
  );
}

const SKEL = "bg-border rounded-md animate-pulse";

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
            key={i}
            className="bg-white border-[0.5px] border-border rounded-xl p-4"
          >
            <div className={`${SKEL} w-8 h-8 rounded-lg`} />
            <div className={`${SKEL} w-16 h-6 mt-3.5`} />
            <div className={`${SKEL} w-[55%] h-3 mt-1.5`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <SkeletonCard rows={3} height="h-[86px]" />
          <SkeletonCard rows={3} height="h-16" />
        </div>
        <div className="flex flex-col gap-4">
          <SkeletonCard rows={2} height="h-12" />
          <SkeletonCard rows={3} height="h-7" />
          <SkeletonCard rows={2} height="h-11" />
        </div>
      </div>
    </>
  );
}

function SkeletonCard({ rows, height }: { rows: number; height: string }) {
  return (
    <CardShell>
      <CardHead>
        <div className={`${SKEL} w-[120px] h-3.5`} />
      </CardHead>
      <div className="p-4 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
            key={i}
            className={`${SKEL} w-full ${height}`}
          />
        ))}
      </div>
    </CardShell>
  );
}
