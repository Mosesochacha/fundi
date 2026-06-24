"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Briefcase,
  CheckCheck,
  Clock,
  Eye,
  MessageSquare,
  Star,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../hooks/useNotificationActions";
import { useNotifications } from "../hooks/useNotifications";
import type { AppNotification } from "../types";

type Variant = "dash" | "bottom" | "nav";

const ICONS: Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  new_message: MessageSquare,
  new_request: Briefcase,
  job_accepted: Briefcase,
  job_declined: XCircle,
  job_completed: CheckCheck,
  job_cancelled: XCircle,
  job_reminder: Clock,
  new_review: Star,
  profile_views: Eye,
};

function iconFor(type: string) {
  return ICONS[type] ?? Bell;
}

/** "now" / "5m" / "3h" / "2d" / "12 Jun" */
function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/** Where a notification deep-links, resolved against the viewer's own role. */
function hrefFor(n: AppNotification, role: string | undefined): string | null {
  const base = role === "employer" ? "/employer" : "/worker";
  if (n.data?.conversationId)
    return `${base}/messages?c=${n.data.conversationId}`;
  if (n.type === "new_request") return `${base}/requests`;
  return n.link ?? null;
}

export default function NotificationBell({
  variant = "dash",
}: {
  variant?: Variant;
}) {
  const { isLoggedIn, role } = useAuth();
  const qc = useQueryClient();
  const socket = useSocket();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useNotifications(isLoggedIn);
  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  // Real-time: a `notification` socket event just refetches the list + count.
  useEffect(() => {
    if (!socket) return;
    const onNotif = () => qc.invalidateQueries({ queryKey: ["notifications"] });
    socket.on("notification", onNotif);
    return () => {
      socket.off("notification", onNotif);
    };
  }, [socket, qc]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!isLoggedIn) return null;

  const onItem = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    setOpen(false);
    const href = hrefFor(n, role);
    if (href) router.push(href);
  };

  // Unread count badge. Ring colour differs per surface (white dash/bottom is
  // navy, nav sits on cream-2).
  const badge =
    unread > 0 ? (
      <span
        className={cn(
          "absolute min-w-[16px] h-4 px-1 rounded-full bg-gold text-navy text-[10px] font-bold leading-4 text-center",
          variant === "bottom"
            ? "-top-[7px] -right-[9px] ring-2 ring-navy"
            : variant === "nav"
              ? "-top-0.5 -right-0.5 ring-2 ring-cream-2"
              : "-top-0.5 -right-0.5 ring-2 ring-white",
        )}
      >
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  const trigger =
    variant === "bottom" ? (
      <button
        type="button"
        className={cn(
          "relative flex-1 flex flex-col items-center justify-center gap-[3px] text-[10px] no-underline",
          open ? "text-gold" : "text-white/45",
        )}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span className="relative">
          <Bell size={19} />
          {badge}
        </span>
        Alerts
      </button>
    ) : variant === "nav" ? (
      <button
        type="button"
        className="relative w-[38px] h-[38px] rounded-lg border border-border bg-white flex items-center justify-center text-ink-2 transition-colors hover:border-gold hover:text-gold-dark cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} strokeWidth={1.75} />
        {badge}
      </button>
    ) : (
      <button
        type="button"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-ink-2 transition-colors hover:bg-cream cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={16} />
        {badge}
      </button>
    );

  return (
    <div
      className={cn(
        "relative inline-flex",
        variant === "bottom" && "flex-1 flex",
      )}
      ref={wrapRef}
    >
      {trigger}
      {open && (
        <div
          className={cn(
            "bg-white border border-border rounded-[14px] shadow-[0_18px_44px_-18px_rgba(13,27,42,0.4)] z-[200] overflow-hidden flex flex-col",
            variant === "bottom"
              ? "fixed left-2.5 right-2.5 bottom-[66px]"
              : "absolute top-[calc(100%+10px)] right-0 w-[344px] max-w-[calc(100vw-24px)]",
          )}
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between px-4 py-[13px] border-b border-border">
            <span className="text-sm font-bold text-navy">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                className="border-none bg-transparent text-gold-dark text-sm font-semibold cursor-pointer p-0 hover:underline"
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>

          <div
            className={cn(
              "overflow-y-auto",
              variant === "bottom" ? "max-h-[56vh]" : "max-h-[60vh]",
            )}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-ink-3 text-sm">
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-ink-3 text-sm">
                <Bell size={26} className="text-ink-4" />
                <span>You're all caught up</span>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <button
                    type="button"
                    key={n.id}
                    className={cn(
                      "flex gap-[11px] items-start w-full text-left px-4 py-3 border-none border-b border-border last:border-b-0 cursor-pointer",
                      n.readAt
                        ? "bg-transparent hover:bg-cream"
                        : "bg-gold-light hover:bg-gold/15",
                    )}
                    onClick={() => onItem(n)}
                  >
                    <span className="flex-none w-[30px] h-[30px] rounded-full flex items-center justify-center bg-navy text-gold">
                      <Icon size={15} />
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-semibold text-ink leading-[1.3]">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="text-sm text-ink-2 overflow-hidden text-ellipsis whitespace-nowrap">
                          {n.body}
                        </span>
                      )}
                      <span className="text-[11px] text-ink-3 mt-px">
                        {relTime(n.createdAt)}
                      </span>
                    </span>
                    {!n.readAt && (
                      <span className="flex-none w-[7px] h-[7px] rounded-full bg-gold mt-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
