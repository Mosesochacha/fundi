import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { identifier: string }) =>
      authService.forgotPassword(data),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: { identifier: string }) => authService.resendOtp(data),
  });
}
