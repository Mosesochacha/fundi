"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navigation from "./Navigation";
import LeftSidebar from "./sidebar/LeftSidebar";
import BottomNav from "./BottomNav";
import SocketInit from "./SocketInit";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCredentials, logOut, type AuthUser, type AuthProfile } from "@/store/authSlice";
import { useGetMeQuery } from "@/store/apiSlice";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/verify-email", "/reset-password"];
const FULL_CONTENT_PATHS = ["/settings", "/messages"];
const SETUP_PATHS = ["/setup"];

function SessionRestorer() {
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector((s) => s.auth);
  const { data, isError } = useGetMeQuery(undefined, { skip: !isLoggedIn });

  useEffect(() => {
    if (data?.success) {
      const { user, profile } = (data as { success: boolean; data: { user: AuthUser; profile: AuthProfile | null } }).data;
      dispatch(setCredentials({ user, profile }));
    }
    if (isError) {
      dispatch(logOut());
    }
  }, [data, isError, dispatch]);

  return null;
}

function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAppSelector((s) => s.auth);
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isSetup = SETUP_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isLoggedIn || isAuth) return;
    if (!user?.isOnboarded && !isSetup) {
      router.replace("/setup");
    } else if (user?.isOnboarded && pathname === "/setup") {
      // Only redirect from the choice screen, not from mid-flow or complete pages
      router.replace("/feed");
    }
  }, [isLoggedIn, user?.isOnboarded, isSetup, isAuth, pathname, router]);

  return null;
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoggedIn } = useAppSelector((s) => s.auth);
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isFullContent = FULL_CONTENT_PATHS.some((p) => pathname.startsWith(p));
  const isSetup = SETUP_PATHS.some((p) => pathname.startsWith(p));

  if (isAuth) return <>{children}</>;

  // Setup flow: fullscreen, no nav/sidebar
  if (isSetup) {
    return (
      <>
        <SessionRestorer />
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
        <SessionRestorer />
        <OnboardingGuard />
        <SocketInit />
        <Navigation />
        <div className="min-h-screen" style={{ background: "var(--orange-25)" }}>
          <main className="pb-16 lg:pb-0">{children}</main>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <SessionRestorer />
      <OnboardingGuard />
      <SocketInit />
      <Navigation />
      <div className="min-h-screen" style={{ background: "var(--orange-25)" }}>
        {isLoggedIn ? (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex gap-6 items-start">
              {/* Left sidebar — desktop only */}
              <aside className="hidden lg:block w-56 shrink-0 sticky top-20">
                <LeftSidebar />
              </aside>

              {/* Main content */}
              <main className="flex-1 min-w-0 pb-16 lg:pb-0">
                {children}
              </main>
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
