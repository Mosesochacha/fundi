import { useMutation, useQuery } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { authService } from "../services/auth.service";

export interface PendingVerification {
  emailMasked: string;
  accountType: "employer" | "worker" | null;
}

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

export function useStartVerification() {
  return useMutation({
    mutationFn: (data: { identifier: string }) =>
      authService.startVerification(data),
  });
}
