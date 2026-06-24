"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Briefcase,
  CheckCheck,
  MessageSquare,
  Star,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth";
import { useSocket } from "@/hooks/useSocket";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../hooks/useNotificationActions";
import { useNotifications } from "../hooks/useNotifications";
import type { AppNotification } from "../types";
import "./notifications.css";

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
  new_review: Star,
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

  const badge =
    unread > 0 ? (
      <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
    ) : null;

  const trigger =
    variant === "bottom" ? (
      <button
        type="button"
        className={`dash-bottomitem notif-trigger${open ? " active" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span className="dash-bottomicon">
          <Bell size={19} />
          {badge}
        </span>
        Alerts
      </button>
    ) : variant === "nav" ? (
      <button
        type="button"
        className="nav-bell notif-trigger"
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
        className="dash-bell notif-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={16} />
        {badge}
      </button>
    );

  return (
    <div className={`notif notif--${variant}`} ref={wrapRef}>
      {trigger}
      {open && (
        <div className="notif-pop" role="dialog" aria-label="Notifications">
          <div className="notif-head">
            <span className="notif-title">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                className="notif-markall"
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {isLoading ? (
              <div className="notif-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={26} className="notif-empty-icon" />
                <span>You're all caught up</span>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <button
                    type="button"
                    key={n.id}
                    className={`notif-item${n.readAt ? "" : " unread"}`}
                    onClick={() => onItem(n)}
                  >
                    <span className="notif-item-icon">
                      <Icon size={15} />
                    </span>
                    <span className="notif-item-body">
                      <span className="notif-item-title">{n.title}</span>
                      {n.body && (
                        <span className="notif-item-sub">{n.body}</span>
                      )}
                      <span className="notif-item-time">
                        {relTime(n.createdAt)}
                      </span>
                    </span>
                    {!n.readAt && <span className="notif-item-dot" />}
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
