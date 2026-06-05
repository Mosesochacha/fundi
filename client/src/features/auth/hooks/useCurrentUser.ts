import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { authService } from "../services/auth.service";
import type { AuthProfile, AuthUser } from "../types/auth.types";

export interface CurrentUser {
  user: AuthUser;
  profile: AuthProfile | null;
}

/** Rich current user/profile from GET /auth/me (replaces the old SessionRestorer). */
export function useCurrentUser() {
  const { status } = useSession();
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.me(),
    enabled: status === "authenticated",
    select: (res) => res.data.data as CurrentUser,
    staleTime: 1000 * 60 * 5,
  });
}
