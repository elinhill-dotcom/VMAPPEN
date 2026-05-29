import { readFileSync } from "fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";
import { isMatchLive, getChatWindow } from "@/lib/match-live";
import {
  knockoutPickToRow,
  mapChatMessage,
  mapKnockoutAnswer,
  mapKnockoutPick,
  mapMatch,
  mapPlayer,
  mapPrediction,
  mapWallComment,
} from "@/lib/firestore-mappers";
import type {
  ChatMessageRow,
  KnockoutAnswerRow,
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
  WallCommentRow,
} from "@/lib/firestore-types";

export const COLLECTIONS = {
  players: "players",
  matches: "matches",
  predictions: "predictions",
  chatMessages: "chat_messages",
  chatPresence: "chat_presence",
  knockoutPicks: "knockout_picks",
  knockoutAnswer: "knockout_answer",
  wallComments: "wall_comments",
} as const;

export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type ChatMessage = ReturnType<typeof mapChatMessage>;
export type WallComment = ReturnType<typeof mapWallComment>;

function parseServiceAccountJson(raw: string): Record<string, string> | null {
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

/** Service account for firebase-admin (server only). */
export function getServiceAccount(): Record<string, string> | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim();
  if (b64) {
    try {
      return parseServiceAccountJson(
        Buffer.from(b64, "base64").toString("utf8"),
      );
    } catch {
      return null;
    }
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    return parseServiceAccountJson(json);
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath) {
    try {
      return parseServiceAccountJson(readFileSync(credPath, "utf8"));
    } catch {
      return null;
    }
  }

  return null;
}

export function isFirestoreConfigured(): boolean {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return false;
  if (typeof window !== "undefined") {
    return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  }
  return getServiceAccount() !== null;
}

export function getFirestoreConfigError(): string {
  if (typeof window !== "undefined") {
    return "Firebase är inte konfigurerad i webbläsaren.";
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return "Saknar NEXT_PUBLIC_FIREBASE_PROJECT_ID.";
  }
  if (
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
    !getServiceAccount()
  ) {
    return "FIREBASE_SERVICE_ACCOUNT_JSON är ogiltig JSON. Kontrollera .env eller Vercel.";
  }
  return "Saknar FIREBASE_SERVICE_ACCOUNT_JSON på servern. Lägg till i .env (lokalt) eller Vercel → Environment Variables, sedan starta om.";
}

export function toErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  return "Något gick fel";
}

let adminDb: Firestore | null = null;

export function getAdminFirestore(): Firestore {
  if (adminDb) return adminDb;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }

  if (getApps().length === 0) {
    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      throw new Error(getFirestoreConfigError());
    }
  }

  adminDb = getFirestore();
  return adminDb;
}

const validGroupIds = new Set(GROUP_MATCH_IDS);

function predictionId(playerId: string, matchId: number) {
  return `${playerId}_${matchId}`;
}

// —— Players (display name only, no auth) ——

