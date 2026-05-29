import { isMatchLive } from "@/lib/match-live";
import { mapMatch } from "@/lib/firestore-mappers";
import type { MatchRow } from "@/lib/firestore-types";
import { getFirestoreServer } from "@/lib/firestore-admin";
import { toErrorMessage, type DbResult } from "@/lib/firestore-shared";

function matchesCol() {
  return getFirestoreServer().collection("matches");
}

export async function fetchMatches(
  opts?: { stage?: string },
): Promise<DbResult<ReturnType<typeof mapMatch>[]>> {
  try {
    let q = matchesCol().orderBy("kickoff_at");
    if (opts?.stage) {
      q = q.where("stage", "==", opts.stage) as typeof q;
    }
    const snap = await q.get();
    const rows = snap.docs
      .map((doc) => ({ id: Number(doc.id), ...doc.data() } as MatchRow))
      .sort((a, b) => {
        const t = a.kickoff_at.localeCompare(b.kickoff_at);
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
    const doc = await matchesCol().doc(String(matchId)).get();
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

export async function updateMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number,
  finished = true,
): Promise<DbResult<ReturnType<typeof mapMatch>>> {
  try {
    const ref = matchesCol().doc(String(matchId));
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
