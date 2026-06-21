export type ChatPresenceUser = {
  key: string;
  name: string;
  playerId?: string | null;
  at?: string;
};

/** Sessions without heartbeat within this window are hidden from the room count. */
export const CHAT_PRESENCE_TTL_MS = 90_000;

/** How often each client refreshes its session in Firestore. */
export const CHAT_PRESENCE_HEARTBEAT_MS = 30_000;

export type ChatPresenceStatus = "pending" | "ok" | "error";

export function isActiveChatPresence(
  at?: string,
  now = Date.now(),
): boolean {
  if (!at) return false;
  const t = new Date(at).getTime();
  return Number.isFinite(t) && now - t < CHAT_PRESENCE_TTL_MS;
}

export function filterActiveChatPresence(
  users: ChatPresenceUser[],
  now = Date.now(),
): ChatPresenceUser[] {
  return users.filter((u) => isActiveChatPresence(u.at, now));
}
