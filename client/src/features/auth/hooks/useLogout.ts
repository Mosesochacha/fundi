import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { getSocket } from "@/hooks/useSocket";
import { API_BASE } from "@/lib/apiBase";
import { clearAccessTokenCache, peekAccessToken } from "@/lib/axios";
import { setLoggingOut } from "@/lib/logoutState";

/**
 * Instant logout.
 *
 * Ordering here is what makes logout stick. NextAuth re-issues the session
 * cookie on every `/api/auth/session` read (sliding expiration), so any
 * session fetch that is in flight when `signOut` clears the cookie will land
 * afterwards and silently resurrect the session — the user "logs out" and is
 * still signed in. Therefore: first stop everything that could trigger a
 * session read (queries, socket), then clear the cookie, and only then clear
 * caches (whose refetches now harmlessly see a null session).
 *
 * The backend refresh-token revocation is fired without being awaited
 * (`keepalive` lets it outlive the navigation), so the user only ever waits on
 * the NextAuth cookie clear — then they're routed home via the App Router.
 * Nothing here may reject: callers flip into a "signing out" state and an
 * escaped error would strand them there.
 */
export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();

  return async (options?: { callbackUrl?: string }) => {
    setLoggingOut(true);
    try {
      qc.cancelQueries();
      getSocket()?.disconnect();

      const token = peekAccessToken();
      void fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        keepalive: true,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).catch(() => {});

      try {
        await signOut({ redirect: false });
      } catch {
        // One retry — a transient blip here would leave the NextAuth cookie
        // alive and the user silently still signed in.
        await signOut({ redirect: false });
      }

      clearAccessTokenCache();
      qc.clear();
    } catch {
      // Swallow everything; the redirect below always runs.
    } finally {
      // refresh() first: it drops the client router cache, so the navigation
      // can't reuse a prefetched logged-in redirect (e.g. "/" → dashboard).
      router.refresh();
      router.replace(options?.callbackUrl ?? "/");
      setLoggingOut(false);
    }
  };
}
