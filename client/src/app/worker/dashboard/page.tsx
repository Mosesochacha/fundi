"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Coins,
  FileText,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Share2,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import Shell from "@/components/dashboard/Shell";
import { Button } from "@/components/ui";
import WelcomeToast from "@/components/WelcomeToast";
import { useAuth } from "@/features/auth";
import type {
  ChecklistItem,
  JobRequest,
  Review,
  UpcomingJob,
} from "@/features/worker/dashboard";
import { useGetWorkerDashboard } from "@/features/worker/dashboard";
import { cn } from "@/lib/utils";

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

/** "2 Jun, 9:00 AM" style label for a request's date. */
const reqDateLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const CARD = "bg-white border-[0.5px] border-border rounded-xl overflow-hidden";
const CARD_HEAD =
  "flex items-center justify-between gap-2 px-4 py-3.5 border-b-[0.5px] border-border";
const CARD_TITLE = "flex items-center gap-2 text-[13px] font-semibold text-ink";
const CARD_LINK =
  "text-xs text-gold-dark no-underline whitespace-nowrap hover:underline";

export default function WorkerDashboardPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data, isLoading, isError, refetch } = useGetWorkerDashboard();

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Worker";
  const firstName = name.split(" ")[0];
  const shellUser = { name, initials: initialsOf(name) };

  const now = new Date();

  const shareProfile = useCallback(() => {
    const username = profile?.username;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/worker/${username ?? ""}`
        : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: `${name} on Tesilix`, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [profile?.username, name]);

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="worker" user={shellUser} currentPath={pathname}>
      {/* biome-ignore lint/a11y/useValidAriaRole: `role` is a WelcomeToast prop, not an ARIA attribute */}
      <WelcomeToast role="worker" firstName={firstName} />
      <div className="flex flex-col gap-4 text-ink-2">
        {/* ── Welcome row ─────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[13px] text-ink-3">{longDate(now)}</div>
            <h1 className="font-serif text-[26px] font-normal text-ink mt-0.5 leading-[1.15]">
              {greeting(now)}, {firstName}.
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white"
              onClick={shareProfile}
              icon={<Share2 size={14} />}
            >
              Share profile
            </Button>
            <Link href="/worker/profile">
              <Button type="button" variant="gold" size="sm">
                Edit profile
              </Button>
            </Link>
          </div>
        </div>

        {isError && (
          <button
            type="button"
            className="block w-full text-center bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-xs font-medium font-sans cursor-pointer"
            onClick={() => refetch()}
          >
            Could not load your dashboard. Tap to retry.
          </button>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── Stats grid ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                highlighted
                value={data?.stats.newRequests ?? 0}
                gold
                label="New requests"
                sub="Waiting for response"
              />
              <StatCard
                value={data?.stats.totalJobs ?? 0}
                label="Total jobs done"
                sub="Since joining Tesilix"
              />
              <StatCard
                value={
                  (data?.stats.reviewCount ?? 0) === 0
                    ? "—"
                    : (data?.stats.rating ?? 0).toFixed(1)
                }
                label="Your rating"
                sub={
                  (data?.stats.reviewCount ?? 0) === 0
                    ? "No reviews yet"
                    : `${data?.stats.reviewCount} review${
                        data?.stats.reviewCount === 1 ? "" : "s"
                      }`
                }
              />
              <StatCard
                value={data?.stats.profileViews ?? 0}
                label="Profile views"
                sub={
                  (data?.stats.profileViews ?? 0) === 0
                    ? "Share your profile to get views"
                    : undefined
                }
                trend={
                  (data?.stats.weeklyViews ?? 0) > 0
                    ? `↑ ${data?.stats.weeklyViews} this week`
                    : undefined
                }
              />
            </div>

            {/* ── Two-column layout ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
              {/* LEFT */}
              <div className="flex flex-col gap-4">
                <JobRequestsCard requests={data?.recentRequests ?? []} />
                <UpcomingJobsCard jobs={data?.upcomingJobs ?? []} />
              </div>

              {/* RIGHT */}
              <div className="flex flex-col gap-4">
                <ProfileStrengthCard
                  percentage={data?.profileStrength.percentage ?? 0}
                  completed={data?.profileStrength.completedItems ?? []}
                  todo={data?.profileStrength.todoItems ?? []}
                />
                <QuickActionsCard onShare={shareProfile} />
                <ReviewsCard reviews={data?.recentReviews ?? []} />
              </div>
            </div>
          </>
        )}
      </div>
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
  gold,
  highlighted,
  trend,
}: {
  value: number | string;
  label: string;
  sub?: string;
  gold?: boolean;
  highlighted?: boolean;
  trend?: string;
}) {
  return (
    <div className="bg-white border-[0.5px] border-border rounded-xl overflow-hidden">
      <div className={cn("h-[3px]", highlighted ? "bg-gold" : "bg-border")} />
      <div className="px-[18px] py-4">
        <div
          className={cn(
            "font-serif text-[28px] font-normal leading-none",
            gold ? "text-gold-dark" : "text-ink",
          )}
        >
          {value}
        </div>
        <div className="text-xs font-medium text-ink-2 mt-2">{label}</div>
        {trend ? (
          <div className="inline-flex items-center gap-[3px] bg-green-100 text-green-700 text-[10px] font-semibold rounded-full px-[7px] py-0.5 mt-2">
            <TrendingUp size={11} /> {trend}
          </div>
        ) : sub ? (
          <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Job requests
   ───────────────────────────────────────────────────────────────────────── */
const TAG: Record<JobRequest["status"], { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-gold-light text-gold-dark" },
  today: { label: "Today", cls: "bg-blue-50 text-blue-600" },
  active: { label: "Active", cls: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", cls: "bg-green-50 text-green-600" },
};

function JobRequestsCard({ requests }: { requests: JobRequest[] }) {
  return (
    <div className={CARD}>
      <div className={CARD_HEAD}>
        <div className={CARD_TITLE}>
          Job requests
          {requests.length > 0 && (
            <span className="bg-gold-light text-gold-dark border border-gold/30 text-[11px] font-semibold rounded-full px-[7px] leading-[18px]">
              {requests.length}
            </span>
          )}
        </div>
        {requests.length > 0 && (
          <Link href="/worker/requests" className={CARD_LINK}>
            View all →
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title="No job requests yet"
          sub="Complete your profile and share it to start receiving requests from employers."
          cta={{ label: "Complete profile", href: "/worker/profile" }}
        />
      ) : (
        requests.map((r) => <JobRequestItem key={r.id} req={r} />)
      )}
    </div>
  );
}

function JobRequestItem({ req }: { req: JobRequest }) {
  const tag = TAG[req.status];
  const isNew = req.status === "new";
  const isActive = req.status === "today" || req.status === "active";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3.5 border-b-[0.5px] border-border last:border-b-0 transition-colors hover:bg-cream",
        isNew && "border-l-[3px] border-l-gold pl-[13px]",
      )}
    >
      <div className="w-9 h-9 rounded-full bg-gold-light border-[1.5px] border-gold/30 text-gold-dark text-xs font-semibold flex items-center justify-center shrink-0">
        {initialsOf(req.clientName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-ink">
            {req.jobType} · {req.location}
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap shrink-0",
              tag.cls,
            )}
          >
            {tag.label}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-ink-3 mt-[5px] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[3px]">
          <span>
            <Calendar size={12} /> {reqDateLabel(req.date)}
          </span>
          <span>
            <MapPin size={12} /> {req.location}
          </span>
        </div>
        <p className="text-xs text-ink-2 mt-1.5 leading-normal line-clamp-2">
          {req.description}
        </p>
        <div className="flex gap-2 mt-2.5">
          {req.status === "completed" ? (
            <Link href={`/worker/requests/${req.id}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white"
              >
                Leave review
              </Button>
            </Link>
          ) : (
            <>
              <Link href={`/worker/messages?to=${req.id}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white"
                >
                  {isActive ? "Message client" : "Message"}
                </Button>
              </Link>
              <Button type="button" variant="gold" size="sm">
                {isActive ? "Mark complete" : "Accept job"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Upcoming jobs
   ───────────────────────────────────────────────────────────────────────── */
function UpcomingJobsCard({ jobs }: { jobs: UpcomingJob[] }) {
  return (
    <div className={CARD}>
      <div className={CARD_HEAD}>
        <div className={CARD_TITLE}>Upcoming jobs</div>
        {jobs.length > 0 && (
          <Link href="/worker/calendar" className={CARD_LINK}>
            Calendar →
          </Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          sm
          icon={<Calendar size={36} />}
          title="No upcoming jobs"
          sub="Accepted jobs will appear here."
        />
      ) : (
        jobs.map((j) => {
          const d = new Date(j.date);
          return (
            <div
              key={j.id}
              className="flex items-center gap-3 px-4 py-3 border-b-[0.5px] border-border last:border-b-0"
            >
              <div className="w-10 h-10 rounded-lg bg-gold-light border border-gold/40 flex flex-col items-center justify-center shrink-0">
                <span className="font-serif text-base font-medium leading-none text-gold-dark">
                  {d.getDate()}
                </span>
                <span className="text-[8px] uppercase tracking-[0.06em] text-gold-dark mt-px">
                  {d.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink">
                  {j.title} · {j.clientName}
                </div>
                <div className="text-[11px] text-ink-3 mt-0.5">
                  {j.location} · {j.time}
                </div>
              </div>
              <Link
                href={`/worker/messages?to=${j.id}`}
                className="flex items-center justify-center w-[30px] h-[30px] rounded-lg border-[0.5px] border-border bg-white text-ink-2 transition-colors hover:border-gold hover:bg-gold-light hover:text-ink"
                aria-label="Message client"
              >
                <MessageSquare size={15} />
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Profile strength
   ───────────────────────────────────────────────────────────────────────── */
function ProfileStrengthCard({
  percentage,
  completed,
  todo,
}: {
  percentage: number;
  completed: ChecklistItem[];
  todo: ChecklistItem[];
}) {
  return (
    <div className={CARD}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className={CARD_TITLE}>Profile strength</div>
          <span className="font-serif text-lg font-medium text-gold-dark">
            {percentage}%
          </span>
        </div>
        <div className="h-[5px] rounded-full bg-cream-2 overflow-hidden mt-2.5">
          <div
            className="h-full bg-gold rounded-full transition-[width] duration-[400ms] ease"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-3 mt-2 mb-3.5 leading-normal">
          Complete your profile to get more job requests
        </p>

        {completed.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2 text-xs text-ink-2 mb-2 last:mb-0"
          >
            <span className="shrink-0 inline-flex text-green-600">
              <CheckCircle2 size={15} />
            </span>
            {item.label}
          </div>
        ))}
        {todo.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2 text-xs text-ink-3 mb-2 last:mb-0"
          >
            <span className="shrink-0 inline-flex text-ink-3">
              <CircleDashed size={15} />
            </span>
            {item.label}
            <Link
              href={item.href ?? "/worker/profile"}
              className="ml-auto inline-flex items-center justify-center bg-gold text-navy border border-gold text-[11px] font-medium px-[9px] py-[3px] rounded-md no-underline transition-colors hover:bg-gold-dark hover:border-gold-dark"
            >
              Add
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Quick actions
   ───────────────────────────────────────────────────────────────────────── */
function QuickActionsCard({ onShare }: { onShare: () => void }) {
  return (
    <div className={CARD}>
      <div className={CARD_HEAD}>
        <div className={CARD_TITLE}>Quick actions</div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 py-3.5">
        <QuickAction
          href="/worker/profile#portfolio"
          icon={<ImageIcon size={15} />}
          label="Add photos"
          sub="Show your work"
        />
        <QuickAction
          href="/worker/profile#certifications"
          icon={<Award size={15} />}
          label="Add cert"
          sub="Build trust"
        />
        <QuickAction
          onClick={onShare}
          icon={<Share2 size={15} />}
          label="Share profile"
          sub="Get more views"
        />
        <QuickAction
          href="/worker/profile#rate"
          icon={<Coins size={15} />}
          label="Set daily rate"
          sub="Attract employers"
        />
      </div>
    </div>
  );
}

const QUICK_ACTION =
  "flex flex-col gap-1.5 p-3 rounded-[10px] bg-white border-[0.5px] border-border text-left no-underline cursor-pointer font-sans transition-colors hover:border-gold hover:bg-gold-light";

function QuickAction({
  href,
  onClick,
  icon,
  label,
  sub,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  const inner = (
    <>
      <span className="w-7 h-7 rounded-lg bg-gold-light text-gold-dark flex items-center justify-center">
        {icon}
      </span>
      <span className="text-xs font-medium text-ink">{label}</span>
      <span className="text-[10px] text-ink-3">{sub}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={QUICK_ACTION}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={QUICK_ACTION} onClick={onClick}>
      {inner}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Reviews
   ───────────────────────────────────────────────────────────────────────── */
function ReviewsCard({ reviews }: { reviews: Review[] }) {
  return (
    <div className={CARD}>
      <div className={CARD_HEAD}>
        <div className={CARD_TITLE}>Recent reviews</div>
        {reviews.length > 0 && (
          <Link href="/worker/reviews" className={CARD_LINK}>
            See all →
          </Link>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          sm
          icon={<Star size={36} />}
          title="No reviews yet"
          sub="Complete jobs to start receiving reviews from employers."
        />
      ) : (
        reviews.map((rev) => (
          <div
            key={rev.id}
            className="px-4 py-3 border-b-[0.5px] border-border last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <span className="w-[26px] h-[26px] rounded-full bg-gold-light border-[1.5px] border-gold/30 text-gold-dark text-[10px] font-semibold flex items-center justify-center shrink-0">
                {initialsOf(rev.authorName)}
              </span>
              <span className="flex-1 text-xs font-medium text-ink">
                {rev.authorName}
              </span>
              <Stars value={rev.rating} />
            </div>
            <p className="text-[11px] text-ink-2 mt-[5px] leading-normal line-clamp-2">
              {rev.text}
            </p>
            <div className="text-[10px] text-ink-3 mt-1">
              {shortDate(rev.date)}
            </div>
          </div>
        ))
      )}
    </div>
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
          size={12}
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
    <div
      className={cn(
        "flex flex-col items-center text-center px-6",
        sm ? "py-8" : "py-10",
      )}
    >
      <span className="text-border leading-none">{icon}</span>
      <div className="text-sm font-medium text-ink-2 mt-3">{title}</div>
      <p className="text-[13px] text-ink-3 leading-relaxed max-w-[240px] mt-1">
        {sub}
      </p>
      {cta && (
        <Link href={cta.href} className="mt-3.5">
          <Button type="button" variant="gold" size="sm">
            {cta.label}
          </Button>
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Loading skeleton — mirrors the real layout
   ───────────────────────────────────────────────────────────────────────── */
const SKEL = "bg-cream-2 rounded-md animate-pulse";

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
            key={i}
            className="bg-white border-[0.5px] border-border rounded-xl overflow-hidden"
          >
            <div className="h-[3px] bg-border" />
            <div className="px-[18px] py-4">
              <div className={cn(SKEL, "w-12 h-7")} />
              <div className={cn(SKEL, "w-[70%] h-3 mt-3")} />
              <div className={cn(SKEL, "w-[55%] h-2.5 mt-2")} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <SkeletonCard rows={3} heightClass="h-[92px]" />
          <SkeletonCard rows={2} heightClass="h-14" />
        </div>
        <div className="flex flex-col gap-4">
          <SkeletonCard rows={4} heightClass="h-5" />
          <SkeletonCard rows={2} heightClass="h-16" />
          <SkeletonCard rows={2} heightClass="h-12" />
        </div>
      </div>
    </>
  );
}

function SkeletonCard({
  rows,
  heightClass,
}: {
  rows: number;
  heightClass: string;
}) {
  return (
    <div className={CARD}>
      <div className={CARD_HEAD}>
        <div className={cn(SKEL, "w-[120px] h-3.5")} />
      </div>
      <div className="p-4 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
            key={i}
            className={cn(SKEL, "w-full", heightClass)}
          />
        ))}
      </div>
    </div>
  );
}
