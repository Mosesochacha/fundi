"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenSquare, User, Settings, Compass } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function BottomNav() {
  const pathname = usePathname();
  const { profile, isLoggedIn } = useAppSelector((s) => s.auth);

  if (!isLoggedIn) return null;

  const isActive = (href: string) => pathname === href || (href === "/feed" && pathname === "/");

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 safe-area-bottom">
      <div className="flex items-end h-16 pb-1">

        {/* Feed */}
        <Link
          href="/feed"
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors ${
            isActive("/feed") ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Home className={`w-5 h-5 ${isActive("/feed") ? "stroke-[2.5]" : "stroke-2"}`} />
          <span>Feed</span>
        </Link>

        {/* Browse */}
        <Link
          href="/browse"
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors ${
            isActive("/browse") ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Compass className={`w-5 h-5 ${isActive("/browse") ? "stroke-[2.5]" : "stroke-2"}`} />
          <span>Browse</span>
        </Link>

        {/* Create — raised FAB */}
        <Link
          href="/post/new"
          className="flex-1 flex flex-col items-center justify-end gap-1 pb-0.5"
        >
          <div className={`w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 -translate-y-3 transition-all hover:scale-105 ${
            isActive("/post/new") ? "ring-4 ring-primary/20" : ""
          }`}>
            <PenSquare className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className={`text-xs font-medium -mt-2 ${isActive("/post/new") ? "text-primary" : "text-gray-400"}`}>
            Create
          </span>
        </Link>

        {/* Profile */}
        <Link
          href={`/profile/${profile?.username}`}
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors ${
            pathname.startsWith("/profile") && !pathname.startsWith("/settings") ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <User className={`w-5 h-5 ${pathname.startsWith("/profile") && !pathname.startsWith("/settings") ? "stroke-[2.5]" : "stroke-2"}`} />
          <span>Profile</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 text-xs font-medium transition-colors ${
            pathname.startsWith("/settings") ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Settings className={`w-5 h-5 ${pathname.startsWith("/settings") ? "stroke-[2.5]" : "stroke-2"}`} />
          <span>Settings</span>
        </Link>

      </div>
    </nav>
  );
}
