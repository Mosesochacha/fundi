import { useQuery } from "@tanstack/react-query";
import { profileService } from "../services/profile.service";
import type { WorkerProfile } from "../types/profile.types";

/** Public worker profile by id/username. Pass "me" to read your own. */
export function useGetProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["worker", "profile", id],
    queryFn: () =>
      id === "me"
        ? profileService.getMine()
        : profileService.getById(id as string),
    enabled: !!id,
    select: (res) => res.data.data as WorkerProfile,
  });
}

/** The authenticated user's own worker profile. */
export function useGetMyProfile(enabled = true) {
  return useQuery({
    queryKey: ["worker", "profile", "me"],
    queryFn: () => profileService.getMine(),
    enabled,
    select: (res) => res.data.data as WorkerProfile,
  });
}
