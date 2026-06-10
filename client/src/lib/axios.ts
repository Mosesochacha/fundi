import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
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

// Single-flight: concurrent callers (e.g. a screen mounting many queries at once)
// share one getSession() call so the NextAuth jwt callback rotates the backend
// refresh token exactly once, instead of racing N concurrent /auth/refresh calls.
let inFlight: Promise<string | undefined> | null = null;

async function getAccessToken(force = false): Promise<string | undefined> {
  if (!force && cachedToken.value && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  if (inFlight) return inFlight; // piggyback on an in-progress refresh
  inFlight = (async () => {
    try {
      // getSession() triggers the server-side jwt callback, refreshing if expired.
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
      // Force a fresh session — the jwt callback rotates the backend token.
      const token = await getAccessToken(true);
      if (token) {
        original.headers.set("Authorization", `Bearer ${token}`);
        return client(original);
      }
      // No valid session left — bounce to login.
      await signOut({ redirect: false });
      if (typeof window !== "undefined") window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default client;
