"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth";
import SocketInit from "./SocketInit";

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
];
// Pages that ship their own marketing chrome (LandingNav) — render bare.
// /logout and /onboarding are bare too (they self-redirect / are standalone).
const BARE_PATHS = ["/", "/browse", "/logout", "/onboarding"];

// /auth/me is fetched on demand by `useCurrentUser`; the NextAuth session is the
// source of truth for "logged in", so no Redux session-restorer is needed.

function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isLoggedIn || isAuth) return;
    if (!user) return; // /auth/me still loading — don't redirect prematurely
    // OAuth users land here with no role yet → finish onboarding first.
    if (!user.isProfileComplete) router.replace("/onboarding");
  }, [isLoggedIn, user, isAuth, pathname, router]);

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

  // Everything else (role dashboards, any stray route) just needs session
  // plumbing — the dashboard <Shell> renders its own sidebar/topbar.
  return (
    <>
      <OnboardingGuard />
      <SocketInit />
      {children}
    </>
  );
}
