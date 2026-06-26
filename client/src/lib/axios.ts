import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { API_BASE } from "@/lib/apiBase";

/**
 * Single HTTP client for every feature service.
 *
 * NextAuth owns the tokens: the access token is read from the session (which the
 * NextAuth `jwt` callback keeps fresh by rotating the backend refresh cookie).
 * We cache it briefly so we don't hit /api/auth/session on every request.
 */
const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let cachedToken: { value: string | undefined; expiresAt: number } = {
  value: undefined,
  expiresAt: 0,
};

let inFlight: Promise<string | undefined> | null = null;

/** Drop the cached access token (e.g. on logout) so no stale token is reused. */
export function clearAccessTokenCache(): void {
  cachedToken = { value: undefined, expiresAt: 0 };
  inFlight = null;
}

async function getAccessToken(force = false): Promise<string | undefined> {
  if (!force && cachedToken.value && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const session = await getSession();
      cachedToken = {
        value: session?.accessToken,
        expiresAt: Date.now() + 30_000,
      };
      return session?.accessToken;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const token = await getAccessToken(true);
      if (token) {
        original.headers.set("Authorization", `Bearer ${token}`);
        return client(original);
      }
      await signOut({ redirect: false });
      if (typeof window !== "undefined") window.location.replace("/login");
    }

    return Promise.reject(error);
  },
);

export default client;
