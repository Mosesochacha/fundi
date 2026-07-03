"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo, LogoMark } from "@/components/Logo";
import { useLogout } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { useSetAvailability } from "@/features/worker/availability";
import { cn } from "@/lib/utils";
import {
  type BadgeKey,
  type DashboardRole,
  NAV_CONFIG,
  type NavItem,
  ROLE_LABELS,
} from "./navConfig";

export interface ShellUser {
  name: string;
  initials: string;
  isVerified?: boolean;
  isAvailable?: boolean;
}

export interface ShellProps {
  children: React.ReactNode;
  role: DashboardRole;
  user: ShellUser;
  currentPath?: string;
  unreadMessages?: number;
  unreadRequests?: number;
  openReports?: number;
  flaggedCount?: number;
  pendingPayouts?: number;
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-[3px] bg-gold/[0.12] border border-gold/25 rounded-full px-1.5 py-px text-[9px] text-gold-dark whitespace-nowrap">
      <ShieldCheck size={10} strokeWidth={2} />
      Verified
    </span>
  );
}

/**
 * Avatar-triggered account dropdown (Profile / Settings / Logout). Rendered in
 * both the desktop topbar (full trigger: avatar + name + role) and the mobile
 * header (avatar only) so logout is always reachable.
 */
function AccountMenu({
  role,
  user,
  showVerified,
  variant,
  onLogout,
}: {
  role: DashboardRole;
  user: ShellUser;
  showVerified: boolean;
  variant: "desktop" | "mobile";
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          "flex items-center cursor-pointer",
          variant === "desktop"
            ? "gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-cream"
            : "p-0",
        )}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span
          className={cn(
            "rounded-full bg-gold-light text-gold-dark font-semibold flex items-center justify-center shrink-0",
            variant === "desktop"
              ? "w-[34px] h-[34px] text-[11px]"
              : "w-8 h-8 text-sm",
          )}
        >
          {user.initials}
        </span>
        {variant === "desktop" && (
          <>
            <span className="flex flex-col leading-tight text-left">
              <span className="text-sm font-medium text-ink">{user.name}</span>
              <span className="text-[11px] text-ink-3">
                {ROLE_LABELS[role]}
              </span>
            </span>
            {showVerified && <VerifiedBadge />}
            <ChevronDown size={14} className="text-ink-3 shrink-0" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 min-w-[168px] bg-white border border-border rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-1.5 z-[60]">
          {variant === "mobile" && (
            <div className="px-2.5 pt-2 pb-1.5 border-b border-border mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-ink truncate">
                  {user.name}
                </span>
                {showVerified && <VerifiedBadge />}
              </div>
              <span className="text-[11px] text-ink-3">
                {ROLE_LABELS[role]}
              </span>
            </div>
          )}
          {role === "worker" && (
            <Link
              href={`/${role}/profile`}
              className="flex items-center gap-2 w-full text-sm text-ink-2 no-underline px-2.5 py-2 rounded-md hover:bg-cream-2 hover:text-ink"
              onClick={() => setOpen(false)}
            >
              <User size={15} /> Profile
            </Link>
          )}
          <Link
            href={`/${role}/settings`}
            className="flex items-center gap-2 w-full text-sm text-ink-2 no-underline px-2.5 py-2 rounded-md hover:bg-cream-2 hover:text-ink"
            onClick={() => setOpen(false)}
          >
            <Settings size={15} /> Settings
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 w-full text-sm text-ink-2 px-2.5 py-2 rounded-md hover:bg-cream-2 hover:text-ink cursor-pointer"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Shell({
  children,
  role,
  user,
  currentPath,
  unreadMessages,
  unreadRequests,
  openReports,
  flaggedCount,
  pendingPayouts,
}: ShellProps) {
  const pathname = usePathname();
  const activePath = currentPath ?? pathname ?? "";

  const config = NAV_CONFIG[role];
  const counts: Record<BadgeKey, number | undefined> = {
    unreadMessages,
    unreadRequests,
    openReports,
    flaggedCount,
    pendingPayouts,
  };
  const showVerified = role === "worker" && !!user.isVerified;

  const setAvailability = useSetAvailability();
  const logout = useLogout();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [available, setAvailable] = useState(!!user.isAvailable);
  const [savingAvail, setSavingAvail] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;
    setDrawerOpen(false);
    setLoggingOut(true);
    void logout({ callbackUrl: "/" });
  };

  const isActive = (href: string) =>
    activePath === href || activePath.startsWith(`${href}/`);

  const badgeOf = (item: NavItem) =>
    item.badge ? counts[item.badge] : undefined;

  const pageTitle =
    config.sections
      .flatMap((s) => s.items)
      .filter((i) => isActive(i.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.label ?? "Dashboard";

  async function toggleAvailability() {
    const next = !available;
    setAvailable(next);
    setSavingAvail(true);
    try {
      await setAvailability.mutateAsync({ available: next });
    } catch {
      setAvailable(!next);
    } finally {
      setSavingAvail(false);
    }
  }

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex-1 overflow-y-auto pt-1.5 pb-3">
      {config.sections.map((section) => (
        <div key={section.label ?? "section"}>
          {section.label && (
            <div className="text-[9px] uppercase tracking-[0.1em] text-white/30 px-5 pt-3.5 pb-[5px]">
              {section.label}
            </div>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            const badge = badgeOf(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-[9px] w-[calc(100%-16px)] text-sm px-3 py-[9px] rounded-md mx-2 my-px no-underline transition-colors",
                  isActive(item.href)
                    ? "bg-gold/[0.14] text-gold"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/90",
                )}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon size={15} />
                <span className="flex-1">{item.label}</span>
                {badge ? (
                  <span
                    className={cn(
                      "text-[9px] font-semibold rounded-full px-1.5 py-px ml-auto",
                      item.badgeTone === "red"
                        ? "bg-red-500 text-white"
                        : "bg-gold text-navy",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const availabilityFooter =
    role === "worker" ? (
      <div className="border-t border-white/[0.07] p-3">
        <button
          type="button"
          className="w-full flex items-center gap-[9px] text-sm px-3 py-[9px] rounded-md bg-white/[0.04] text-white/70 cursor-pointer transition-colors hover:bg-white/[0.08] disabled:opacity-60 disabled:cursor-default"
          onClick={toggleAvailability}
          disabled={savingAvail}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0 transition-colors",
              available ? "bg-green-400" : "bg-white/15",
            )}
          />
          {available ? "Available now" : "Unavailable"}
        </button>
      </div>
    ) : null;

  const sidebarFooter =
    role === "admin" ? (
      <div className="border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="w-8 h-8 rounded-full bg-gold/[0.16] text-gold text-[11px] font-semibold flex items-center justify-center shrink-0">
            {user.initials}
          </span>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-sm font-medium text-white/90 truncate">
              {user.name}
            </span>
            <span className="text-[11px] text-white/40">Super admin</span>
          </span>
        </div>
      </div>
    ) : (
      availabilityFooter
    );

  return (
    <div className="min-h-screen bg-cream text-ink-2 font-sans">
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:w-[220px] lg:h-screen lg:bg-navy lg:z-30">
        <Link
          href={config.sections[0].items[0].href}
          className="flex items-center gap-2 no-underline px-5 pt-[18px] pb-2.5"
        >
          <Logo tone="light" size="md" />
          {role === "admin" && (
            <span className="bg-gold/[0.16] border border-gold/30 text-gold text-[9px] font-semibold uppercase tracking-[0.08em] rounded px-1.5 py-0.5">
              Admin
            </span>
          )}
        </Link>
        {renderNav()}
        {sidebarFooter}
      </aside>

      <header className="bg-white border-b border-border sticky top-0 z-30 lg:hidden">
        <div className="h-[52px] flex items-center justify-between px-3">
          <Link
            href={`/${role}/dashboard`}
            className="flex items-center no-underline shrink-0"
            aria-label="Tesilix home"
          >
            <LogoMark size={34} variant="navy" />
          </Link>
          <div className="flex items-center gap-2.5">
            <AccountMenu
              role={role}
              user={user}
              showVerified={showVerified}
              variant="mobile"
              onLogout={handleLogout}
            />
            <button
              type="button"
              className="text-ink-2 flex p-2 cursor-pointer"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <button
        type="button"
        className={cn(
          "fixed inset-0 bg-black/45 z-40 transition-opacity duration-[250ms] lg:hidden",
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        aria-label="Close menu"
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-0 w-full bg-navy z-50 flex flex-col overflow-y-auto transition-transform duration-[250ms] lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between pt-3.5 px-4 pb-1.5">
          <div className="flex items-center gap-2">
            <Logo tone="light" size="md" />
            {role === "admin" && (
              <span className="bg-gold/[0.16] border border-gold/30 text-gold text-[9px] font-semibold uppercase tracking-[0.08em] rounded px-1.5 py-0.5">
                Admin
              </span>
            )}
          </div>
          <button
            type="button"
            className="bg-white/[0.08] border border-white/15 text-white w-[38px] h-[38px] rounded-[9px] flex items-center justify-center cursor-pointer"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>
        {renderNav(() => setDrawerOpen(false))}
        {sidebarFooter}
      </aside>

      <div className="min-h-screen flex flex-col lg:ml-[220px]">
        <header className="hidden lg:flex lg:items-center lg:justify-between lg:h-[60px] lg:bg-white lg:border-b lg:border-border lg:px-6 lg:sticky lg:top-0 lg:z-20">
          <span className="text-sm text-ink-2 font-medium">{pageTitle}</span>
          <div className="flex items-center gap-3">
            <NotificationBell variant="dash" />
            <AccountMenu
              role={role}
              user={user}
              showVerified={showVerified}
              variant="desktop"
              onLogout={handleLogout}
            />
          </div>
        </header>

        <main className="flex-1 bg-cream-2 px-4 pt-5 pb-[82px] lg:px-8 lg:py-6 lg:min-h-[calc(100vh-60px)]">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-[58px] z-30 flex bg-navy border-t border-white/[0.07] lg:hidden">
        {config.bottomNav.map((item) => {
          const Icon = item.icon;
          const badge = badgeOf(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-[3px] text-[10px] no-underline relative",
                isActive(item.href) ? "text-gold" : "text-white/45",
              )}
            >
              <span className="relative">
                <Icon size={19} />
                {badge ? (
                  <span
                    className={cn(
                      "absolute -top-[5px] left-2.5 text-[8px] font-semibold leading-none rounded-full px-1 py-0.5 min-w-[14px] text-center",
                      item.badgeTone === "red"
                        ? "bg-red-500 text-white"
                        : "bg-gold text-navy",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
        <NotificationBell variant="bottom" />
      </nav>
    </div>
  );
}
