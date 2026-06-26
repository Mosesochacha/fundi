import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import type { LoginResult } from "@/features/auth/types/auth.types";
import { API_BASE } from "@/lib/apiBase";
import { roleForUser } from "@/lib/authRedirect";

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_SKEW_MS = 30 * 1000;

/** Pull a named cookie value out of a Set-Cookie header list. */
function readSetCookie(res: Response, name: string): string | undefined {
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
      headers: {
        "User-Agent": "Frontend-API-Proxy",
        Cookie: `lot_r1=${token.refreshToken}`,
      },
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
      headers: {
        "User-Agent": "Frontend-API-Proxy",
        Authorization: `Bearer ${token.accessToken}`,
      },
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
  } catch {}
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
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Frontend-API-Proxy",
          },
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
      credentials: { code: {} },
      async authorize(credentials, request) {
        const code = credentials?.code;
        if (!code) return null;
        const cookie = request?.headers?.get?.("cookie") ?? "";
        const res = await fetch(`${API_BASE}/auth/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Frontend-API-Proxy",
            Cookie: cookie,
          },
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
      credentials: { idToken: {} },
      async authorize(credentials) {
        const idToken = credentials?.idToken;
        if (!idToken) return null;
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Frontend-API-Proxy",
          },
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
      if (user?.accessToken && user.backendUser) {
        token.id = user.id as string;
        token.role = user.role as typeof token.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken as string;
        token.accessTokenExpires = Date.now() + ACCESS_TTL_MS;
        token.user = user.backendUser;
        token.profile = user.backendProfile ?? null;
        token.error = undefined;
        return token;
      }

      if (
        trigger === "update" ||
        (token.user && !token.user.isProfileComplete)
      ) {
        await refreshBackendUser(token);
      }

      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - REFRESH_SKEW_MS
      ) {
        return token;
      }

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
