import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "../services/profile.service";

const invalidate = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["worker", "profile"] });

export function useUpdateAbout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { about: string }) => profileService.updateAbout(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { services: string[] }) =>
      profileService.updateServices(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { dailyRate: number }) =>
      profileService.updateRate(data),
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateServiceArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { areas: string[] }) =>
      profileService.updateServiceArea(data),
    onSuccess: () => invalidate(qc),
  });
}