export async function findOrCreatePlayerByName(
  name: string,
): Promise<DbResult<ReturnType<typeof mapPlayer>>> {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return { data: null, error: "Ange ett namn (2–80 tecken)." };
  }

  try {
    const col = getAdminFirestore().collection(COLLECTIONS.players);
    const existing = await col.where("name", "==", trimmed).limit(1).get();

    if (!existing.empty) {
      const doc = existing.docs[0]!;
      return {
        data: mapPlayer({ id: doc.id, ...doc.data() } as PlayerRow),
        error: null,
      };
    }

    const ref = col.doc();
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
    const doc = await getAdminFirestore()
      .collection(COLLECTIONS.players)
      .doc(playerId)
      .get();
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
    const snap = await getAdminFirestore()
      .collection(COLLECTIONS.players)
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
    const db = getAdminFirestore();
    const [playersSnap, predsSnap, koSnap] = await Promise.all([
      db.collection(COLLECTIONS.players).orderBy("created_at", "desc").get(),
      db.collection(COLLECTIONS.predictions).select("player_id", "match_id").get(),
      db.collection(COLLECTIONS.knockoutPicks).select("player_id").get(),
    ]);

    const groupIds = new Set(GROUP_MATCH_IDS);
    const groupCount = new Map<string, number>();
    for (const doc of predsSnap.docs) {
      const match_id = doc.data().match_id as number;
      const player_id = doc.data().player_id as string;
      if (!groupIds.has(match_id)) continue;
      groupCount.set(player_id, (groupCount.get(player_id) ?? 0) + 1);
    }
    const hasKo = new Set(koSnap.docs.map((d) => d.data().player_id as string));

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
    const snap = await getAdminFirestore()
      .collection(COLLECTIONS.players)
      .orderBy("name")
      .get();
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
    const ref = getAdminFirestore().collection(COLLECTIONS.players).doc(playerId);
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
    const db = getAdminFirestore();
    const batch = db.batch();
    batch.delete(db.collection(COLLECTIONS.players).doc(playerId));
    batch.delete(db.collection(COLLECTIONS.knockoutPicks).doc(playerId));

    const preds = await db
      .collection(COLLECTIONS.predictions)
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
    const db = getAdminFirestore();
    const groupIds = new Set(GROUP_MATCH_IDS);

    const [predSnap, koDoc, matchSnap] = await Promise.all([
      db.collection(COLLECTIONS.predictions).where("player_id", "==", playerId).get(),
      db.collection(COLLECTIONS.knockoutPicks).doc(playerId).get(),
      db.collection(COLLECTIONS.matches).where("stage", "==", "group").count().get(),
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

// —— Matches ——

export async function fetchMatches(
  opts?: { stage?: string },
): Promise<DbResult<ReturnType<typeof mapMatch>[]>> {
  try {
    // Hämta alla och filtrera stage i minnet — undviker composite index
    // (stage + kickoff_at) som ofta saknas i nya Firebase-projekt.
    const snap = await getAdminFirestore()
      .collection(COLLECTIONS.matches)
      .orderBy("kickoff_at")
      .get();
    let rows = snap.docs.map(
      (doc) => ({ id: Number(doc.id), ...doc.data() } as MatchRow),
    );
    if (opts?.stage) {
      rows = rows.filter((r) => r.stage === opts.stage);
    }
    rows.sort((a, b) => {
      const t = String(a.kickoff_at).localeCompare(String(b.kickoff_at));
      return t !== 0 ? t : a.id - b.id;
    });
    return { data: rows.map(mapMatch), error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchMatchById(
  matchId: number,
): Promise<DbResult<ReturnType<typeof mapMatch>>> {
  try {
    const doc = await getAdminFirestore()
      .collection(COLLECTIONS.matches)
      .doc(String(matchId))
      .get();
    if (!doc.exists) return { data: null, error: "Matchen hittades inte" };
    return {
      data: mapMatch({ id: matchId, ...doc.data() } as MatchRow),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function fetchLiveMatches(): Promise<
  DbResult<ReturnType<typeof mapMatch>[]>
> {
  const res = await fetchMatches();
  if (res.error || !res.data) return res;
  return {
    data: res.data.filter((m) => isMatchLive(m.kickoffAt)),
    error: null,
  };
}

/** Matches with chat open now, plus future matches (chat not yet open). */
export async function fetchChatSchedule(): Promise<
  DbResult<{
    live: ReturnType<typeof mapMatch>[];
    upcoming: ReturnType<typeof mapMatch>[];
  }>
> {
  const res = await fetchMatches();
  if (res.error || !res.data) {
    return { data: null, error: res.error ?? "Kunde inte ladda matcher" };
  }
  const now = Date.now();
  const live = res.data.filter((m) => isMatchLive(m.kickoffAt));
  const upcoming = res.data
    .filter((m) => {
      const { opensAt } = getChatWindow(m.kickoffAt);
      return now < opensAt;
    })
    .sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    );
  return { data: { live, upcoming }, error: null };
}

export async function updateMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
  finished = true,
): Promise<DbResult<ReturnType<typeof mapMatch>>> {
  try {
    const ref = getAdminFirestore()
      .collection(COLLECTIONS.matches)
      .doc(String(matchId));
    await ref.update({
      home_score: homeScore,
      away_score: awayScore,
      finished,
    });
    const doc = await ref.get();
    return {
      data: mapMatch({ id: matchId, ...doc.data() } as MatchRow),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

// —— Predictions ——

export async function loadGroupPredictions(
  playerId: string,
): Promise<DbResult<ReturnType<typeof mapPrediction>[]>> {
  try {
    const snap = await getAdminFirestore()
      .collection(COLLECTIONS.predictions)
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
    const db = getAdminFirestore();
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

      const ref = db
        .collection(COLLECTIONS.predictions)
        .doc(predictionId(playerId, item.matchId));
      batch.set(ref, {
        player_id: playerId,
        match_id: item.matchId,
        home_score: h,
        away_score: a,
      });
      writeCount += 1;
    }

    if (writeCount > 0) await batch.commit();

    const snap = await db
      .collection(COLLECTIONS.predictions)
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
    const db = getAdminFirestore();
    const batch = db.batch();

    const preds = await db
      .collection(COLLECTIONS.predictions)
      .where("player_id", "==", playerId)
      .get();
    for (const doc of preds.docs) {
      if (validGroupIds.has(doc.data().match_id as number)) {
        batch.delete(doc.ref);
      }
    }
    batch.delete(db.collection(COLLECTIONS.knockoutPicks).doc(playerId));
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
    const doc = await getAdminFirestore()
      .collection(COLLECTIONS.knockoutPicks)
      .doc(playerId)
      .get();
    if (!doc.exists) return { data: null, error: null };
    return {
      data: mapKnockoutPick({ id: doc.id, ...doc.data() } as KnockoutPickRow),
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
    const ref = getAdminFirestore().collection(COLLECTIONS.knockoutPicks).doc(playerId);
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
    const doc = await getAdminFirestore()
      .collection(COLLECTIONS.knockoutAnswer)
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
    await getAdminFirestore()
      .collection(COLLECTIONS.knockoutAnswer)
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

// —— Chat messages ——

export async function loadChatMessages(
  matchId: number,
  since?: string,
): Promise<DbResult<ChatMessage[]>> {
  try {
    let q = getAdminFirestore()
      .collection(COLLECTIONS.chatMessages)
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
    const ref = getAdminFirestore().collection(COLLECTIONS.chatMessages).doc();
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

// —— Supporter wall (extra collection) ——

export async function fetchWallComments(): Promise<DbResult<WallComment[]>> {
  try {
    const snap = await getAdminFirestore()
      .collection(COLLECTIONS.wallComments)
      .orderBy("created_at", "desc")
      .limit(200)
      .get();

    return {
      data: snap.docs.map((doc) =>
        mapWallComment({ id: doc.id, ...doc.data() } as WallCommentRow),
      ),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function createWallComment(
  name: string,
  message: string,
): Promise<DbResult<WallComment>> {
  try {
    const ref = getAdminFirestore().collection(COLLECTIONS.wallComments).doc();
    const created_at = new Date().toISOString();
    await ref.set({
      name: name.trim(),
      message: message.trim(),
      created_at,
    });
    return {
      data: mapWallComment({
        id: ref.id,
        name: name.trim(),
        message: message.trim(),
        created_at,
      }),
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function deleteWallComment(
  commentId: string,
): Promise<DbResult<true>> {
  try {
    await getAdminFirestore()
      .collection(COLLECTIONS.wallComments)
      .doc(commentId)
      .delete();
    return { data: true, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
