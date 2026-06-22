import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { profilesService, type BrowseParams } from "./services/profiles.service";

export * from "./services/profiles.service";

export function useGetProfile(username: string | undefined) {
  return useQuery({
    queryKey: ["profiles", "detail", username],
    queryFn: () => profilesService.getProfile(username!),
    enabled: !!username,
    select: (res) => res.data.data,
  });
}

export function useGetProfilePosts(username: string | undefined, page = 1) {
  return useQuery({
    queryKey: ["profiles", "posts", username, page],
    queryFn: () => profilesService.getProfilePosts(username!, page),
    enabled: !!username,
    select: (res) => res.data.data,
  });
}

export function useBrowseProfiles(params: BrowseParams = {}) {
  return useQuery({
    queryKey: ["profiles", "browse", params],
    queryFn: () => profilesService.browse(params),
    select: (res) => res.data,
  });
}

export function useSearchProfiles(q: string) {
  return useQuery({
    queryKey: ["profiles", "search", q],
    queryFn: () => profilesService.searchProfiles(q),
    enabled: q.trim().length > 0,
    select: (res) => res.data.data,
  });
}

export function useCheckUsername(u: string, enabled = true) {
  return useQuery({
    queryKey: ["profiles", "check-username", u],
    queryFn: () => profilesService.checkUsername(u),
    enabled: enabled && u.trim().length > 0,
    select: (res) => res.data.data,
  });
}

export function useCheckUsernamePublic(u: string, enabled = true) {
  return useQuery({
    queryKey: ["profiles", "check-username-public", u],
    queryFn: () => profilesService.checkUsernamePublic(u),
    enabled: enabled && u.trim().length > 0,
    select: (res) => res.data.data,
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => profilesService.toggleFollow(profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
