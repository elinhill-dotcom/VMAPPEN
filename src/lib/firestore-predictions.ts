import type { KnockoutFormState } from "@/lib/knockout-picks";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import {
  knockoutPickToRow,
  mapKnockoutAnswer,
  mapKnockoutPick,
  mapPrediction,
} from "@/lib/firestore-mappers";
import type { KnockoutAnswerRow, KnockoutPickRow, PredictionRow } from "@/lib/firestore-types";
import { getFirestoreServer } from "@/lib/firestore-admin";
import { toErrorMessage, type DbResult } from "@/lib/firestore-shared";

const validGroupIds = new Set(GROUP_MATCH_IDS);

function predictionsCol() {
  return getFirestoreServer().collection("predictions");
}

function predictionId(playerId: string, matchId: number) {
  return `${playerId}_${matchId}`;
}

export async function loadGroupPredictions(
  playerId: string,
): Promise<DbResult<ReturnType<typeof mapPrediction>[]>> {
  try {
    const snap = await predictionsCol()
      .where("player_id", "==", playerId)
      .get();

    const rows = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as PredictionRow))
      .filter((row) => validGroupIds.has(row.match_id));

    return { data: rows.map(mapPrediction), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function saveGroupPredictions(
  playerId: string,
  items: { matchId: number; homeScore: number; awayScore: number }[],
): Promise<DbResult<{ savedCount: number }>> {
  try {
    const db = getFirestoreServer();
    const batch = db.batch();
    let writeCount = 0;

    for (const item of items) {
      if (!validGroupIds.has(item.matchId)) continue;
      const h = item.homeScore;
      const a = item.awayScore;
      if (
        !Number.isInteger(h) ||
        !Number.isInteger(a) ||
        h < 0 ||
        a < 0 ||
        h > 20 ||
        a > 20
      ) {
        continue;
      }

      const ref = predictionsCol().doc(predictionId(playerId, item.matchId));
      batch.set(ref, {
        player_id: playerId,
        match_id: item.matchId,
        home_score: h,
        away_score: a,
      });
      writeCount += 1;
    }

    if (writeCount > 0) await batch.commit();

    const snap = await predictionsCol()
      .where("player_id", "==", playerId)
      .get();
    const count = snap.docs.filter((doc) =>
      validGroupIds.has(doc.data().match_id as number),
    ).length;

    return { data: { savedCount: count }, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function clearPlayerPicks(playerId: string): Promise<DbResult<true>> {
  try {
    const db = getFirestoreServer();
    const batch = db.batch();

    const preds = await predictionsCol()
      .where("player_id", "==", playerId)
      .get();
    for (const doc of preds.docs) {
      if (validGroupIds.has(doc.data().match_id as number)) {
        batch.delete(doc.ref);
      }
    }
    batch.delete(db.collection("knockout_picks").doc(playerId));
    await batch.commit();
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function loadKnockoutPick(
  playerId: string,
): Promise<DbResult<KnockoutFormState | null>> {
  try {
    const doc = await getFirestoreServer()
      .collection("knockout_picks")
      .doc(playerId)
      .get();
    if (!doc.exists) return { data: null, error: null };
    return {
      data: mapKnockoutPick({
        id: doc.id,
        ...doc.data(),
      } as KnockoutPickRow),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function saveKnockoutPick(
  playerId: string,
  form: KnockoutFormState,
): Promise<DbResult<KnockoutFormState>> {
  try {
    const ref = getFirestoreServer().collection("knockout_picks").doc(playerId);
    const row = knockoutPickToRow(playerId, form);
    await ref.set(row);
    const doc = await ref.get();
    return {
      data: mapKnockoutPick({ id: doc.id, ...doc.data() } as KnockoutPickRow),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function loadKnockoutAnswer(): Promise<
  DbResult<ReturnType<typeof mapKnockoutAnswer> | null>
> {
  try {
    const doc = await getFirestoreServer()
      .collection("knockout_answer")
      .doc("config")
      .get();
    if (!doc.exists) return { data: null, error: null };
    return {
      data: mapKnockoutAnswer({ id: 1, ...doc.data() } as KnockoutAnswerRow),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function saveKnockoutAnswer(
  form: KnockoutFormState & { set?: boolean },
): Promise<DbResult<true>> {
  try {
    await getFirestoreServer()
      .collection("knockout_answer")
      .doc("config")
      .set({
        id: 1,
        sf1_home: form.sf1Home || null,
        sf1_away: form.sf1Away || null,
        sf2_home: form.sf2Home || null,
        sf2_away: form.sf2Away || null,
        final_home: form.finalHome || null,
        final_away: form.finalAway || null,
        bronze_home: form.bronzeHome || null,
        bronze_away: form.bronzeAway || null,
        champion: form.champion || null,
        set: form.set !== false,
      });
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
