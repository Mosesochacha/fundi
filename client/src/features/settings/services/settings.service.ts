import client from "@/lib/axios";

export interface UpdateProfileInput {
  fullName?: string;
  username?: string;
  profession?: string;
  location?: string;
  bio?: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  yearsExperience?: number;
  services?: string[];
  theme?: string;
  displayNameFormat?: string;
  profileLayout?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface GenerateProfileInput {
  fullName?: string;
  profession: string;
  location?: string;
  yearsExperience?: number;
  differentiator?: string;
}

export const settingsService = {
  updateProfile: (data: UpdateProfileInput) =>
    client.patch("/profile", data),
  publishProfile: () => client.post("/profile/publish"),
  generateProfile: (data: GenerateProfileInput) =>
    client.post("/generate/profile", data),

  getNotifications: () => client.get("/settings/notifications"),
  updateNotifications: (data: Record<string, boolean>) =>
    client.patch("/settings/notifications", data),

  getPrivacy: () => client.get("/settings/privacy"),
  updatePrivacy: (data: Record<string, boolean>) =>
    client.patch("/settings/privacy", data),

  getPreferences: () => client.get("/settings/preferences"),
  updatePreferences: (data: Record<string, string>) =>
    client.patch("/settings/preferences", data),

  getProfileStats: () => client.get("/profile/stats"),
  getProfileActivity: () => client.get("/profile/activity"),
  getAnalytics: () => client.get("/profile/analytics"),
};
