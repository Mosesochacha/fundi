"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { dashboardPathForRole } from "@/lib/authRedirect";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Browse workers", href: "/browse" },
  { label: "Why Tesilix", href: "/#why" },
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
 * The shared navy/gold marketing navbar. Reused on the landing page and /browse.
 * On /browse it retints to the warm-cream "Find a fundi" palette (serif logo,
 * pill buttons) to match that page's aesthetic.
 */
export default function LandingNav() {
  const pathname = usePathname();
  const { isLoggedIn, user, role } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isBrowse = pathname === "/browse";

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

  const btnBase =
    "inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium tracking-[0.01em] no-underline cursor-pointer border transition-all";
  const btnOutline = isBrowse
    ? "rounded-full border-border text-ink-2 font-semibold hover:border-gold-dark hover:text-ink"
    : "rounded border-border bg-transparent text-ink hover:border-ink-2";
  const btnGold = isBrowse
    ? "rounded-full bg-gold-dark text-white border-gold-dark font-semibold hover:bg-gold hover:border-gold"
    : "rounded bg-gold text-navy border-gold hover:bg-gold-dark hover:border-gold-dark";

  return (
    <>
      <nav
        id="lp-navbar"
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] h-16 backdrop-blur-[14px] border-b transition-colors",
          isBrowse ? "bg-cream/86" : "bg-cream/94",
          scrolled
            ? isBrowse
              ? "border-border"
              : "border-border"
            : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Link href="/" className="inline-flex items-center no-underline">
            <Image
              src="/brand/lightlogo.png"
              alt="Tesilix"
              width={1027}
              height={219}
              priority
              className="h-9 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => {
              const active = l.href === "/browse" && pathname === "/browse";
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "text-[15px] font-semibold tracking-[-0.01em] no-underline transition-colors",
                    isBrowse
                      ? "text-ink-2 hover:text-ink"
                      : "text-ink-2 hover:text-ink",
                    active && "text-gold-dark",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 md:gap-2.5">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <NotificationBell variant="nav" />
                <Link
                  href={dashboardPathForRole(role)}
                  className={cn(
                    "flex items-center gap-2.5 pl-[5px] pr-2.5 py-[5px] border rounded-full bg-white no-underline transition-all",
                    isBrowse
                      ? "border-border hover:border-gold-dark"
                      : "border-border hover:border-gold",
                  )}
                >
                  <span
                    className={cn(
                      "w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-semibold flex-none",
                      isBrowse
                        ? "bg-gold-light text-gold-dark"
                        : "bg-gold-light text-gold-dark",
                    )}
                  >
                    {initials}
                  </span>
                  <span className="hidden md:flex flex-col leading-[1.15]">
                    <span className="text-sm font-medium text-ink">
                      {fullName}
                    </span>
                    <span className="text-[10px] text-ink-3 uppercase tracking-[0.04em]">
                      {role ? (ROLE_LABEL[role] ?? role) : ""}
                    </span>
                  </span>
                  <ChevronDown size={14} className="text-ink-3 flex-none" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    btnBase,
                    btnOutline,
                    "max-md:px-3 max-md:py-[7px] max-md:text-sm",
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    btnBase,
                    btnGold,
                    "max-md:px-3 max-md:py-[7px] max-md:text-sm",
                  )}
                >
                  Sign up
                </Link>
              </>
            )}
            <button
              type="button"
              className="md:hidden flex items-center justify-center p-1.5 bg-transparent border-none text-ink cursor-pointer"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[200] bg-cream flex flex-col px-5 pt-3.5 pb-7 overflow-y-auto">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center no-underline"
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/brand/lightlogo.png"
                alt="Tesilix"
                width={1027}
                height={219}
                className="h-9 w-auto"
              />
            </Link>
            <button
              type="button"
              className="flex p-1.5 bg-transparent border-none text-ink cursor-pointer"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col mt-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-[18px] px-0.5 text-[19px] text-ink no-underline border-b border-border active:text-gold-dark"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {!isLoggedIn && (
            <div className="mt-auto flex flex-col gap-2.5 pt-7">
              <Link
                href="/login"
                className={cn(
                  btnBase,
                  btnOutline,
                  "w-full justify-center py-[13px] text-sm",
                )}
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cn(
                  btnBase,
                  btnGold,
                  "w-full justify-center py-[13px] text-sm",
                )}
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
