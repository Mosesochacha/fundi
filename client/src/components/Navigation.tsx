"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, PenSquare, Hammer, ChevronDown, Compass } from "lucide-react";
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
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Brand mark */}
        <Link href="/feed" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <Hammer className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg text-gray-900 font-playfair tracking-tight">Fundi</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search professionals, posts..."
              className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Browse link — visible to all */}
        <Link
          href="/browse"
          className={`hidden md:flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors ${
            pathname.startsWith("/browse") ? "text-primary bg-orange-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Compass className="w-4 h-4" />
          Browse
        </Link>

        <div className="flex items-center gap-1.5 ml-auto">
          {isLoggedIn && profile ? (
            <>
              {/* Notification bell */}
              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors relative">
                <Bell className="w-[18px] h-[18px]" />
              </button>

              {/* Create post */}
              <Link
                href="/post/new"
                className="hidden sm:flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-1.5 rounded-xl font-medium hover:bg-primaryDark transition-colors shadow-sm hover:shadow-md"
              >
                <PenSquare className="w-3.5 h-3.5" />
                Post
              </Link>

              {/* Avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
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
                    <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0">
                            {profile.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              profile.fullName?.[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{profile.fullName}</p>
                            {profile.profession && (
                              <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">{profile.profession}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href={`/profile/${profile.username}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Profile
                        </Link>
                        <Link
                          href="/post/new"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          Create Post
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 py-1">
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
                className="text-sm text-gray-600 px-4 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm bg-primary text-white px-4 py-1.5 rounded-xl hover:bg-primaryDark transition-colors font-medium shadow-sm"
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
