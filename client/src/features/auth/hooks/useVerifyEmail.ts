import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      authService.verifyEmail(data),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      authService.resendVerification(data),
  });
}
