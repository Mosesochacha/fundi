"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, MessageCircle, Settings2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useGetProfileQuery } from "@/store/apiSlice";

export default function LeftSidebar() {
  const pathname = usePathname();
  const { profile, user } = useAppSelector((s) => s.auth);
  const { data: profileData } = useGetProfileQuery(profile?.username ?? '', { skip: !profile?.username });
  const stats = (profileData as any)?.data;

  if (!profile || !user) return null;

  const navLinks = [
    { href: "/feed",                        label: "Home",       icon: Home },
    { href: "/browse",                      label: "Browse",     icon: Compass },
    { href: `/profile/${profile.username}`, label: "My Profile", icon: User },
    { href: "/messages",                    label: "Messages",   icon: MessageCircle },
    { href: "/settings",                    label: "Settings",   icon: Settings2 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_2px_8px_-4px_rgba(40,20,5,0.1)] overflow-hidden">

      {/* Banner + avatar overlap */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-24 overflow-hidden">
          {stats?.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={stats.bannerUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0" style={{
                background: "linear-gradient(135deg, #9a3412 0%, #c2410c 40%, #f97316 75%, #fdba74 100%)",
              }} />
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 14px)",
              }} />
            </>
          )}
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-8" style={{
            background: "linear-gradient(0deg, rgba(28,20,16,0.15), transparent)",
          }} />
        </div>

        {/* Avatar — overlapping banner */}
        <div className="absolute left-4 bottom-0 translate-y-1/2">
          <Link href={`/profile/${profile.username}`}>
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-[color:var(--orange-700)] font-bold text-2xl overflow-hidden ring-4 ring-white shadow-[0_4px_14px_rgba(40,20,5,0.15)] hover:scale-105 hover:ring-orange-100 transition-all duration-300">
              {(stats?.avatarUrl ?? profile.avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={stats?.avatarUrl ?? profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-playfair">{profile.fullName?.[0]?.toUpperCase()}</span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pt-12 pb-4">
        <Link href={`/profile/${profile.username}`} className="group block">
          <p className="font-playfair font-bold text-[17px] text-[color:var(--ink)] leading-tight group-hover:text-primary transition-colors">
            {profile.fullName}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">@{profile.username}</p>
          {profile.profession && (
            <span className="mt-2 inline-flex items-center text-[10.5px] bg-orange-50 text-[color:var(--orange-700)] border border-orange-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
              {profile.profession}
            </span>
          )}
          {profile.location && (
            <p className="text-[11px] text-[color:var(--ink-soft)] mt-1.5">{profile.location}</p>
          )}
        </Link>
      </div>

      {/* Stats row */}
      <div className="border-t border-[color:var(--line)] grid grid-cols-3 text-center">
        {[
          { label: 'Posts',     value: stats?.postsCount ?? 0 },
          { label: 'Followers', value: stats?.followersCount ?? 0 },
          { label: 'Following', value: stats?.followingCount ?? 0 },
        ].map(({ label, value }, i) => (
          <div key={label} className={`py-3.5 ${i > 0 ? 'border-l border-[color:var(--line)]' : ''}`}>
            <p className="font-playfair text-[18px] font-bold text-[color:var(--ink)] leading-none">{Number(value).toLocaleString()}</p>
            <p className="font-dm-sans text-[10px] text-gray-400 mt-1.5 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-0.5 border-t border-[color:var(--line)]">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === "/settings" && pathname.startsWith("/settings")) ||
            (href === "/messages" && pathname.startsWith("/messages")) ||
            (href.startsWith("/profile/") && pathname.startsWith("/profile/") && pathname.includes(profile.username));
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                active
                  ? "bg-orange-50 text-primary"
                  : "text-[color:var(--ink-soft)] hover:bg-[color:var(--line-soft)] hover:text-[color:var(--ink)]"
              }`}
            >
              {active && <span className="absolute left-0 top-0 bottom-0 w-[4px] rounded-r-full bg-primary" />}
              <Icon className={`w-[17px] h-[17px] shrink-0 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
