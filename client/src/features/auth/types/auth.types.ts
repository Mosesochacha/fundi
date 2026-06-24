/** Shared auth domain types (ported from the old Redux authSlice). */

/** Functional role used for routing & dashboards. Derived from the backend
 * user's `role` (staff) + `accountType` (worker/employer) via `roleForUser`. */
export type AppRole = "worker" | "employer" | "admin" | "moderator";

/** Raw backend privilege role. */
export type BackendRole = "user" | "admin" | "moderator";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: BackendRole;
  accountType?: "employer" | "worker" | null;
  phoneNumber?: string | null;
  /** Preferred display currency (ISO 4217 code, e.g. "USD"). */
  currency?: string;
  status: "active" | "inactive" | "suspended";
  emailVerified: boolean;
  isOnboarded: boolean;
  isProfileComplete?: boolean;
  isActive: boolean;
}

export interface AuthProfile {
  id: string;
  username: string;
  fullName: string;
  profession: string;
  location: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string | null;
}

/** Standard backend envelope: every endpoint returns `{ success, message, data }`. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: AuthUser;
  profile: AuthProfile | null;
  tokens: AuthTokens;
}
