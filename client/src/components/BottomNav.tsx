"use client";

import {
  Compass,
  Home,
  MessageCircle,
  PenSquare,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";
import client from "@/lib/axios";

export default function BottomNav() {
  const pathname = usePathname();
  const { profile, isLoggedIn, role } = useAuth();
  const [unread, setUnread] = useState(0);
  const home = dashboardPathForRole(role);

  useEffect(() => {
    if (!isLoggedIn) return;
    client
      .get("/messages/conversations")
      .then((r) => {
        const data = r.data?.data;
        if (Array.isArray(data)) {
          setUnread(
            data.reduce(
              (sum: number, c: { unreadCount: number }) =>
                sum + (c.unreadCount ?? 0),
              0,
            ),
          );
        }
      })
      .catch(() => {});
  }, [isLoggedIn, pathname]);

  if (!isLoggedIn) return null;

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 safe-area-bottom">
      <div className="flex items-end h-16 pb-1">
        {/* Home */}
        <Link
          href={home}
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors ${
            isActive(home)
              ? "text-primary"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Home
            className={`w-5 h-5 ${isActive(home) ? "stroke-[2.5]" : "stroke-2"}`}
          />
          <span>Home</span>
        </Link>

        {/* Browse */}
        <Link
          href="/browse"
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors ${
            isActive("/browse")
              ? "text-primary"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Compass
            className={`w-5 h-5 ${isActive("/browse") ? "stroke-[2.5]" : "stroke-2"}`}
          />
          <span>Browse</span>
        </Link>

        {/* Create — raised FAB */}
        <Link
          href="/post/new"
          className="flex-1 flex flex-col items-center justify-end gap-1 pb-0.5"
        >
          <div
            className={`w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 -translate-y-3 transition-all hover:scale-105 ${
              isActive("/post/new") ? "ring-4 ring-primary/20" : ""
            }`}
          >
            <PenSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span
            className={`text-xs font-medium -mt-2 ${isActive("/post/new") ? "text-primary" : "text-gray-400"}`}
          >
            Create
          </span>
        </Link>

        {/* Messages */}
        <Link
          href="/messages"
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors relative ${
            pathname.startsWith("/messages")
              ? "text-primary"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div className="relative">
            <MessageCircle
              className={`w-5 h-5 ${pathname.startsWith("/messages") ? "stroke-[2.5]" : "stroke-2"}`}
            />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-[#f97316] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
          <span>Messages</span>
        </Link>

        {/* Profile */}
        <Link
          href="/worker/profile"
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors ${
            pathname.startsWith("/profile") && !pathname.startsWith("/settings")
              ? "text-primary"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <User
            className={`w-5 h-5 ${pathname.startsWith("/profile") && !pathname.startsWith("/settings") ? "stroke-[2.5]" : "stroke-2"}`}
          />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
