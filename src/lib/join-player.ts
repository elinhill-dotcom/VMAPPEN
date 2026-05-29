import { setStoredPlayer, type StoredPlayer } from "./player-storage";

export async function joinOrResumeByName(
  name: string,
): Promise<{ player: StoredPlayer } | { error: string }> {
  const trimmed = name.trim();
  const res = await fetch("/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmed }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error ?? "Något gick fel" };
  }
  const player = data.player as StoredPlayer;
  setStoredPlayer(player);
  return { player };
}
