import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore as getClientFirestore,
  type Firestore,
} from "firebase/firestore";

function firebasePublicConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_API_KEY",
    );
  }
  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

let browserApp: FirebaseApp | null = null;
let browserDb: Firestore | null = null;

/** Browser Firestore — realtime chat listeners. */
export function getFirestoreBrowser(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("getFirestoreBrowser() is for client components only");
  }
  if (!browserDb) {
    if (!browserApp) {
      browserApp =
        getApps().length > 0
          ? getApps()[0]!
          : initializeApp(firebasePublicConfig());
    }
    browserDb = getClientFirestore(browserApp);
  }
  return browserDb;
}
