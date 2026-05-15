"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User, Settings, Lock, Bell, Palette, Eye, CreditCard, LogOut
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logOut } from "@/store/authSlice";
import { useToastContext } from "@/context/ToastContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1";

const NAV_ITEMS = [
  { href: "/settings/profile",       label: "Profile",       icon: User },
  { href: "/settings/account",       label: "Account",       icon: Settings },
  { href: "/settings/security",      label: "Security",      icon: Lock },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/appearance",    label: "Appearance",    icon: Palette },
  { href: "/settings/privacy",       label: "Privacy",       icon: Eye },
  { href: "/settings/billing",       label: "Billing",       icon: CreditCard },
];

interface SettingsSidebarProps {
  onNavigate?: (href: string) => void;
}

export default function SettingsSidebar({ onNavigate }: SettingsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, profile, accessToken } = useAppSelector((s) => s.auth);
  const { success } = useToastContext();

  const handleSignOut = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch { /* ignore */ }
    dispatch(logOut());
    router.push("/login");
    success("Signed out");
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <div className="flex flex-col h-full">
      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (onNavigate && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(href); } : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-[#f97316] text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-white" : "text-gray-400"}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {label}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-gray-100" />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} className="text-red-400" strokeWidth={1.8} />
          Sign out
        </button>
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#f97316] font-bold text-xs overflow-hidden shrink-0">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{profile?.fullName}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
