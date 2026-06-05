import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export function useGetSessions() {
  return useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => authService.getSessions(),
    select: (res) => res.data.data,
  });
}

export function useGetLoginHistory(limit = 5) {
  return useQuery({
    queryKey: ["auth", "login-history", limit],
    queryFn: () => authService.getLoginHistory(limit),
    select: (res) => res.data.data,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });
}

export function useRevokeAllSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authService.revokeAllSessions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "sessions"] }),
  });
}
