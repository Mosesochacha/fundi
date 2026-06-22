"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { redirectPathForRole } from "@/lib/authRedirect";
import { useAuth } from "@/features/auth";
import SocketInit from "./SocketInit";

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
];
const SETUP_PATHS = ["/setup"];
// Pages that ship their own marketing chrome (LandingNav) — render bare.
// /logout is bare too: it just signs out and redirects.
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
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Auth pages and bare (marketing / logout) pages render with no app chrome.
  if (isAuth) return <>{children}</>;
  if (BARE_PATHS.includes(pathname)) return <>{children}</>;

  // Everything else (role dashboards, setup, and any stray route) just needs
  // session plumbing — the dashboard <Shell> renders its own sidebar/topbar.
  return (
    <>
      <OnboardingGuard />
      <SocketInit />
      {children}
    </>
  );
}
