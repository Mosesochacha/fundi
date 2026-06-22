import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { authService } from "../services/auth.service";

/** Notify the backend, clear the NextAuth session, and drop all cached queries. */
export function useLogout() {
  const qc = useQueryClient();

  return async (options?: { callbackUrl?: string }) => {
    try {
      await authService.logout();
    } catch {
      // best-effort; cookie is cleared by signOut regardless
    }
    qc.clear();
    await signOut({ callbackUrl: options?.callbackUrl ?? "/login" });
  };
}
