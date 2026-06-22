import { useMutation } from "@tanstack/react-query";
import { authService, type RegisterInput } from "../services/auth.service";

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) => authService.register(data),
  });
}
