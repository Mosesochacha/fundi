"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth";

// Keeps socket.io-client out of the shared bundle — landing/auth/browse pages
// return before rendering it and should never pay for it.
const SocketInit = dynamic(() => import("./SocketInit"), { ssr: false });

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
];
const BARE_PATHS = ["/", "/browse", "/onboarding"];

function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // biome-ignore lint/correctness/useExhaustiveDependencies: `pathname` re-triggers the onboarding guard on every route change
  useEffect(() => {
    if (!isLoggedIn || isAuth) return;
    if (!user) return;
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

  if (isAuth) return <>{children}</>;
  if (BARE_PATHS.includes(pathname)) return <>{children}</>;

  return (
    <>
      <OnboardingGuard />
      <SocketInit />
      {children}
    </>
  );
}
