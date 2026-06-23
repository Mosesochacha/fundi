"use client";

import { Bell, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";

const NAV_LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Browse workers", href: "/browse" },
  { label: "Why Fundi", href: "/#why" },
  { label: "Trust & safety", href: "/#trust" },
  { label: "Global", href: "/#global" },
];

const ROLE_LABEL: Record<string, string> = {
  worker: "Worker",
  employer: "Employer",
  admin: "Admin",
  moderator: "Moderator",
};

/**
 * The shared navy/gold marketing navbar. Reused verbatim on the landing page
 * and /browse. Must be rendered inside a `.lp` ancestor (it relies on the
 * landing.css scoped styles).
 */
export default function LandingNav() {
  const pathname = usePathname();
  const { isLoggedIn, user, role } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock background scroll while the full-screen menu drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  return (
    <>
      <nav id="lp-navbar" className={scrolled ? "scrolled" : undefined}>
        <Link href="/" className="logo">
          Fundi<span>.</span>
        </Link>

        <div className="nav-links">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/browse" && pathname === "/browse";
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link${active ? " active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <div className="nav-auth">
              <button
                type="button"
                className="nav-bell"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={1.75} />
                <span className="nav-bell-dot" />
              </button>
              <Link
                href={dashboardPathForRole(role)}
                className="nav-avatar-pill"
              >
                <span className="nav-avatar">{initials}</span>
                <span className="nav-avatar-meta">
                  <span className="nav-avatar-name">{fullName}</span>
                  <span className="nav-avatar-role">
                    {role ? (ROLE_LABEL[role] ?? role) : ""}
                  </span>
                </span>
                <ChevronDown size={14} className="nav-avatar-chev" />
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-gold">
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            className="lp-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lp-nav-drawer">
          <div className="lp-nav-drawer-head">
            <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
              Fundi<span>.</span>
            </Link>
            <button
              type="button"
              className="lp-nav-drawer-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <div className="lp-nav-drawer-links">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {!isLoggedIn && (
            <div className="lp-nav-drawer-cta">
              <Link
                href="/login"
                className="btn btn-outline"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn btn-gold"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
