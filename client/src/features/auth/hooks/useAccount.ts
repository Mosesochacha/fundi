import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (data: { newEmail: string; currentPassword: string }) =>
      authService.changeEmail(data),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (data: { confirmation: string }) =>
      authService.deleteAccount(data),
  });
}
