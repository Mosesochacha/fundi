import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: {
      newPassword: string;
      identifier?: string;
      otp?: string;
      token?: string;
    }) => authService.resetPassword(data),
  });
}
