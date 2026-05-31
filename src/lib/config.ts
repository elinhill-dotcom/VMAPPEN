export function getPredictionLockAt(): Date {
  const raw =
    process.env.PREDICTION_LOCK_AT ?? "2026-06-11T21:00:00+02:00";
  return new Date(raw);
}

export function predictionsLocked(now = new Date()): boolean {
  return now >= getPredictionLockAt();
}

/** Shown when POST /api/predictions or /api/knockout-picks is rejected. */
export const PICKS_LOCKED_MESSAGE =
  "Tipsen är låsta — ingen kan ändra eller spara nya tips efter avspark 11 juni kl. 21:00.";

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
