const KEY = "vmapp_player";

export type StoredPlayer = { id: string; name: string };

export function getStoredPlayer(): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPlayer;
  } catch {
    return null;
  }
}

export function setStoredPlayer(player: StoredPlayer): void {
  localStorage.setItem(KEY, JSON.stringify(player));
}

export function clearStoredPlayer(): void {
  localStorage.removeItem(KEY);
}
