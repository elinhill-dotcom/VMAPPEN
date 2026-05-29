import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminDb: Firestore | null = null;

/** Server Firestore — API routes. */
export function getFirestoreServer(): Firestore {
  if (adminDb) return adminDb;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }

  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (raw) {
      initializeApp({
        credential: cert(JSON.parse(raw) as Record<string, string>),
        projectId,
      });
    } else {
      initializeApp({ projectId });
    }
  }

  adminDb = getFirestore();
  return adminDb;
}
