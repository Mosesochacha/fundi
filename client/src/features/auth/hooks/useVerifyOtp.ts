import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: { identifier: string; otp: string }) =>
      authService.verifyOtp(data),
  });
}
