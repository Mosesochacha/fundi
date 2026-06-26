import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { getSocket } from "@/hooks/useSocket";
import { clearAccessTokenCache } from "@/lib/axios";
import { authService } from "../services/auth.service";

/** Cap the backend revocation so a slow/unreachable backend can't hang logout. */
const REVOKE_TIMEOUT_MS = 2500;

/**
 * Professional logout.
 *
 * Order matters: we must revoke the **backend refresh token before** clearing
 * the NextAuth session, otherwise the NextAuth `jwt` callback resurrects the
 * session by refreshing against the still-valid refresh cookie (the user ends
 * up logged straight back in). The backend call is time-boxed so it never hangs
 * the UI — when the backend is down, a refresh can't resurrect the session
 * either, so logout still sticks.
 */
export function useLogout() {
  const qc = useQueryClient();

  return async (options?: { callbackUrl?: string }) => {
    // Stop in-flight refetches and drop cached state up front so nothing keeps
    // spinning or triggers a session refresh mid-logout.
    qc.cancelQueries();
    qc.clear();
    clearAccessTokenCache();
    getSocket()?.disconnect();

    // Revoke the refresh token (kills the resurrection path), bounded by a timeout.
    await Promise.race([
      authService.logout().catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, REVOKE_TIMEOUT_MS)),
    ]);

    // Clear the NextAuth session cookie, then do a single hard redirect home.
    await signOut({ redirect: false });
    if (typeof window !== "undefined") {
      window.location.replace(options?.callbackUrl ?? "/");
    }
  };
}
