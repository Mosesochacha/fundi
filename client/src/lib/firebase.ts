import { getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let auth: Auth | undefined;
function firebaseAuth(): Auth {
  if (!auth) auth = getAuth(firebaseApp);
  return auth;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function googleErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.";
    case "auth/popup-blocked":
      return "Popup was blocked by the browser. Allow popups for this site and try again.";
    case "auth/configuration-not-found":
      return "Google provider is not configured in Firebase. Enable Google in Authentication → Sign-in method.";
    default:
      return null;
  }
}

export async function signInWithGoogleFirebase(): Promise<string | null> {
  try {
    const cred = await signInWithPopup(firebaseAuth(), googleProvider);
    return await cred.user.getIdToken();
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      return null;
    }
    const msg = googleErrorMessage(code);
    throw new Error(
      msg || `Google sign-in failed (${code || "unknown error"})`,
    );
  }
}
