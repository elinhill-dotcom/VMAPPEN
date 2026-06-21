import { mapPrediction } from "@/lib/firestore-mappers";
import type { PlayerRow, PredictionRow } from "@/lib/firestore-types";
import { getAdminFirestore, toErrorMessage, type DbResult } from "@/lib/firestore";

export type MatchPlayerTip = {
  playerId: string;
  name: string;
  homeScore: number;
  awayScore: number;
};

export async function loadMatchPlayerTips(
  matchId: number,
): Promise<DbResult<MatchPlayerTip[]>> {
  try {
    const db = getAdminFirestore();

    const [predsSnap, playersSnap] = await Promise.all([
      db.collection("predictions").where("match_id", "==", matchId).get(),
      db.collection("players").orderBy("name").get(),
    ]);

    const names = new Map<string, string>();
    for (const doc of playersSnap.docs) {
      names.set(doc.id, (doc.data() as PlayerRow).name);
    }

    const tips: MatchPlayerTip[] = [];
    for (const doc of predsSnap.docs) {
      const row = doc.data() as PredictionRow;
      const pred = mapPrediction({ ...row, id: doc.id });
      const name = names.get(pred.playerId);
      if (!name) continue;
      tips.push({
        playerId: pred.playerId,
        name,
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
      });
    }

    tips.sort((a, b) => a.name.localeCompare(b.name, "sv"));

    return { data: tips, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
