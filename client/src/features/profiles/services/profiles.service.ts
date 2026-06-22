import client from "@/lib/axios";

export interface BrowseParams {
  q?: string;
  profession?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export const profilesService = {
  getProfile: (username: string) => client.get(`/profiles/${username}`),
  getProfilePosts: (username: string, page = 1) =>
    client.get(`/profiles/${username}/posts?page=${page}`),
  toggleFollow: (profileId: string) => client.post(`/follow/${profileId}`),
  searchProfiles: (q: string) =>
    client.get(`/profiles/search?q=${encodeURIComponent(q)}`),
  checkUsername: (u: string) =>
    client.get(`/profiles/check-username?u=${encodeURIComponent(u)}`),
  checkUsernamePublic: (u: string) =>
    client.get(`/public/check-username?u=${encodeURIComponent(u)}`),
  browse: ({ q, profession, location, page = 1, limit = 20 }: BrowseParams = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (profession) params.set("profession", profession);
    if (location) params.set("location", location);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return client.get(`/profiles/browse?${params.toString()}`);
  },
};
