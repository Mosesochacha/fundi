import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import type { Session } from "next-auth";

/**
 * Credentials login via NextAuth. Returns the established session so callers can
 * route on `backendUser.isOnboarded` / `user.role`.
 * Throws on failure (NextAuth surfaces a generic `CredentialsSignin` error).
 */
export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (
    identifier: string,
    password: string,
  ): Promise<Session | null> => {
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier,
        password,
      });
      if (!res || res.error) {
        throw new Error(res?.error ?? "LoginFailed");
      }
      return await getSession();
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
