import { JAR_CONTRIBUTION_EUR } from "@/lib/matches-data";
import { scoreKnockoutPick } from "@/lib/knockout-scoring";
import { pointsForPrediction } from "@/lib/scoring";
import {
  mapKnockoutAnswer,
  mapKnockoutPick,
  mapMatch,
  mapPrediction,
} from "@/lib/firestore-mappers";
import type {
  KnockoutAnswerRow,
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
} from "@/lib/firestore-types";
import { getAdminFirestore, toErrorMessage, type DbResult } from "@/lib/firestore";

export type LeaderboardEntry = {
  playerId: string;
  name: string;
  points: number;
  groupPoints: number;
  knockoutPoints: number;
  exactHits: number;
  outcomeHits: number;
  groupPicksCount: number;
};

export async function computeLeaderboard(): Promise<
  DbResult<LeaderboardEntry[]>
> {
  try {
    const db = getAdminFirestore();

    const [playersSnap, predsSnap, koPicksSnap, koAnswerDoc, matchesSnap] =
      await Promise.all([
        db.collection("players").orderBy("name").get(),
        db.collection("predictions").get(),
        db.collection("knockout_picks").get(),
        db.collection("knockout_answer").doc("config").get(),
        db.collection("matches").get(),
      ]);

    const matchMap = new Map(
      matchesSnap.docs.map((doc) => [
        Number(doc.id),
        mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
      ]),
    );

    const predsByPlayer = new Map<string, ReturnType<typeof mapPrediction>[]>();
    for (const doc of predsSnap.docs) {
      const p = mapPrediction({ id: doc.id, ...doc.data() } as PredictionRow);
      const list = predsByPlayer.get(p.playerId) ?? [];
      list.push(p);
      predsByPlayer.set(p.playerId, list);
    }

    const koByPlayer = new Map<string, ReturnType<typeof mapKnockoutPick>>();
    for (const doc of koPicksSnap.docs) {
      koByPlayer.set(
        doc.id,
        mapKnockoutPick({ id: doc.id, ...doc.data() } as KnockoutPickRow),
      );
    }

    const answerRow = koAnswerDoc.exists
      ? ({ id: 1, ...koAnswerDoc.data() } as KnockoutAnswerRow)
      : null;
    const mappedAnswer = answerRow ? mapKnockoutAnswer(answerRow) : null;
    const answer =
      mappedAnswer?.set && mappedAnswer.champion ? mappedAnswer : null;

    const entries: LeaderboardEntry[] = playersSnap.docs.map((doc) => {
      const row = { id: doc.id, ...doc.data() } as PlayerRow;
      let groupPoints = 0;
      let exactHits = 0;
      let outcomeHits = 0;
      let groupPicksCount = 0;

      for (const pred of predsByPlayer.get(row.id) ?? []) {
        const m = matchMap.get(pred.matchId);
        if (!m || m.stage !== "group") continue;
        groupPicksCount += 1;
        if (!m.finished || m.homeScore === null || m.awayScore === null) {
          continue;
        }
        const pts = pointsForPrediction(
          pred.homeScore,
          pred.awayScore,
          m.homeScore,
          m.awayScore,
        );
        groupPoints += pts;
        if (pts === 3) exactHits += 1;
        else if (pts === 1) outcomeHits += 1;
      }

      let knockoutPoints = 0;
      const ko = koByPlayer.get(row.id);
      if (answer && ko) {
        knockoutPoints = scoreKnockoutPick(ko, answer);
      }

      return {
        playerId: row.id,
        name: row.name,
        points: groupPoints + knockoutPoints,
        groupPoints,
        knockoutPoints,
        exactHits,
        outcomeHits,
        groupPicksCount,
      };
    });

    entries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      return a.name.localeCompare(b.name, "sv");
    });

    return { data: entries, error: null };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}

export async function getLeaderboardPayload(): Promise<
  DbResult<{
    entries: LeaderboardEntry[];
    playerCount: number;
    jarTotalEur: number;
    jarContributionEur: number;
  }>
> {
  const res = await computeLeaderboard();
  if (res.error || !res.data) return { data: null, error: res.error ?? "Misslyckades" };
  const playerCount = res.data.length;
  return {
    data: {
      entries: res.data,
      playerCount,
      jarTotalEur: playerCount * JAR_CONTRIBUTION_EUR,
      jarContributionEur: JAR_CONTRIBUTION_EUR,
    },
    error: null,
  };
}
