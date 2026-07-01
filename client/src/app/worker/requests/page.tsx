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
import { Select } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/features/auth";
import {
  EMPTY_STATS,
  type JobRequest,
  type RequestFilter,
  type SortOption,
  useAcceptRequest,
  useDeclineRequest,
  useGetRequestStats,
  useGetRequests,
  useMarkComplete,
} from "@/features/worker/requests";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

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

/** Just the time, e.g. "9:00 AM" - used in the "Today · …" badge. */
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

/** Locale-grouped number for the rate pill - no hardcoded currency symbol. */
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

const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 font-sans font-medium text-sm px-[11px] py-1.5 rounded-lg border-[0.5px] cursor-pointer no-underline whitespace-nowrap transition-colors disabled:opacity-55 disabled:cursor-not-allowed max-[640px]:w-full";
const BTN_GOLD =
  "bg-gold text-navy border-gold enabled:hover:bg-gold-dark enabled:hover:border-gold-dark";
const BTN_OUTLINE =
  "bg-white text-ink-2 border-border hover:border-gold hover:bg-gold-light hover:text-ink";
const BTN_RED =
  "bg-white text-red-600 border-red-200 enabled:hover:bg-red-50 enabled:hover:border-red-600";
const BTN_BLUE =
  "bg-white text-blue-600 border-blue-500/40 hover:bg-blue-50 hover:border-blue-600";

