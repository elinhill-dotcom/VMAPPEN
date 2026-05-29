import { isMatchLive } from "@/lib/match-live";
import { mapChatMessage } from "@/lib/firestore-mappers";
import type { ChatMessageRow } from "@/lib/firestore-types";
import { getFirestoreServer } from "@/lib/firestore-admin";
import { toErrorMessage, type DbResult } from "@/lib/firestore-shared";
import { fetchMatchById } from "@/lib/firestore-matches";

export type ChatMessage = ReturnType<typeof mapChatMessage>;

export async function loadChatMessages(
  matchId: number,
  since?: string,
): Promise<DbResult<ChatMessage[]>> {
  try {
    let q = getFirestoreServer()
      .collection("match_chat_messages")
      .where("match_id", "==", matchId)
      .orderBy("created_at")
      .limit(since ? 100 : 150);

    if (since) {
      q = q.where("created_at", ">", since) as typeof q;
    }

    const snap = await q.get();
    return {
      data: snap.docs.map((doc) =>
        mapChatMessage({ id: doc.id, ...doc.data() } as ChatMessageRow),
      ),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

function validateChatInput(
  name: string,
  message: string,
): { name: string; message: string } | { error: string } {
  const trimmedName = name.trim();
  const trimmedMsg = message.trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    return { error: "Ange ett giltigt namn." };
  }
  if (trimmedMsg.length < 1 || trimmedMsg.length > 400) {
    return { error: "Meddelandet måste vara 1–400 tecken." };
  }
  return { name: trimmedName, message: trimmedMsg };
}

export async function insertChatMessage(
  matchId: number,
  name: string,
  message: string,
  opts?: { skipLiveCheck?: boolean },
): Promise<DbResult<ChatMessage>> {
  const matchRes = await fetchMatchById(matchId);
  if (matchRes.error || !matchRes.data) {
    return { data: null, error: matchRes.error ?? "Matchen hittades inte" };
  }
  if (!opts?.skipLiveCheck && !isMatchLive(matchRes.data.kickoffAt)) {
    return {
      data: null,
      error:
        "Livechatten är stängd. Den öppnar 15 minuter före avspark och stänger 2 timmar efter.",
    };
  }

  const validated = validateChatInput(name, message);
  if ("error" in validated) {
    return { data: null, error: validated.error };
  }

  try {
    const ref = getFirestoreServer().collection("match_chat_messages").doc();
    const created_at = new Date().toISOString();
    await ref.set({
      match_id: matchId,
      name: validated.name,
      message: validated.message,
      created_at,
    });
    return {
      data: mapChatMessage({
        id: ref.id,
        match_id: matchId,
        name: validated.name,
        message: validated.message,
        created_at,
      }),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
