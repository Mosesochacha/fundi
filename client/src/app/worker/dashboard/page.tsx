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
import { useAuth } from "@/features/auth";
import type {
  ChecklistItem,
  JobRequest,
  Review,
  UpcomingJob,
} from "@/features/worker/dashboard";
import { useGetWorkerDashboard } from "@/features/worker/dashboard";
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
        ? `${window.location.origin}/profile/${username ?? ""}`
        : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: `${name} on Fundi`, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [profile?.username, name]);

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="worker" user={shellUser} currentPath={pathname}>
      <div className="wd">
        {/* ── Welcome row ─────────────────────────────────────────────── */}
        <div className="wd-welcome">
          <div>
            <div className="wd-date">{longDate(now)}</div>
            <h1 className="wd-greeting">
              {greeting(now)}, {firstName}.
            </h1>
          </div>
          <div className="wd-welcome-actions">
            <button
              type="button"
              className="wd-btn wd-btn-sm wd-btn-outline"
              onClick={shareProfile}
            >
              <Share2 size={14} /> Share profile
            </button>
            <Link
              href="/worker/profile"
              className="wd-btn wd-btn-sm wd-btn-gold"
            >
              Edit profile
            </Link>
          </div>
        </div>

        {isError && (
          <button type="button" className="wd-error" onClick={() => refetch()}>
            Could not load your dashboard. Tap to retry.
          </button>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── Stats grid ───────────────────────────────────────────── */}
            <div className="wd-stats">
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
                sub="Since joining Fundi"
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
            <div className="wd-cols">
              {/* LEFT */}
              <div className="wd-col">
                <JobRequestsCard requests={data?.recentRequests ?? []} />
                <UpcomingJobsCard jobs={data?.upcomingJobs ?? []} />
              </div>

              {/* RIGHT */}
              <div className="wd-col">
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
    <div className="wd-stat">
      <div className={`wd-stat-bar${highlighted ? " gold" : ""}`} />
      <div className="wd-stat-body">
        <div className={`wd-stat-num${gold ? " gold" : ""}`}>{value}</div>
        <div className="wd-stat-label">{label}</div>
        {trend ? (
          <div className="wd-trend">
            <TrendingUp size={11} /> {trend}
          </div>
        ) : sub ? (
          <div className="wd-stat-sub">{sub}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Job requests
   ───────────────────────────────────────────────────────────────────────── */
const TAG: Record<JobRequest["status"], { label: string; cls: string }> = {
  new: { label: "New", cls: "wd-tag-new" },
  today: { label: "Today", cls: "wd-tag-today" },
  active: { label: "Active", cls: "wd-tag-today" },
  completed: { label: "Completed", cls: "wd-tag-completed" },
};

function JobRequestsCard({ requests }: { requests: JobRequest[] }) {
  return (
    <div className="wd-card">
      <div className="wd-card-head">
        <div className="wd-card-title">
          Job requests
          {requests.length > 0 && (
            <span className="wd-count-badge">{requests.length}</span>
          )}
        </div>
        {requests.length > 0 && (
          <Link href="/worker/requests" className="wd-card-link">
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
    <div className={`wd-req${isNew ? " new" : ""}`}>
      <div className="wd-avatar">{initialsOf(req.clientName)}</div>
      <div className="wd-req-body">
        <div className="wd-req-top">
          <span className="wd-req-title">
            {req.jobType} · {req.location}
          </span>
          <span className={`wd-tag ${tag.cls}`}>{tag.label}</span>
        </div>
        <div className="wd-req-meta">
          <span>
            <Calendar size={12} /> {reqDateLabel(req.date)}
          </span>
          <span>
            <MapPin size={12} /> {req.location}
          </span>
        </div>
        <p className="wd-req-desc wd-clamp2">{req.description}</p>
        <div className="wd-req-actions">
          {req.status === "completed" ? (
            <Link
              href={`/worker/requests/${req.id}`}
              className="wd-btn wd-btn-sm wd-btn-outline"
            >
              Leave review
            </Link>
          ) : (
            <>
              <Link
                href={`/worker/messages?to=${req.id}`}
                className="wd-btn wd-btn-sm wd-btn-outline"
              >
                {isActive ? "Message client" : "Message"}
              </Link>
              <button type="button" className="wd-btn wd-btn-sm wd-btn-gold">
                {isActive ? "Mark complete" : "Accept job"}
              </button>
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
    <div className="wd-card">
      <div className="wd-card-head">
        <div className="wd-card-title">Upcoming jobs</div>
        {jobs.length > 0 && (
          <Link href="/worker/calendar" className="wd-card-link">
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
            <div key={j.id} className="wd-job">
              <div className="wd-date-tile">
                <span className="wd-date-day">{d.getDate()}</span>
                <span className="wd-date-mon">
                  {d.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </div>
              <div className="wd-job-body">
                <div className="wd-job-title">
                  {j.title} · {j.clientName}
                </div>
                <div className="wd-job-meta">
                  {j.location} · {j.time}
                </div>
              </div>
              <Link
                href={`/worker/messages?to=${j.id}`}
                className="wd-btn wd-btn-icon wd-btn-outline"
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
    <div className="wd-card">
      <div className="wd-card-pad">
        <div className="wd-strength-head">
          <div className="wd-card-title">Profile strength</div>
          <span className="wd-pct">{percentage}%</span>
        </div>
        <div className="wd-bar">
          <div className="wd-bar-fill" style={{ width: `${percentage}%` }} />
        </div>
        <p className="wd-hint">
          Complete your profile to get more job requests
        </p>

        {completed.map((item) => (
          <div key={item.key} className="wd-check done">
            <span className="wd-check-icon">
              <CheckCircle2 size={15} />
            </span>
            {item.label}
          </div>
        ))}
        {todo.map((item) => (
          <div key={item.key} className="wd-check todo">
            <span className="wd-check-icon">
              <CircleDashed size={15} />
            </span>
            {item.label}
            <Link
              href={item.href ?? "/worker/profile"}
              className="wd-btn wd-btn-xs wd-btn-gold wd-check-add"
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
    <div className="wd-card">
      <div className="wd-card-head">
        <div className="wd-card-title">Quick actions</div>
      </div>
      <div className="wd-actions-grid">
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
      <span className="wd-action-icon">{icon}</span>
      <span className="wd-action-label">{label}</span>
      <span className="wd-action-sub">{sub}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="wd-action">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className="wd-action" onClick={onClick}>
      {inner}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Reviews
   ───────────────────────────────────────────────────────────────────────── */
function ReviewsCard({ reviews }: { reviews: Review[] }) {
  return (
    <div className="wd-card">
      <div className="wd-card-head">
        <div className="wd-card-title">Recent reviews</div>
        {reviews.length > 0 && (
          <Link href="/worker/reviews" className="wd-card-link">
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
          <div key={rev.id} className="wd-review">
            <div className="wd-review-top">
              <span className="wd-avatar wd-avatar-sm">
                {initialsOf(rev.authorName)}
              </span>
              <span className="wd-review-name">{rev.authorName}</span>
              <Stars value={rev.rating} />
            </div>
            <p className="wd-review-text wd-clamp2">{rev.text}</p>
            <div className="wd-review-date">{shortDate(rev.date)}</div>
          </div>
        ))
      )}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="wd-stars" role="img" aria-label={`${value} out of 5`}>
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
    <div className={`wd-empty${sm ? " sm" : ""}`}>
      <span className="wd-empty-icon">{icon}</span>
      <div className="wd-empty-title">{title}</div>
      <p className="wd-empty-sub">{sub}</p>
      {cta && (
        <Link href={cta.href} className="wd-btn wd-btn-sm wd-btn-gold">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Loading skeleton — mirrors the real layout
   ───────────────────────────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <>
      <div className="wd-stats">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
            key={i}
            className="wd-stat"
          >
            <div className="wd-stat-bar" />
            <div className="wd-stat-body">
              <div className="wd-skel" style={{ width: 48, height: 28 }} />
              <div
                className="wd-skel"
                style={{ width: "70%", height: 12, marginTop: 12 }}
              />
              <div
                className="wd-skel"
                style={{ width: "55%", height: 10, marginTop: 8 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="wd-cols">
        <div className="wd-col">
          <SkeletonCard rows={3} height={92} />
          <SkeletonCard rows={2} height={56} />
        </div>
        <div className="wd-col">
          <SkeletonCard rows={4} height={20} />
          <SkeletonCard rows={2} height={64} />
          <SkeletonCard rows={2} height={48} />
        </div>
      </div>
    </>
  );
}

function SkeletonCard({ rows, height }: { rows: number; height: number }) {
  return (
    <div className="wd-card">
      <div className="wd-card-head">
        <div className="wd-skel" style={{ width: 120, height: 14 }} />
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
            className="wd-skel"
            style={{ width: "100%", height }}
          />
        ))}
      </div>
    </div>
  );
}
