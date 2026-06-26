import client from "@/lib/axios";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export type Trade =
  | "Plumber"
  | "Electrician"
  | "Carpenter"
  | "Painter"
  | "Mason"
  | "House help"
  | "Mechanic"
  | "Gardener"
  | "Cleaner"
  | "Welder"
  | "AC Tech"
  | "Chef";

export const TRADES: Trade[] = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mason",
  "House help",
  "Mechanic",
  "Gardener",
  "Cleaner",
  "Welder",
  "AC Tech",
  "Chef",
];

export interface ProfileSettings {
  firstName: string;
  lastName: string;
  username: string;
  profession: string;
  location: string;
  about: string;
  dailyRate: number | null;
  /** Preferred display currency (ISO 4217 code, e.g. "USD"). */
  currency: string;
  avatarUrl: string | null;
}

export interface AccountSettings {
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  googleConnected: boolean;
  googleEmail: string | null;
}

export interface NotificationSettings {
  newRequests: boolean;
  jobAccepted: boolean;
  jobReminders: boolean;
  newMessages: boolean;
  newReviews: boolean;
  profileViews: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface PrivacySettings {
  publicProfile: boolean;
  showPhone: boolean;
  showRate: boolean;
  showOnline: boolean;
  allowDirectMessages: boolean;
  appearInSearch: boolean;
}

export type MaxDistance = "5" | "10" | "20" | "50" | "any";

export interface AvailabilitySettings {
  available: boolean;
  emergencyCallouts: boolean;
  weekends: boolean;
  workingHoursFrom: string;
  workingHoursTo: string;
  maxDistance: MaxDistance;
}

export interface WorkerSettings {
  profile: ProfileSettings;
  account: AccountSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  availability: AvailabilitySettings;
}

export type UpdateProfileInput = Partial<ProfileSettings>;
export interface UpdateEmailInput {
  email: string;
}
export interface UpdatePhoneInput {
  phone: string;
}
export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}
export type UpdateNotificationsInput = Partial<NotificationSettings>;
export type UpdatePrivacyInput = Partial<PrivacySettings>;
export type UpdateAvailabilityInput = Partial<AvailabilitySettings>;

export const workerSettingsService = {
  get: () => client.get("/worker/settings"),

  updateProfile: (data: UpdateProfileInput) =>
    client.patch("/worker/profile", data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return client.patch("/worker/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  removeAvatar: () => client.delete("/worker/profile/avatar"),

  updateEmail: (data: UpdateEmailInput) =>
    client.patch("/worker/account/email", data),
  verifyEmail: () => client.post("/worker/account/email/verify"),
  updatePhone: (data: UpdatePhoneInput) =>
    client.patch("/worker/account/phone", data),
  verifyPhone: () => client.post("/worker/account/phone/verify"),
  updatePassword: (data: UpdatePasswordInput) =>
    client.patch("/worker/account/password", data),
  disconnectGoogle: () => client.post("/worker/account/google/disconnect"),

  updateNotifications: (data: UpdateNotificationsInput) =>
    client.patch("/worker/notifications", data),
  updatePrivacy: (data: UpdatePrivacyInput) =>
    client.patch("/worker/privacy", data),
  updateAvailability: (data: UpdateAvailabilityInput) =>
    client.patch("/worker/availability", data),

  pauseAccount: () => client.patch("/worker/account/pause"),
  exportData: () =>
    client.post("/worker/account/export", undefined, { responseType: "blob" }),
  deleteAccount: () => client.delete("/worker/account"),
};

export const DEFAULT_SETTINGS: WorkerSettings = {
  profile: {
    firstName: "",
    lastName: "",
    username: "",
    profession: "",
    location: "",
    about: "",
    dailyRate: null,
    currency: DEFAULT_CURRENCY,
    avatarUrl: null,
  },
  account: {
    email: "",
    emailVerified: false,
    phone: "",
    phoneVerified: false,
    googleConnected: false,
    googleEmail: null,
  },
  notifications: {
    newRequests: true,
    jobAccepted: true,
    jobReminders: true,
    newMessages: true,
    newReviews: true,
    profileViews: false,
    push: true,
    email: true,
    sms: false,
  },
  privacy: {
    publicProfile: true,
    showPhone: false,
    showRate: true,
    showOnline: true,
    allowDirectMessages: true,
    appearInSearch: true,
  },
  availability: {
    available: true,
    emergencyCallouts: true,
    weekends: false,
    workingHoursFrom: "07:00",
    workingHoursTo: "18:00",
    maxDistance: "10",
  },
};

/** Merge a (possibly partial) server response onto the defaults. */
export function mergeSettings(
  data: Partial<WorkerSettings> | undefined | null,
): WorkerSettings {
  return {
    profile: { ...DEFAULT_SETTINGS.profile, ...data?.profile },
    account: { ...DEFAULT_SETTINGS.account, ...data?.account },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...data?.notifications,
    },
    privacy: { ...DEFAULT_SETTINGS.privacy, ...data?.privacy },
    availability: { ...DEFAULT_SETTINGS.availability, ...data?.availability },
  };
}
