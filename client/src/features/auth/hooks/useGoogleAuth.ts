import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { signInWithGoogleFirebase } from "@/lib/firebase";

/**
 * "Continue with Google": opens the Firebase Google popup, exchanges the
 * resulting Firebase ID token for our NextAuth session via the `firebase-google`
 * provider, then returns the established session so callers can route on
 * `backendUser.isOnboarded` / `user.role`.
 *
 * Returns `null` when the user closes the popup (no error). Throws on a real
 * sign-in failure (popup errors or backend rejection).
 */
export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const googleSignIn = async (): Promise<Session | null> => {
    setIsLoading(true);
    try {
      const idToken = await signInWithGoogleFirebase();
      if (!idToken) return null; // popup closed
      const res = await signIn("firebase-google", {
        redirect: false,
        idToken,
      });
      if (!res || res.error) {
        throw new Error("Google sign-in failed");
      }
      return await getSession();
    } finally {
      setIsLoading(false);
    }
  };

  return { googleSignIn, isLoading };
}
