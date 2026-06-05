import type { AppRole, AuthProfile, AuthUser } from "@/features/auth/types/auth.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: AppRole;
    };
    accessToken: string;
    /** Set to "RefreshAccessTokenError" / "GoogleSignInError" when re-auth is required. */
    error?: string;
    /** Full backend user/profile, hydrated at sign-in for immediate render. */
    backendUser?: AuthUser;
    backendProfile?: AuthProfile | null;
  }

  /** Object returned by the Credentials `authorize` callback.
   * Fields are optional so the type stays compatible with NextAuth's AdapterUser. */
  interface User {
    role?: AppRole;
    accessToken?: string;
    refreshToken?: string;
    backendUser?: AuthUser;
    backendProfile?: AuthProfile | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    user: AuthUser;
    profile: AuthProfile | null;
    error?: string;
  }
}
