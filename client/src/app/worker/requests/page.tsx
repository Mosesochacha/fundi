"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Star,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";
import {
  EMPTY_STATS,
  type JobRequest,
  type RequestFilter,
  type SortOption,
  useAcceptRequest,
  useDeclineRequest,
  useGetRequests,
  useGetRequestStats,
  useMarkComplete,
} from "@/features/worker/requests";
import { useToastContext } from "@/context/ToastContext";
import { useSocket } from "@/hooks/useSocket";
import "./requests.css";

/* ── Small formatting helpers ─────────────────────────────────────────────── */
const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

/** "2 Jun, 9:00 AM" style label for a scheduled job. */
const scheduledLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

/** Just the time, e.g. "9:00 AM" — used in the "Today · …" badge. */
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

/** Compact "time ago" from an ISO timestamp. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/** Locale-grouped number for the rate pill — no hardcoded currency symbol. */
const formatRate = (n: number) => new Intl.NumberFormat().format(n);

const SORTS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "scheduled", label: "By date scheduled" },
  { value: "rate", label: "By rate" },
];

function sortRequests(list: JobRequest[], sort: SortOption): JobRequest[] {
  const copy = [...list];
  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
      );
    case "scheduled":
      return copy.sort(
        (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt),
      );
    case "rate":
      return copy.sort((a, b) => b.agreedRate - a.agreedRate);
    default:
      return copy.sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────────────────── */
