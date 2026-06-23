"use client";

import {
  Bell,
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
import { useSetAvailability } from "@/features/worker/availability";
import {
  type BadgeKey,
  type DashboardRole,
  NAV_CONFIG,
  type NavItem,
  ROLE_LABELS,
} from "./navConfig";
import "./shell.css";

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
  hasNotifications?: boolean;
}

function VerifiedBadge() {
  return (
    <span className="dash-verified">
      <ShieldCheck size={10} strokeWidth={2} />
      Verified
    </span>
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
  hasNotifications,
}: ShellProps) {
  const pathname = usePathname();
  const activePath = currentPath ?? pathname ?? "";

  const config = NAV_CONFIG[role];
  const counts: Record<BadgeKey, number | undefined> = {
    unreadMessages,
    unreadRequests,
    openReports,
    flaggedCount,
  };
  const showVerified = role === "worker" && !!user.isVerified;

  const setAvailability = useSetAvailability();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [available, setAvailable] = useState(!!user.isAvailable);
  const [savingAvail, setSavingAvail] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the user dropdown when clicking outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const isActive = (href: string) =>
    activePath === href || activePath.startsWith(`${href}/`);

  const badgeOf = (item: NavItem) =>
    item.badge ? counts[item.badge] : undefined;

  // Page title = label of the most specific active nav item.
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
      setAvailable(!next); // revert on failure
    } finally {
      setSavingAvail(false);
    }
  }

  const Logo = ({ small }: { small?: boolean }) => (
    <span className={`dash-logo${small ? " dash-logo-sm" : ""}`}>
      Fundi<span>.</span>
    </span>
  );

  const renderNav = (onNavigate?: () => void) => (
    <nav className="dash-nav">
      {config.sections.map((section) => (
        <div key={section.label ?? "section"}>
          {section.label && <div className="dash-section">{section.label}</div>}
          {section.items.map((item) => {
            const Icon = item.icon;
            const badge = badgeOf(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-navitem${isActive(item.href) ? " active" : ""}`}
                onClick={onNavigate}
              >
                <Icon size={15} />
                <span className="dash-navlabel">{item.label}</span>
                {badge ? <span className="dash-badge">{badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const availabilityFooter =
    role === "worker" ? (
      <div className="dash-footer">
        <button
          type="button"
          className={`dash-avail${available ? " on" : ""}`}
          onClick={toggleAvailability}
          disabled={savingAvail}
        >
          <span className="dash-avail-dot" />
          {available ? "Available now" : "Unavailable"}
        </button>
      </div>
    ) : null;

  return (
    <div className="dash">
      {/* ── Desktop sidebar ── */}
      <aside className="dash-sidebar">
        <Link
          href={config.sections[0].items[0].href}
          style={{ textDecoration: "none" }}
        >
          <Logo />
        </Link>
        {renderNav()}
        {availabilityFooter}
      </aside>

      {/* ── Mobile topbar: logo left, avatar + hamburger right ── */}
      <header className="dash-mtop">
        <div className="dash-mtop-row">
          <Link
            href={`/${role}/dashboard`}
            className="dash-logo-mark"
            aria-label="Fundi home"
          >
            F
          </Link>
          <div className="dash-mtop-right">
            <span className="dash-mtop-avatar">{user.initials}</span>
            <button
              type="button"
              className="dash-hamburger"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      <button
        type="button"
        className={`dash-overlay${drawerOpen ? " show" : ""}`}
        aria-label="Close menu"
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`dash-drawer${drawerOpen ? " open" : ""}`}>
        <div className="dash-drawer-head">
          <Logo />
          <button
            type="button"
            className="dash-drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>
        {renderNav(() => setDrawerOpen(false))}
        {availabilityFooter}
      </aside>

      {/* ── Main column ── */}
      <div className="dash-main">
        <header className="dash-topbar">
          <span className="dash-title">{pageTitle}</span>
          <div className="dash-topright">
            <button
              type="button"
              className="dash-bell"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {hasNotifications && <span className="dash-dot" />}
            </button>
            <div className="dash-userwrap" ref={menuRef}>
              <button
                type="button"
                className="dash-userpill"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="dash-avatar">{user.initials}</span>
                <span className="dash-userinfo">
                  <span className="dash-username">{user.name}</span>
                  <span className="dash-userrole">{ROLE_LABELS[role]}</span>
                </span>
                {showVerified && <VerifiedBadge />}
                <ChevronDown size={14} className="dash-chev" />
              </button>
              {menuOpen && (
                <div className="dash-menu">
                  {role === "worker" && (
                    <Link
                      href={`/${role}/profile`}
                      className="dash-menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={15} /> Profile
                    </Link>
                  )}
                  <Link
                    href={`/${role}/settings`}
                    className="dash-menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings size={15} /> Settings
                  </Link>
                  <Link
                    href="/logout"
                    className="dash-menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LogOut size={15} /> Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dash-content">{children}</main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="dash-bottom">
        {config.bottomNav.map((item) => {
          const Icon = item.icon;
          const badge = badgeOf(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dash-bottomitem${isActive(item.href) ? " active" : ""}`}
            >
              <span className="dash-bottomicon">
                <Icon size={19} />
                {badge ? (
                  <span className="dash-bottombadge">{badge}</span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="dash-bottomitem"
          aria-label="Notifications"
        >
          <span className="dash-bottomicon">
            <Bell size={19} />
            {hasNotifications && <span className="dash-bottombadge" />}
          </span>
          Alerts
        </button>
      </nav>
    </div>
  );
}
