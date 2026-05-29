"use client";

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { mapChatMessage } from "@/lib/firestore-mappers";
import type { ChatMessageRow } from "@/lib/firestore-types";
import { getFirestoreBrowser } from "@/lib/firestore-client";
import { toErrorMessage, type DbResult } from "@/lib/firestore-shared";
import type { ChatMessage } from "@/lib/firestore-chat-server";

export type { ChatMessage };

export type ChatPresenceUser = {
  key: string;
  name: string;
  playerId?: string | null;
  at?: string;
};

export async function sendChatMessage(
  matchId: number,
  name: string,
  message: string,
  adminPassword?: string | null,
): Promise<DbResult<ChatMessage>> {
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
    return { data: null, error: toErrorMessage(e) };
  }
}

export type ChatRoomSubscription = {
  unsubscribe: () => void;
};

export function subscribeToMatchChatRoom(
  matchId: number,
  presence: ChatPresenceUser,
  handlers: {
    onInsert: (message: ChatMessage) => void;
    onPresence: (users: ChatPresenceUser[]) => void;
    onStatus?: (status: string) => void;
  },
): ChatRoomSubscription {
  const db = getFirestoreBrowser();
  const presenceRef = doc(
    db,
    "match_chat_presence",
    String(matchId),
    "sessions",
    presence.key,
  );

  const messagesQuery = query(
    collection(db, "match_chat_messages"),
    where("match_id", "==", matchId),
    orderBy("created_at", "asc"),
    limit(150),
  );

  const presenceQuery = collection(
    db,
    "match_chat_presence",
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