export default function WorkerRequestsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  const [filter, setFilter] = useState<RequestFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const { data, isLoading, isError, refetch } = useGetRequests(filter);
  const { data: statsData } = useGetRequestStats();
  const stats = statsData ?? EMPTY_STATS;

  const requests = useMemo(
    () => sortRequests(data ?? [], sort),
    [data, sort],
  );

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Worker";
  const shellUser = { name, initials: initialsOf(name) };

  // ── Real-time: surface new requests pushed over the socket ────────────────
  const qc = useQueryClient();
  const toast = useToastContext();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const onNewRequest = (payload?: { employerName?: string }) => {
      toastRef.current.success(
        `New job request from ${payload?.employerName ?? "an employer"}!`,
      );
      qc.invalidateQueries({ queryKey: ["worker", "requests"] });
    };
    socket.on("new_request", onNewRequest);
    return () => {
      socket.off("new_request", onNewRequest);
    };
  }, [socket, qc]);

  const tabs: { value: RequestFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: stats.total },
    { value: "new", label: "New", count: stats.new },
    { value: "active", label: "Active", count: stats.active },
    { value: "completed", label: "Completed", count: stats.completed },
    { value: "declined", label: "Declined", count: stats.declined },
  ];

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell
      role="worker"
      user={shellUser}
      currentPath={pathname}
      unreadRequests={stats.new}
    >
      <div className="wr">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="wr-head">
          <h1 className="wr-title">Job requests</h1>
          <p className="wr-sub">Manage all incoming and active job requests</p>
        </div>

        {/* ── Stat strip ─────────────────────────────────────────────────── */}
        <div className="wr-stats">
          <StatCard
            accent="gold"
            value={stats.new}
            gold
            label="New requests"
            sub="Awaiting response"
          />
          <StatCard
            accent="blue"
            value={stats.active}
            label="Active jobs"
            sub="In progress"
          />
          <StatCard
            accent="green"
            value={stats.completed}
            label="Completed"
            sub="This month"
          />
          <StatCard
            accent="default"
            value={stats.declined}
            label="Declined"
            sub="This month"
          />
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="wr-filters">
          <div className="wr-tabs">
            {tabs.map((t, i) => (
              <Fragment key={t.value}>
                {i === 1 && <span className="wr-sep" />}
                <button
                  type="button"
                  className={`wr-tab${filter === t.value ? " active" : ""}`}
                  onClick={() => setFilter(t.value)}
                >
                  {t.label}
                  <span className="wr-tab-count">{t.count}</span>
                </button>
              </Fragment>
            ))}
          </div>
          <label className="wr-sort-wrap">
            Sort
            <select
              className="wr-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {isError && (
          <button type="button" className="wr-error" onClick={() => refetch()}>
            Could not load your requests. Tap to retry.
          </button>
        )}

        {/* ── List / states ──────────────────────────────────────────────── */}
        {isLoading ? (
          <RequestsSkeleton />
        ) : requests.length === 0 ? (
          <EmptyState filter={filter} totalAll={stats.total} />
        ) : (
          <div className="wr-list">
            {requests.map((r) => (
              <RequestCard key={r.id} req={r} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Stat card
   ───────────────────────────────────────────────────────────────────────── */
function StatCard({
  accent,
  value,
  label,
  sub,
  gold,
}: {
  accent: "gold" | "blue" | "green" | "default";
  value: number;
  label: string;
  sub: string;
  gold?: boolean;
}) {
  return (
    <div className="wr-stat">
      <div
        className={`wr-stat-bar${accent === "default" ? "" : ` ${accent}`}`}
      />
      <div className="wr-stat-body">
        <div className={`wr-stat-num${gold ? " gold" : ""}`}>{value}</div>
        <div className="wr-stat-label">{label}</div>
        <div className="wr-stat-sub">{sub}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Request card
   ───────────────────────────────────────────────────────────────────────── */
function RequestCard({ req }: { req: JobRequest }) {
  const { success, error: toastError } = useToastContext();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();
  const complete = useMarkComplete();

  // Which inline confirmation, if any, is open.
  const [confirm, setConfirm] = useState<null | "decline" | "complete">(null);

  const busy =
    (accept.isPending && accept.variables === req.id) ||
    (decline.isPending && decline.variables === req.id) ||
    (complete.isPending && complete.variables === req.id);

  const onAccept = () =>
    accept.mutate(req.id, {
      onSuccess: () => success("Job accepted — it's now an active job."),
      onError: () => toastError("Couldn't accept the job. Please try again."),
    });

  const onDecline = () => {
    setConfirm(null);
    decline.mutate(req.id, {
      onSuccess: () => success("Request declined."),
      onError: () => toastError("Couldn't decline the request. Try again."),
    });
  };

  const onComplete = () => {
    setConfirm(null);
    complete.mutate(req.id, {
      onSuccess: () => success("Job marked complete. The client was notified."),
      onError: () => toastError("Couldn't mark complete. Please try again."),
    });
  };

  const openDirections = () => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(req.location)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const messageHref = `/worker/messages?to=${req.employer.id}`;

  return (
    <div className={`wr-card ${req.status}`}>
      {/* Header */}
      <div className="wr-card-head">
        <div
          className="wr-avatar"
          style={{ background: req.employer.avatarColor }}
        >
          {req.employer.initials}
        </div>
        <div className="wr-card-mid">
          <div className="wr-card-row1">
            <span className="wr-job-title">{req.title}</span>
            <StatusBadge req={req} />
          </div>
          <div className="wr-card-meta">
            <span>
              <Calendar size={12} /> {scheduledLabel(req.scheduledAt)}
            </span>
            <span>
              <MapPin size={12} /> {req.location}
            </span>
            <span>
              <Clock size={12} /> {req.estimatedDuration}
            </span>
          </div>
        </div>
        <div className="wr-card-right">
          <span className="wr-timeago">{timeAgo(req.createdAt)}</span>
          <span className="wr-rate">{formatRate(req.agreedRate)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="wr-card-body">
        <p className="wr-desc">{req.description}</p>
        {req.tags.length > 0 && (
          <div className="wr-tags">
            {req.tags.map((tag) => (
              <span key={tag} className="wr-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Inline confirmation */}
      {confirm === "decline" && (
        <div className="wr-confirm danger">
          <span className="wr-confirm-text">
            <strong>Are you sure?</strong> You can&apos;t undo this.
          </span>
          <div className="wr-confirm-actions">
            <button
              type="button"
              className="wr-btn wr-btn-outline"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="wr-btn wr-btn-red"
              onClick={onDecline}
            >
              Yes, decline
            </button>
          </div>
        </div>
      )}
      {confirm === "complete" && (
        <div className="wr-confirm">
          <span className="wr-confirm-text">
            <strong>Mark this job as complete?</strong> The client will be
            notified and asked to leave a review.
          </span>
          <div className="wr-confirm-actions">
            <button
              type="button"
              className="wr-btn wr-btn-outline"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="wr-btn wr-btn-gold"
              onClick={onComplete}
            >
              Yes, complete
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="wr-card-foot">
        <div className="wr-emp">
          <div
            className="wr-emp-avatar"
            style={{ background: req.employer.avatarColor }}
          >
            {req.employer.initials}
          </div>
          <div className="wr-emp-info">
            <div className="wr-emp-name">{req.employer.name}</div>
            <EmployerSub employer={req.employer} />
          </div>
        </div>

        <div className="wr-actions">
          <CardActions
            req={req}
            busy={busy}
            messageHref={messageHref}
            onAccept={onAccept}
            onAskDecline={() => setConfirm("decline")}
            onAskComplete={() => setConfirm("complete")}
            onDirections={openDirections}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Status badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ req }: { req: JobRequest }) {
  if (req.status === "new") {
    return (
      <span className="wr-badge new">
        <Clock size={11} /> New request
      </span>
    );
  }
  if (req.status === "active") {
    if (req.isToday) {
      return (
        <span className="wr-badge today">
          <Zap size={11} /> Today · {timeLabel(req.scheduledAt)}
        </span>
      );
    }
    return (
      <span className="wr-badge inprogress">
        <Clock size={11} /> In progress
        {req.dayProgress
          ? ` · Day ${req.dayProgress.current}/${req.dayProgress.total}`
          : ""}
      </span>
    );
  }
  if (req.status === "completed") {
    return (
      <span className="wr-badge completed">
        <CheckCircle2 size={11} /> Completed
      </span>
    );
  }
  return <span className="wr-badge declined">Declined</span>;
}

/* ── Footer action buttons (vary by status) ───────────────────────────────── */
function CardActions({
  req,
  busy,
  messageHref,
  onAccept,
  onAskDecline,
  onAskComplete,
  onDirections,
}: {
  req: JobRequest;
  busy: boolean;
  messageHref: string;
  onAccept: () => void;
  onAskDecline: () => void;
  onAskComplete: () => void;
  onDirections: () => void;
}) {
  if (req.status === "new") {
    return (
      <>
        <Link href={messageHref} className="wr-btn wr-btn-outline">
          Message
        </Link>
        <button
          type="button"
          className="wr-btn wr-btn-red"
          onClick={onAskDecline}
          disabled={busy}
        >
          Decline
        </button>
        <button
          type="button"
          className="wr-btn wr-btn-gold"
          onClick={onAccept}
          disabled={busy}
        >
          <CheckCircle2 size={14} /> Accept job
        </button>
      </>
    );
  }

  if (req.status === "active") {
    return (
      <>
        <Link href={messageHref} className="wr-btn wr-btn-outline">
          Message client
        </Link>
        {req.isToday && (
          <button
            type="button"
            className="wr-btn wr-btn-blue"
            onClick={onDirections}
          >
            <MapPin size={14} /> Get directions
          </button>
        )}
        <button
          type="button"
          className="wr-btn wr-btn-gold"
          onClick={onAskComplete}
          disabled={busy}
        >
          <CheckCircle2 size={14} /> Mark complete
        </button>
      </>
    );
  }

  if (req.status === "completed") {
    return (
      <>
        {req.review && (
          <span className="wr-review-inline">
            <Stars value={req.review.rating} />
          </span>
        )}
        <Link
          href={`/worker/requests/${req.id}`}
          className="wr-btn wr-btn-outline"
        >
          {req.review ? "View review" : "View job details"}
        </Link>
      </>
    );
  }

  // declined
  return (
    <Link href={`/worker/requests/${req.id}`} className="wr-btn wr-btn-outline">
      View details
    </Link>
  );
}

/* ── Employer sub-line ────────────────────────────────────────────────────── */
function EmployerSub({ employer }: { employer: JobRequest["employer"] }) {
  if (employer.totalHires === 0) {
    return <div className="wr-emp-sub">Employer · New to Fundi</div>;
  }
  return (
    <div className="wr-emp-sub">
      Employer · {employer.totalHires} hire
      {employer.totalHires === 1 ? "" : "s"}
      {employer.rating != null && (
        <>
          {" · "}
          <Star size={10} fill="currentColor" strokeWidth={0} />
          {employer.rating.toFixed(1)}
        </>
      )}
    </div>
  );
}

/* ── Stars row ────────────────────────────────────────────────────────────── */
function Stars({ value }: { value: number }) {
  return (
    <span className="wr-stars" role="img" aria-label={`${value} out of 5`}>
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
   Empty states
   ───────────────────────────────────────────────────────────────────────── */
function EmptyState({
  filter,
  totalAll,
}: {
  filter: RequestFilter;
  totalAll: number;
}) {
  // Brand-new worker with no requests at all.
  if (totalAll === 0) {
    return (
      <div className="wr-empty">
        <span className="wr-empty-icon">
          <FileText size={44} />
        </span>
        <div className="wr-empty-title">No job requests yet</div>
        <p className="wr-empty-sub">
          Complete your profile and share it to start receiving requests from
          employers.
        </p>
        <Link href="/worker/profile" className="wr-btn wr-btn-gold">
          Complete profile
        </Link>
      </div>
    );
  }

  const copy: Record<RequestFilter, { title: string; sub: string }> = {
    all: {
      title: "No requests here",
      sub: "Requests will appear here as employers reach out.",
    },
    new: {
      title: "No new requests",
      sub: "New job requests will appear here when employers contact you.",
    },
    active: {
      title: "No active jobs",
      sub: "Jobs you accept will appear here.",
    },
    completed: {
      title: "No completed jobs yet",
      sub: "Jobs you finish will be recorded here.",
    },
    declined: {
      title: "No declined requests",
      sub: "Requests you decline will appear here.",
    },
  };

  const { title, sub } = copy[filter];
  return (
    <div className="wr-empty">
      <span className="wr-empty-icon">
        <FileText size={44} />
      </span>
      <div className="wr-empty-title">{title}</div>
      <p className="wr-empty-sub">{sub}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Loading skeleton — three cards mirroring the real layout
   ───────────────────────────────────────────────────────────────────────── */
function RequestsSkeleton() {
  return (
    <div className="wr-list">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
          key={i}
          className="wr-card"
        >
          <div className="wr-card-head">
            <div
              className="wr-skel"
              style={{ width: 42, height: 42, borderRadius: "50%" }}
            />
            <div className="wr-card-mid">
              <div className="wr-skel" style={{ width: "45%", height: 14 }} />
              <div
                className="wr-skel"
                style={{ width: "70%", height: 11, marginTop: 8 }}
              />
            </div>
            <div className="wr-skel" style={{ width: 60, height: 22 }} />
          </div>
          <div className="wr-card-body">
            <div className="wr-skel" style={{ width: "100%", height: 11 }} />
            <div
              className="wr-skel"
              style={{ width: "80%", height: 11, marginTop: 6 }}
            />
          </div>
          <div className="wr-card-foot">
            <div className="wr-skel" style={{ width: 140, height: 28 }} />
            <div className="wr-skel" style={{ width: 180, height: 30 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
