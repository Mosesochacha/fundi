import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import type { LoginResult } from "@/features/auth/types/auth.types";
import { API_BASE } from "@/lib/apiBase";
import { roleForUser } from "@/lib/authRedirect";

const ACCESS_TTL_MS = 15 * 60 * 1000; // matches backend JWT_ACCESS_EXPIRES=15m
const REFRESH_SKEW_MS = 30 * 1000; // refresh slightly early

/** Pull a named cookie value out of a Set-Cookie header list. */
function readSetCookie(res: Response, name: string): string | undefined {
  // undici exposes getSetCookie(); fall back to the combined header.
  const list =
    typeof (res.headers as { getSetCookie?: () => string[] }).getSetCookie ===
    "function"
      ? (
          res.headers as unknown as { getSetCookie: () => string[] }
        ).getSetCookie()
      : [res.headers.get("set-cookie") ?? ""];
  for (const raw of list) {
    const match = raw.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
}

/** Exchange the rotating refresh cookie for a fresh access token. */
async function refreshBackendToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `lot_r1=${token.refreshToken}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
    const json = (await res.json()) as { data: { accessToken: string } };
    const rotated = readSetCookie(res, "lot_r1") ?? token.refreshToken;
    return {
      ...token,
      accessToken: json.data.accessToken,
      refreshToken: rotated,
      accessTokenExpires: Date.now() + ACCESS_TTL_MS,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/**
 * Re-pull the backend user/profile into the JWT (e.g. after onboarding sets
 * isProfileComplete=true). Bounded by a timeout so a slow/unreachable backend
 * can never hang the auth flow. Mutates `token` in place.
 */
async function refreshBackendUser(token: JWT): Promise<void> {
  if (!token.accessToken) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return;
    const json = (await res.json()) as {
      data: { user: LoginResult["user"]; profile: LoginResult["profile"] };
    };
    if (json.data?.user) {
      token.user = json.data.user;
      token.profile = json.data.profile ?? null;
      token.role = roleForUser(json.data.user);
    }
  } catch {
    // best-effort; keep the existing token
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: credentials?.identifier,
            password: credentials?.password,
          }),
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data: LoginResult };
        const { user, profile, tokens } = json.data;
        if (!user || !tokens?.accessToken) return null;
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: roleForUser(user),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          backendUser: user,
          backendProfile: profile,
        };
      },
    }),
    Credentials({
      id: "verify-email",
      name: "Verify email",
      // The user submits the 6-digit OTP; the email being verified lives in the
      // signed `lot_pv` cookie. We forward the browser's cookies to the backend
      // so it can read that email, verify the code, and hand back session tokens
      // — auto-logging the user in the moment their email is confirmed.
      credentials: { code: {} },
      async authorize(credentials, request) {
        const code = credentials?.code;
        if (!code) return null;
        const cookie = request?.headers?.get?.("cookie") ?? "";
        const res = await fetch(`${API_BASE}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ code }),
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data: LoginResult };
        const { user, profile, tokens } = json.data;
        if (!user || !tokens?.accessToken) return null;
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: roleForUser(user),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          backendUser: user,
          backendProfile: profile,
        };
      },
    }),
    Credentials({
      id: "firebase-google",
      name: "Google",
      // The client gets a Firebase ID token from the Google popup and hands it
      // here; we exchange it with the backend for our own session tokens.
      credentials: { idToken: {} },
      async authorize(credentials) {
        const idToken = credentials?.idToken;
        if (!idToken) return null;
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data: LoginResult };
        const { user, profile, tokens } = json.data;
        if (!user || !tokens?.accessToken) return null;
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: roleForUser(user),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          backendUser: user,
          backendProfile: profile,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Credentials sign-in (password or firebase-google): seed the token.
      // authorize() always sets these on first sign-in.
      if (user?.accessToken && user.backendUser) {
        token.id = user.id!;
        token.role = user.role!;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken!;
        token.accessTokenExpires = Date.now() + ACCESS_TTL_MS;
        token.user = user.backendUser;
        token.profile = user.backendProfile ?? null;
        token.error = undefined;
        return token;
      }

      // Refresh the cached backend user when explicitly asked (update()) or
      // while the snapshot is still incomplete — so onboarding completion is
      // reflected on the very next request (middleware runs this via auth()),
      // without a re-login. Once isProfileComplete flips true this stops firing.
      if (trigger === "update" || (token.user && !token.user.isProfileComplete)) {
        await refreshBackendUser(token);
      }

      // Still valid — reuse.
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - REFRESH_SKEW_MS
      ) {
        return token;
      }

      // Expired — rotate.
      return refreshBackendToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.backendUser = token.user;
      session.backendProfile = token.profile;
      return session;
    },
  },
});
