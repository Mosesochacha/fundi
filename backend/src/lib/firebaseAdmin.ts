import admin from 'firebase-admin';

const {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env as Record<string, string | undefined>;

if (!admin.apps.length) {
  if (!NEXT_PUBLIC_FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase Admin configuration is incomplete');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: (FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

export const firebaseAuth = admin.auth();

