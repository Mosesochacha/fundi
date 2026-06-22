"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { redirectPathForRole } from "@/lib/authRedirect";
import { useAuth } from "@/features/auth";
import BottomNav from "./BottomNav";
import Navigation from "./Navigation";
import SocketInit from "./SocketInit";
import LeftSidebar from "./sidebar/LeftSidebar";

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
];
const FULL_CONTENT_PATHS = ["/settings", "/messages"];
const SETUP_PATHS = ["/setup"];
// Pages that ship their own marketing chrome (LandingNav) — render bare.
// /logout is bare too: it just signs out and redirects, so it should never
// show the app chrome.
const BARE_PATHS = ["/", "/browse", "/logout"];
// Role dashboards provide their own chrome via the dashboard <Shell>.
const DASHBOARD_PATHS = ["/worker", "/employer", "/admin", "/moderator"];

// /auth/me is fetched on demand by `useCurrentUser`; the NextAuth session is the
// source of truth for "logged in", so no Redux session-restorer is needed.

function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, profile } = useAuth();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isSetup = SETUP_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isLoggedIn || isAuth) return;
    if (!user) return; // /auth/me still loading — don't redirect prematurely
    if (!user?.isOnboarded && !isSetup) {
      router.replace("/setup");
    } else if (user?.isOnboarded && pathname === "/setup") {
      // Only redirect from the choice screen, not from mid-flow or complete pages
      router.replace(redirectPathForRole(user, profile));
    }
  }, [isLoggedIn, user, profile, isSetup, isAuth, pathname, router]);

  return null;
}

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isFullContent = FULL_CONTENT_PATHS.some((p) => pathname.startsWith(p));
  const isSetup = SETUP_PATHS.some((p) => pathname.startsWith(p));

  if (isAuth) return <>{children}</>;

  const isBare = BARE_PATHS.includes(pathname);
  if (isBare) return <>{children}</>;

  // Role dashboards: session plumbing only — the dashboard <Shell> renders the
  // sidebar/topbar/nav itself, so skip the app's orange Navigation/sidebars.
  const isDashboard = DASHBOARD_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isDashboard) {
    return (
      <>
        <SocketInit />
        {children}
      </>
    );
  }

  // Setup flow: fullscreen, no nav/sidebar
  if (isSetup) {
    return (
      <>
        <OnboardingGuard />
        <SocketInit />
        {children}
      </>
    );
  }

  // Settings and other full-content pages: no sidebar, no container padding
  if (isFullContent) {
    return (
      <>
        <OnboardingGuard />
        <SocketInit />
        <Navigation />
        <div className="min-h-screen bg-paper">
          <main className="pb-16 lg:pb-0">{children}</main>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <OnboardingGuard />
      <SocketInit />
      <Navigation />
      <div className="min-h-screen bg-paper">
        {isLoggedIn ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex gap-6 items-start">
              {/* Left sidebar — desktop only */}
              <aside className="hidden lg:block w-56 shrink-0 sticky top-20">
                <LeftSidebar />
              </aside>

              {/* Main content */}
              <main className="flex-1 min-w-0 pb-16 lg:pb-0">{children}</main>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <main className="pb-16 lg:pb-0">{children}</main>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
