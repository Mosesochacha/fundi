"use client";

import { Bell, ChevronDown } from "lucide-react";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  return (
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

      {isLoggedIn ? (
        <div className="nav-auth">
          <button type="button" className="nav-bell" aria-label="Notifications">
            <Bell size={18} strokeWidth={1.75} />
            <span className="nav-bell-dot" />
          </button>
          <Link href={dashboardPathForRole(role)} className="nav-avatar-pill">
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
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/login" className="btn btn-outline">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-gold">
            Get started free
          </Link>
        </div>
      )}
    </nav>
  );
}
