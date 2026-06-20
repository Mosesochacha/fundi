import { useMutation, useQuery } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { authService } from "../services/auth.service";

export interface PendingVerification {
  emailMasked: string;
  accountType: "employer" | "worker" | null;
}

// Reads the masked email / accountType for the in-progress verification from the
// server session cookie. `enabled` lets the page defer the call until mounted.
export function usePendingVerification(options?: { enabled?: boolean }) {
  return useQuery<PendingVerification>({
    queryKey: ["pending-verification"],
    queryFn: async () => {
      const res = await authService.pendingVerification();
      return res.data.data as PendingVerification;
    },
    enabled: options?.enabled ?? true,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

// Verifies the OTP via the `verify-email` NextAuth provider: the backend
// confirms the code and returns session tokens, so a success here also
// establishes the user's session (auto-login). Returns the new session so the
// caller can route to the role-based dashboard. Throws on an invalid code.
export function useVerifyEmail() {
  return useMutation<Session | null, Error, { code: string }>({
    mutationFn: async ({ code }) => {
      const res = await signIn("verify-email", { redirect: false, code });
      if (!res || res.error)
        throw new Error(res?.error ?? "VerificationFailed");
      return getSession();
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: () => authService.resendVerification(),
  });
}

// Begins verification for an existing unverified account (login → "verify
// email" path). Sets the session cookie and sends a fresh code.
export function useStartVerification() {
  return useMutation({
    mutationFn: (data: { identifier: string }) =>
      authService.startVerification(data),
  });
}
