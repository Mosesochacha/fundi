"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, PenSquare, Hammer, ChevronDown, Compass, MessageCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logOut } from "@/store/authSlice";
import { apiSlice, useLogoutMutation } from "@/store/apiSlice";
import FilterBar from "./FilterBar";

export default function Navigation() {
  const dispatch = useAppDispatch();
  const { profile, isLoggedIn } = useAppSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isFeed = pathname === "/feed";
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Cookie clearing may still succeed even if the request errors
    } finally {
      dispatch(logOut());
      dispatch(apiSlice.util.resetApiState());
      setMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[color:var(--line)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Brand mark */}
        <Link href="/feed" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-9 h-9 bg-[color:var(--ink)] rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-6deg] group-hover:bg-primary shadow-[0_2px_6px_rgba(28,20,16,0.18)]">
            <Hammer className="w-4 h-4 text-[color:var(--orange-300)] group-hover:text-white transition-colors" strokeWidth={2.5} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white group-hover:bg-[color:var(--orange-300)] transition-colors" />
          </div>
          <span className="font-bold text-[19px] text-[color:var(--ink)] font-playfair tracking-tight leading-none">Fundi</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search professionals, posts, trades..."
              className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-[color:var(--line-soft)] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Browse link */}
        <Link
          href="/browse"
          className={`hidden md:flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
            pathname.startsWith("/browse")
              ? "text-primary bg-orange-100 ring-1 ring-orange-200/60"
              : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)] hover:bg-[color:var(--line-soft)]"
          }`}
        >
          <Compass className="w-4 h-4" />
          Browse
        </Link>

        <div className="flex items-center gap-1.5 ml-auto">
          {isLoggedIn && profile ? (
            <>
              {/* Messages */}
              <Link
                href="/messages"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                  pathname.startsWith("/messages")
                    ? "bg-orange-100 text-primary ring-1 ring-orange-200/60"
                    : "text-gray-500 hover:bg-[color:var(--line-soft)] hover:text-gray-700"
                }`}
              >
                <MessageCircle className="w-[18px] h-[18px]" />
              </Link>

              {/* Notification bell */}
              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-[color:var(--line-soft)] hover:text-gray-700 transition-all relative">
                <Bell className="w-[18px] h-[18px]" />
              </button>

              {/* Create post — orange CTA */}
              <Link
                href="/post/new"
                className="hidden sm:flex items-center gap-1.5 bg-primary text-white text-[13px] px-4 py-1.5 rounded-xl font-semibold hover:bg-[color:var(--orange-600)] transition-all shadow-[0_2px_10px_-2px_rgba(249,115,22,0.45)] hover:shadow-[0_4px_14px_-2px_rgba(249,115,22,0.55)] hover:-translate-y-px"
              >
                <PenSquare className="w-3.5 h-3.5" strokeWidth={2.5} />
                Post
              </Link>

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-[color:var(--line-soft)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xs overflow-hidden ring-2 ring-[color:var(--line)] hover:ring-orange-200 transition-all">
                    {profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      profile.fullName?.[0]?.toUpperCase()
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-warm-lg border border-[color:var(--line)] py-1.5 z-50">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-[color:var(--line)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0 ring-2 ring-[color:var(--line)]">
                            {profile.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              profile.fullName?.[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[color:var(--ink)] truncate leading-tight">{profile.fullName}</p>
                            {profile.profession && (
                              <p className="text-xs text-[color:var(--ink-soft)] truncate leading-tight mt-0.5">{profile.profession}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href={`/profile/${profile.username}`}
                          className="flex items-center px-4 py-2 text-sm text-[color:var(--ink)] hover:bg-[color:var(--line-soft)] transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Profile
                        </Link>
                        <Link
                          href="/post/new"
                          className="flex items-center px-4 py-2 text-sm text-[color:var(--ink)] hover:bg-[color:var(--line-soft)] transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          Create Post
                        </Link>
                      </div>

                      <div className="border-t border-[color:var(--line)] py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className="text-[13px] text-[color:var(--ink-soft)] px-4 py-1.5 rounded-xl hover:bg-[color:var(--line-soft)] hover:text-[color:var(--ink)] transition-colors font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-[13px] bg-primary text-white px-4 py-1.5 rounded-xl hover:bg-[color:var(--orange-600)] transition-all font-semibold shadow-[0_2px_10px_-2px_rgba(249,115,22,0.4)] hover:-translate-y-px"
              >
                Join Fundi
              </Link>
            </div>
          )}
        </div>
      </div>

      {isFeed && <FilterBar />}
    </nav>
  );
}
