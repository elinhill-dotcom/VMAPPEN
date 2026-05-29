"use client";

import { initializeApp, getApps, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { mapChatMessage } from "@/lib/firestore-mappers";
import type { ChatMessageRow } from "@/lib/firestore-types";

export type ChatMessage = ReturnType<typeof mapChatMessage>;

const CHAT_MESSAGES = "chat_messages";
const CHAT_PRESENCE = "chat_presence";

export type ChatPresenceUser = {
  key: string;
  name: string;
  playerId?: string | null;
  at?: string;
};

/** Firebase web config from environment (no auth). */
export function getFirebaseConfig(): FirebaseOptions {
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
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );
}

let clientApp: FirebaseApp | null = null;
let clientDb: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseApp() is for client components only");
  }
  if (!clientApp) {
    clientApp =
      getApps().length > 0 ? getApps()[0]! : initializeApp(getFirebaseConfig());
  }
  return clientApp;
}

export function getClientFirestore(): Firestore {
  if (!clientDb) {
    clientDb = getFirestore(getFirebaseApp());
  }
  return clientDb;
}

export type ChatRoomSubscription = {
  unsubscribe: () => void;
};

/** Live chat via Firestore onSnapshot (no auth). */
export function subscribeToMatchChatRoom(
  matchId: number,
  presence: ChatPresenceUser,
  handlers: {
    onInsert: (message: ChatMessage) => void;
    onPresence: (users: ChatPresenceUser[]) => void;
    onStatus?: (status: string) => void;
  },
): ChatRoomSubscription {
  const db = getClientFirestore();
  const presenceRef = doc(
    db,
    CHAT_PRESENCE,
    String(matchId),
    "sessions",
    presence.key,
  );

  const messagesQuery = query(
    collection(db, CHAT_MESSAGES),
    where("match_id", "==", matchId),
    orderBy("created_at", "asc"),
    limit(150),
  );

  const presenceQuery = collection(
    db,
    CHAT_PRESENCE,
    String(matchId),
    "sessions",
  );

  const seen = new Set<string>();

  const unsubMessages: Unsubscribe = onSnapshot(
    messagesQuery,
    (snap) => {
      handlers.onStatus?.("SUBSCRIBED");
      for (const change of snap.docChanges()) {
        if (change.type !== "added") continue;
        const row = { id: change.doc.id, ...change.doc.data() } as ChatMessageRow;
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        handlers.onInsert(mapChatMessage(row));
      }
    },
    () => handlers.onStatus?.("CHANNEL_ERROR"),
  );

  const unsubPresence = onSnapshot(presenceQuery, (snap) => {
    const users: ChatPresenceUser[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        key: d.id,
        name: (data.name as string) ?? "Anonym",
        playerId: (data.player_id as string | null) ?? null,
        at: data.at as string | undefined,
      };
    });
    users.sort((a, b) => a.name.localeCompare(b.name, "sv"));
    handlers.onPresence(users);
  });

  void setDoc(presenceRef, {
    name: presence.name,
    player_id: presence.playerId ?? null,
    at: new Date().toISOString(),
  });

  return {
    unsubscribe: () => {
      unsubMessages();
      unsubPresence();
      void deleteDoc(presenceRef);
    },
  };
}

export function unsubscribeChat(sub: ChatRoomSubscription) {
  sub.unsubscribe();
}

export async function sendChatMessage(
  matchId: number,
  name: string,
  message: string,
  adminPassword?: string | null,
): Promise<{ data: ChatMessage | null; error: string | null }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (adminPassword) {
      headers["x-admin-password"] = adminPassword;
    }
    const res = await fetch(`/api/chat/${matchId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: data.error ?? "Kunde inte skicka" };
    }
    return { data: data.message as ChatMessage, error: null };
  } catch (e) {
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: string }).message)
        : "Något gick fel";
    return { data: null, error: msg };
  }
}
