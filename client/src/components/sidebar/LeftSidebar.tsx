"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenSquare, User, Settings } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function LeftSidebar() {
  const pathname = usePathname();
  const { profile, user } = useAppSelector((s) => s.auth);

  if (!profile || !user) return null;

  const navLinks = [
    { href: "/feed",                         label: "Feed",        icon: Home },
    { href: "/post/new",                     label: "Create Post", icon: PenSquare },
    { href: `/profile/${profile.username}`,  label: "My Profile",  icon: User },
    { href: "/settings",                     label: "Settings",    icon: Settings },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Banner + avatar overlap */}
      <div className="relative">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-orange-500 to-primaryDark" />

        {/* Avatar — bottom-left, overlapping banner */}
        <div className="absolute left-4 bottom-0 translate-y-1/2">
          <Link href={`/profile/${profile.username}`}>
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-primary font-bold text-xl overflow-hidden ring-4 ring-white shadow-sm hover:ring-orange-100 transition-all">
              {profile.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                : profile.fullName?.[0]?.toUpperCase()}
            </div>
          </Link>
        </div>
      </div>

      {/* Profile info — pt accounts for avatar overflow (h-14/2 = 28px → pt-8) */}
      <div className="px-4 pt-10 pb-4">
        <Link href={`/profile/${profile.username}`} className="group block">
          <p className="font-playfair font-bold text-base text-gray-900 leading-tight group-hover:text-primary transition-colors">
            {profile.fullName}
          </p>
          {profile.profession && (
            <span className="mt-1.5 inline-block text-xs bg-orange-50 text-primary border border-orange-100 px-2.5 py-0.5 rounded-full font-medium">
              {profile.profession}
            </span>
          )}
          {profile.location && (
            <p className="text-xs text-gray-400 mt-1">{profile.location}</p>
          )}
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mx-3" />

      {/* Navigation */}
      <nav className="p-2 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === "/settings" && pathname.startsWith("/settings"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-orange-50 text-primary"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="h-2" />
    </div>
  );
}
