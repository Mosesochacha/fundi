import type {
  AppRole,
  AuthProfile,
  AuthUser,
} from "@/features/auth/types/auth.types";

/**
 * Derive the app's functional role from a backend user.
 * Staff privilege (`role`) wins over `accountType`.
 */
export function roleForUser(
  user: Pick<AuthUser, "role" | "accountType">,
): AppRole {
  if (user.role === "admin") return "admin";
  if (user.role === "moderator") return "moderator";
  if (user.accountType === "employer") return "employer";
  return "worker";
}

/**
 * Each role's dedicated dashboard landing route.
 *
 * Kept dependency-free on purpose — this module is imported by the edge
 * middleware, so it must not pull in `navConfig` (lucide icons, etc.).
 */
export function dashboardPathForRole(role: AppRole | undefined): string {
  switch (role) {
    case "employer":
      return "/employer/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "moderator":
      return "/moderator/dashboard";
    case "worker":
    default:
      return "/worker/dashboard";
  }
}

/**
 * Where a user should land after authenticating — their role-based dashboard.
 *
 * Callers should always check `user.isProfileComplete` first and send
 * incomplete users to /onboarding; this helper assumes the account is ready.
 */
export function redirectPathForRole(
  user: AuthUser,
  _profile?: AuthProfile | null,
): string {
  return dashboardPathForRole(roleForUser(user));
}
