import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  settingsService,
  type GenerateProfileInput,
  type UpdateProfileInput,
} from "./services/settings.service";

export * from "./services/settings.service";

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => settingsService.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

export function usePublishProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => settingsService.publishProfile(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}

export function useGenerateProfile() {
  return useMutation({
    mutationFn: (data: GenerateProfileInput) =>
      settingsService.generateProfile(data),
  });
}

export function useGetNotifications() {
  return useQuery({
    queryKey: ["settings", "notifications"],
    queryFn: () => settingsService.getNotifications(),
    select: (res) => res.data.data,
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      settingsService.updateNotifications(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["settings", "notifications"] }),
  });
}

export function useGetPrivacy() {
  return useQuery({
    queryKey: ["settings", "privacy"],
    queryFn: () => settingsService.getPrivacy(),
    select: (res) => res.data.data,
  });
}

export function useUpdatePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, boolean>) =>
      settingsService.updatePrivacy(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "privacy"] }),
  });
}

export function useGetPreferences() {
  return useQuery({
    queryKey: ["settings", "preferences"],
    queryFn: () => settingsService.getPreferences(),
    select: (res) => res.data.data,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, string>) =>
      settingsService.updatePreferences(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["settings", "preferences"] }),
  });
}

export function useGetProfileStats() {
  return useQuery({
    queryKey: ["settings", "stats"],
    queryFn: () => settingsService.getProfileStats(),
    select: (res) => res.data.data,
  });
}

export function useGetProfileActivity() {
  return useQuery({
    queryKey: ["settings", "activity"],
    queryFn: () => settingsService.getProfileActivity(),
    select: (res) => res.data.data,
  });
}

export function useGetAnalytics() {
  return useQuery({
    queryKey: ["settings", "analytics"],
    queryFn: () => settingsService.getAnalytics(),
    select: (res) => res.data.data,
  });
}
