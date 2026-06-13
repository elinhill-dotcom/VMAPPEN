import { predictionsLocked } from "@/lib/config";

export type PlayerPickAccess = {
  globallyLocked: boolean;
  playerUnlocked: boolean;
  canSavePicks: boolean;
};

export const PLAYER_UNLOCKED_MESSAGE =
  "Du har fått låsa upp tips för ospelade matcher. Spelade matcher kan bara admin ändra.";

export function getPlayerPickAccess(
  playerUnlocked: boolean,
  now = new Date(),
): PlayerPickAccess {
  const globallyLocked = predictionsLocked(now);
  return {
    globallyLocked,
    playerUnlocked,
    canSavePicks: !globallyLocked || playerUnlocked,
  };
}

export function canPlayerEditMatch(
  match: { finished: boolean },
  access: PlayerPickAccess,
): boolean {
  if (!access.canSavePicks) return false;
  if (!access.globallyLocked) return true;
  return !match.finished;
}
