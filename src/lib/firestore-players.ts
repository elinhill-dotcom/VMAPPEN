import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import { mapPlayer } from "@/lib/firestore-mappers";
import type { PlayerRow } from "@/lib/firestore-types";
import { getFirestoreServer } from "@/lib/firestore-admin";
import { toErrorMessage, type DbResult } from "@/lib/firestore-shared";

function playersCol() {
  return getFirestoreServer().collection("players");
}

export async function findOrCreatePlayerByName(
  name: string,
): Promise<DbResult<ReturnType<typeof mapPlayer>>> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { data: null, error: "Ange ett namn (2–80 tecken)." };
  }

  try {
    const db = getFirestoreServer();
    const existing = await playersCol()
      .where("name", "==", trimmed)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0]!;
      return {
        data: mapPlayer({ id: doc.id, ...doc.data() } as PlayerRow),
        error: null,
      };
    }

    const ref = playersCol().doc();
    const created_at = new Date().toISOString();
    await ref.set({ name: trimmed, created_at });
    return {
      data: mapPlayer({ id: ref.id, name: trimmed, created_at }),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function findPlayerById(
  playerId: string,
): Promise<DbResult<ReturnType<typeof mapPlayer> | null>> {
  try {
    const doc = await playersCol().doc(playerId).get();
    if (!doc.exists) return { data: null, error: null };
    return {
      data: mapPlayer({ id: doc.id, ...doc.data() } as PlayerRow),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function isPlayerNameTaken(
  name: string,
  excludePlayerId?: string,
): Promise<DbResult<boolean>> {
  try {
    const snap = await playersCol()
      .where("name", "==", name.trim())
      .limit(1)
      .get();
    if (snap.empty) return { data: false, error: null };
    const found = snap.docs[0]!.id;
    if (excludePlayerId && found === excludePlayerId) {
      return { data: false, error: null };
    }
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchAdminPlayers(): Promise<
  DbResult<
    {
      id: string;
      name: string;
      createdAt: string;
      groupPicksCount: number;
      hasKnockoutPick: boolean;
    }[]
  >
> {
  try {
    const db = getFirestoreServer();
    const [playersSnap, predsSnap, koSnap] = await Promise.all([
      playersCol().orderBy("created_at", "desc").get(),
      db.collection("predictions").select("player_id", "match_id").get(),
      db.collection("knockout_picks").select("player_id").get(),
    ]);

    const groupIds = new Set(GROUP_MATCH_IDS);
    const groupCount = new Map<string, number>();
    for (const doc of predsSnap.docs) {
      const match_id = doc.data().match_id as number;
      const player_id = doc.data().player_id as string;
      if (!groupIds.has(match_id)) continue;
      groupCount.set(player_id, (groupCount.get(player_id) ?? 0) + 1);
    }
    const hasKo = new Set(
      koSnap.docs.map((d) => d.data().player_id as string),
    );

    const players = playersSnap.docs.map((doc) => {
      const row = { id: doc.id, ...doc.data() } as PlayerRow;
      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        groupPicksCount: groupCount.get(row.id) ?? 0,
        hasKnockoutPick: hasKo.has(row.id),
      };
    });

    return { data: players, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchPlayers(): Promise<
  DbResult<ReturnType<typeof mapPlayer>[]>
> {
  try {
    const snap = await playersCol().orderBy("name").get();
    return {
      data: snap.docs.map((doc) =>
        mapPlayer({ id: doc.id, ...doc.data() } as PlayerRow),
      ),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function renamePlayer(
  playerId: string,
  name: string,
): Promise<DbResult<ReturnType<typeof mapPlayer>>> {
  try {
    const ref = playersCol().doc(playerId);
    await ref.update({ name: name.trim() });
    const doc = await ref.get();
    return {
      data: mapPlayer({ id: doc.id, ...doc.data() } as PlayerRow),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function deletePlayer(playerId: string): Promise<DbResult<true>> {
  try {
    const db = getFirestoreServer();
    const batch = db.batch();

    batch.delete(playersCol().doc(playerId));
    batch.delete(db.collection("knockout_picks").doc(playerId));

    const preds = await db
      .collection("predictions")
      .where("player_id", "==", playerId)
      .get();
    for (const doc of preds.docs) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchPlayerProgress(playerId: string): Promise<
  DbResult<{
    groupPicksCount: number;
    groupTotal: number;
    knockoutFilled: number;
    knockoutTotal: number;
  }>
> {
  try {
    const db = getFirestoreServer();
    const groupIds = new Set(GROUP_MATCH_IDS);

    const [predSnap, koDoc, matchSnap] = await Promise.all([
      db.collection("predictions").where("player_id", "==", playerId).get(),
      db.collection("knockout_picks").doc(playerId).get(),
      db.collection("matches").where("stage", "==", "group").count().get(),
    ]);

    let knockoutFilled = 0;
    if (koDoc.exists) {
      const k = koDoc.data()!;
      const fields = [
        k.sf1_home,
        k.sf1_away,
        k.sf2_home,
        k.sf2_away,
        k.final_home,
        k.final_away,
        k.bronze_home,
        k.bronze_away,
        k.champion,
      ];
      knockoutFilled = fields.filter(Boolean).length;
    }

    const groupPicksCount = predSnap.docs.filter((doc) =>
      groupIds.has(doc.data().match_id as number),
    ).length;

    return {
      data: {
        groupPicksCount,
        groupTotal: matchSnap.data().count,
        knockoutFilled,
        knockoutTotal: 9,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
