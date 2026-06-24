"use client";

import { useEffect, useRef } from "react";
import { useLogout } from "@/features/auth";

/**
 * Logout route. The dashboard Shell and nav config link here; on mount it
 * notifies the backend, clears the NextAuth session + cached queries, and
 * redirects to /login. Rendered bare (see LayoutShell) so the old app chrome
 * never flashes.
 */
export default function LogoutPage() {
  const logout = useLogout();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React strict-mode double-invoke
    ran.current = true;
    logout({ callbackUrl: "/login" });
  }, [logout]);

  return (
    <div className="min-h-screen grid place-items-center font-sans text-ink">
      Signing you out…
    </div>
  );
}
