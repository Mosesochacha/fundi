import { useSession } from "next-auth/react";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Convenience auth state for components.
 * - `isLoggedIn` / `role` come from the NextAuth session (cheap, always present).
 * - `user` / `profile` come from GET /auth/me (richer, fetched once and cached).
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const { data: current, isLoading: userLoading } = useCurrentUser();

  return {
    session,
    status,
    isLoggedIn: status === "authenticated",
    isLoading: status === "loading" || userLoading,
    role: session?.user?.role,
    user: current?.user ?? session?.backendUser ?? null,
    profile: current?.profile ?? session?.backendProfile ?? null,
  };
}