export default function WorkerRequestsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  const [filter, setFilter] = useState<RequestFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const { data, isLoading, isError, refetch } = useGetRequests(filter);
  const { data: statsData } = useGetRequestStats();
  const stats = statsData ?? EMPTY_STATS;

  const requests = useMemo(() => sortRequests(data ?? [], sort), [data, sort]);

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Worker";
  const shellUser = { name, initials: initialsOf(name) };

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
      <div className="flex flex-col gap-5 text-ink-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-serif text-[26px] font-normal text-ink leading-[1.15]">
            Job requests
          </h1>
          <p className="text-sm text-ink-3">
            Manage all incoming and active job requests
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
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

        <div className="flex items-center gap-2 flex-wrap bg-white border-[0.5px] border-border rounded-[10px] px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap max-[640px]:flex-nowrap max-[640px]:overflow-x-auto max-[640px]:[scrollbar-width:none] max-[640px]:[&::-webkit-scrollbar]:hidden">
            {tabs.map((t, i) => (
              <Fragment key={t.value}>
                {i === 1 && (
                  <span className="w-px self-stretch bg-border scale-x-50 mx-0.5 my-0.5" />
                )}
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 font-sans text-sm font-medium px-3 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors hover:border-gold",
                    filter === t.value
                      ? "border-gold bg-gold-light text-gold-dark"
                      : "border-border bg-cream text-ink-2",
                  )}
                  onClick={() => setFilter(t.value)}
                >
                  {t.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold leading-none",
                      filter === t.value
                        ? "bg-gold-dark text-white"
                        : "bg-gold text-navy",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              </Fragment>
            ))}
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 text-ink-3 text-sm max-[640px]:ml-0">
            <span>Sort</span>
            <Select
              value={sort}
              onChange={(v) => setSort(v as SortOption)}
              options={SORTS}
              aria-label="Sort requests"
              className="bg-cream py-1.5"
            />
          </div>
        </div>

        {isError && (
          <button
            type="button"
            className="block w-full text-center bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm font-medium font-sans cursor-pointer"
            onClick={() => refetch()}
          >
            Could not load your requests. Tap to retry.
          </button>
        )}

        {isLoading ? (
          <RequestsSkeleton />
        ) : requests.length === 0 ? (
          <EmptyState filter={filter} totalAll={stats.total} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {requests.map((r) => (
              <RequestCard key={r.id} req={r} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

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
  const barColor = {
    gold: "bg-gold",
    blue: "bg-blue-500",
    green: "bg-green-400",
    default: "bg-border",
  }[accent];

  return (
    <div className="bg-white border-[0.5px] border-border rounded-[10px] overflow-hidden">
      <div className={cn("h-0.5", barColor)} />
      <div className="px-4 py-3.5">
        <div
          className={cn(
            "font-serif text-2xl font-normal leading-none",
            gold ? "text-gold-dark" : "text-ink",
          )}
        >
          {value}
        </div>
        <div className="text-sm font-medium text-ink-2 mt-2">{label}</div>
        <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function RequestCard({ req }: { req: JobRequest }) {
  const { success, error: toastError } = useToastContext();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();
  const complete = useMarkComplete();

  const [confirm, setConfirm] = useState<null | "decline" | "complete">(null);

  const busy =
    (accept.isPending && accept.variables === req.id) ||
    (decline.isPending && decline.variables === req.id) ||
    (complete.isPending && complete.variables === req.id);

  const onAccept = () =>
    accept.mutate(req.id, {
      onSuccess: () => success("Job accepted - it's now an active job."),
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

  const leftBorder = {
    new: "border-l-gold",
    active: "border-l-blue-500",
    completed: "border-l-green-400",
    declined: "border-l-border",
  }[req.status];

  return (
    <div
      className={cn(
        "bg-white border-[0.5px] border-border rounded-xl overflow-hidden border-l-[3px] transition-colors",
        leftBorder,
        req.status === "declined" ? "opacity-70" : "hover:border-gold",
      )}
    >
      <div className="flex gap-3 px-4 py-3.5 border-b-[0.5px] border-border">
        <div
          className="w-[42px] h-[42px] rounded-full text-white text-sm font-semibold flex items-center justify-center shrink-0"
          style={{ background: req.employer.avatarColor }}
        >
          {req.employer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-ink">{req.title}</span>
            <StatusBadge req={req} />
          </div>
          <div className="flex items-center flex-wrap gap-2.5 text-[11px] text-ink-3 mt-1.5 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1">
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
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[11px] text-ink-3 whitespace-nowrap">
            {timeAgo(req.createdAt)}
          </span>
          <span className="bg-gold-light border border-gold/40 text-gold-dark text-sm font-semibold rounded-full px-2.5 py-[3px] whitespace-nowrap">
            {formatRate(req.agreedRate)}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 border-b-[0.5px] border-border">
        <p className="text-sm text-ink-2 leading-relaxed line-clamp-3">
          {req.description}
        </p>
        {req.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2.5">
            {req.tags.map((tag) => (
              <span
                key={tag}
                className="bg-cream border-[0.5px] border-border rounded-full px-2.5 py-[3px] text-[11px] text-ink-2"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {confirm === "decline" && (
        <div className="flex items-center justify-between gap-3 flex-wrap mx-4 mb-3 px-3 py-2.5 rounded-[10px] bg-red-50 border border-red-200">
          <span className="text-sm text-ink-2 leading-snug">
            <strong className="text-ink font-semibold">Are you sure?</strong>{" "}
            You can&apos;t undo this.
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className={cn(BTN_BASE, BTN_OUTLINE)}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn(BTN_BASE, BTN_RED)}
              onClick={onDecline}
            >
              Yes, decline
            </button>
          </div>
        </div>
      )}
      {confirm === "complete" && (
        <div className="flex items-center justify-between gap-3 flex-wrap mx-4 mb-3 px-3 py-2.5 rounded-[10px] bg-cream border-[0.5px] border-border">
          <span className="text-sm text-ink-2 leading-snug">
            <strong className="text-ink font-semibold">
              Mark this job as complete?
            </strong>{" "}
            The client will be notified and asked to leave a review.
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className={cn(BTN_BASE, BTN_OUTLINE)}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn(BTN_BASE, BTN_GOLD)}
              onClick={onComplete}
            >
              Yes, complete
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-3 max-[640px]:flex-col max-[640px]:items-stretch">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full text-white text-[11px] font-semibold flex items-center justify-center shrink-0"
            style={{ background: req.employer.avatarColor }}
          >
            {req.employer.initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink">
              {req.employer.name}
            </div>
            <EmployerSub employer={req.employer} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 max-[640px]:flex-col">
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

function StatusBadge({ req }: { req: JobRequest }) {
  const BADGE =
    "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-[9px] py-[3px] whitespace-nowrap shrink-0 border";
  if (req.status === "new") {
    return (
      <span
        className={cn(BADGE, "bg-gold-light border-gold/40 text-gold-dark")}
      >
        <Clock size={11} /> New request
      </span>
    );
  }
  if (req.status === "active") {
    if (req.isToday) {
      return (
        <span
          className={cn(
            BADGE,
            "bg-orange-50 border-orange-500/40 text-orange-600",
          )}
        >
          <Zap size={11} /> Today · {timeLabel(req.scheduledAt)}
        </span>
      );
    }
    return (
      <span
        className={cn(BADGE, "bg-blue-50 border-blue-500/40 text-blue-600")}
      >
        <Clock size={11} /> In progress
        {req.dayProgress
          ? ` · Day ${req.dayProgress.current}/${req.dayProgress.total}`
          : ""}
      </span>
    );
  }
  if (req.status === "completed") {
    return (
      <span
        className={cn(BADGE, "bg-green-50 border-green-400/50 text-green-600")}
      >
        <CheckCircle2 size={11} /> Completed
      </span>
    );
  }
  return (
    <span className={cn(BADGE, "bg-cream-2 border-border text-ink-3")}>
      Declined
    </span>
  );
}

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
        <Link href={messageHref} className={cn(BTN_BASE, BTN_OUTLINE)}>
          Message
        </Link>
        <button
          type="button"
          className={cn(BTN_BASE, BTN_RED)}
          onClick={onAskDecline}
          disabled={busy}
        >
          Decline
        </button>
        <button
          type="button"
          className={cn(BTN_BASE, BTN_GOLD)}
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
        <Link href={messageHref} className={cn(BTN_BASE, BTN_OUTLINE)}>
          Message client
        </Link>
        {req.isToday && (
          <button
            type="button"
            className={cn(BTN_BASE, BTN_BLUE)}
            onClick={onDirections}
          >
            <MapPin size={14} /> Get directions
          </button>
        )}
        <button
          type="button"
          className={cn(BTN_BASE, BTN_GOLD)}
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
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
            <Stars value={req.review.rating} />
          </span>
        )}
        <Link
          href={`/worker/requests/${req.id}`}
          className={cn(BTN_BASE, BTN_OUTLINE)}
        >
          {req.review ? "View review" : "View job details"}
        </Link>
      </>
    );
  }

  return (
    <Link
      href={`/worker/requests/${req.id}`}
      className={cn(BTN_BASE, BTN_OUTLINE)}
    >
      View details
    </Link>
  );
}

function EmployerSub({ employer }: { employer: JobRequest["employer"] }) {
  if (employer.totalHires === 0) {
    return (
      <div className="flex items-center gap-[3px] text-[10px] text-ink-3">
        Employer · New to Tesilix
      </div>
    );
  }
  return (
    <div className="flex items-center gap-[3px] text-[10px] text-ink-3">
      Employer · {employer.totalHires} hire
      {employer.totalHires === 1 ? "" : "s"}
      {employer.rating != null && (
        <>
          {" · "}
          <Star
            size={10}
            fill="currentColor"
            strokeWidth={0}
            className="text-gold"
          />
          {employer.rating.toFixed(1)}
        </>
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

function EmptyState({
  filter,
  totalAll,
}: {
  filter: RequestFilter;
  totalAll: number;
}) {
  const wrapCls =
    "flex flex-col items-center text-center px-6 py-[60px] bg-white border-[0.5px] border-border rounded-xl";

  if (totalAll === 0) {
    return (
      <div className={wrapCls}>
        <span className="text-border leading-none">
          <FileText size={44} />
        </span>
        <div className="text-[15px] font-medium text-ink-2 mt-3.5">
          No job requests yet
        </div>
        <p className="text-sm text-ink-3 leading-relaxed max-w-[280px] mt-1">
          Complete your profile and share it to start receiving requests from
          employers.
        </p>
        <Link href="/worker/profile" className={cn(BTN_BASE, BTN_GOLD, "mt-4")}>
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
    <div className={wrapCls}>
      <span className="text-border leading-none">
        <FileText size={44} />
      </span>
      <div className="text-[15px] font-medium text-ink-2 mt-3.5">{title}</div>
      <p className="text-sm text-ink-3 leading-relaxed max-w-[280px] mt-1">
        {sub}
      </p>
    </div>
  );
}

const SKEL = "bg-cream-2 rounded-md animate-pulse";

function RequestsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton row
          key={i}
          className="bg-white border-[0.5px] border-border rounded-xl overflow-hidden border-l-[3px] border-l-border"
        >
          <div className="flex gap-3 px-4 py-3.5 border-b-[0.5px] border-border">
            <div className={cn(SKEL, "w-[42px] h-[42px] rounded-full")} />
            <div className="flex-1 min-w-0">
              <div className={cn(SKEL, "w-[45%] h-3.5")} />
              <div className={cn(SKEL, "w-[70%] h-[11px] mt-2")} />
            </div>
            <div className={cn(SKEL, "w-[60px] h-[22px]")} />
          </div>
          <div className="px-4 py-3 border-b-[0.5px] border-border">
            <div className={cn(SKEL, "w-full h-[11px]")} />
            <div className={cn(SKEL, "w-[80%] h-[11px] mt-1.5")} />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className={cn(SKEL, "w-[140px] h-7")} />
            <div className={cn(SKEL, "w-[180px] h-[30px]")} />
          </div>
        </div>
      ))}
    </div>
  );
}
