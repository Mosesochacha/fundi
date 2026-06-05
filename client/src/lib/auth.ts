import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { API_BASE } from "@/lib/apiBase";
import { roleForUser } from "@/lib/authRedirect";
import type { LoginResult } from "@/features/auth/types/auth.types";

const ACCESS_TTL_MS = 15 * 60 * 1000; // matches backend JWT_ACCESS_EXPIRES=15m
const REFRESH_SKEW_MS = 30 * 1000; // refresh slightly early

/** Pull a named cookie value out of a Set-Cookie header list. */
function readSetCookie(res: Response, name: string): string | undefined {
  // undici exposes getSetCookie(); fall back to the combined header.
  const list =
    typeof (res.headers as { getSetCookie?: () => string[] }).getSetCookie ===
    "function"
      ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Google: exchange the Google id_token for backend tokens.
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token }),
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`google login failed: ${res.status}`);
          const json = (await res.json()) as { data: LoginResult };
          const { user: bUser, profile, tokens } = json.data;
          token.id = bUser.id;
          token.role = roleForUser(bUser);
          token.accessToken = tokens.accessToken;
          token.refreshToken = tokens.refreshToken;
          token.accessTokenExpires = Date.now() + ACCESS_TTL_MS;
          token.user = bUser;
          token.profile = profile;
          token.error = undefined;
          return token;
        } catch {
          token.error = "GoogleSignInError";
          return token;
        }
      }

      // Credentials sign-in: seed the token. (authorize always sets these.)
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
