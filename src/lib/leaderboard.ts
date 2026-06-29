import { JAR_CONTRIBUTION_EUR } from "@/lib/matches-data";
import { breakdownKnockoutPick } from "@/lib/knockout-scoring";
import {
  knockoutAnswerHasProgress,
  knockoutAnswerIsComplete,
  scoreKnockoutPickIncremental,
} from "@/lib/knockout-potential";
import { getEffectiveKnockoutAnswer } from "@/lib/knockout-derive-answer";
import {
  formatWinnerExplanation,
  getTournamentStatus,
  type TournamentStatus,
} from "@/lib/player-breakdown-shared";
import type { LeaderboardEntry } from "@/lib/leaderboard-types";
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

export type { LeaderboardEntry } from "@/lib/leaderboard-types";

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

    const allMatches = [...matchMap.values()];
    const knockoutMatches = allMatches.filter((m) => m.stage !== "group");

    const answerRow = koAnswerDoc.exists
      ? ({ id: 1, ...koAnswerDoc.data() } as KnockoutAnswerRow)
      : null;
    const mappedAnswer = answerRow ? mapKnockoutAnswer(answerRow) : null;
    const manualAnswer = mappedAnswer
      ? {
          sf1Home: mappedAnswer.sf1Home,
          sf1Away: mappedAnswer.sf1Away,
          sf2Home: mappedAnswer.sf2Home,
          sf2Away: mappedAnswer.sf2Away,
          finalHome: mappedAnswer.finalHome,
          finalAway: mappedAnswer.finalAway,
          bronzeHome: mappedAnswer.bronzeHome,
          bronzeAway: mappedAnswer.bronzeAway,
          champion: mappedAnswer.champion,
        }
      : null;
    const effectiveAnswer = getEffectiveKnockoutAnswer(
      manualAnswer,
      !!mappedAnswer?.set,
      knockoutMatches,
    );
    const answerForScoring = knockoutAnswerHasProgress(effectiveAnswer)
      ? effectiveAnswer
      : null;

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
      if (answerForScoring && ko) {
        knockoutPoints = scoreKnockoutPickIncremental(
          {
            sf1Home: ko.sf1Home || null,
            sf1Away: ko.sf1Away || null,
            sf2Home: ko.sf2Home || null,
            sf2Away: ko.sf2Away || null,
            finalHome: ko.finalHome || null,
            finalAway: ko.finalAway || null,
            bronzeHome: ko.bronzeHome || null,
            bronzeAway: ko.bronzeAway || null,
            champion: ko.champion || null,
          },
          answerForScoring,
          knockoutMatches,
        );
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

export type WinnerSummary = {
  playerId: string;
  name: string;
  points: number;
  explanation: string;
};

export async function getLeaderboardPayload(): Promise<
  DbResult<{
    entries: LeaderboardEntry[];
    playerCount: number;
    jarTotalEur: number;
    jarContributionEur: number;
    tournament: TournamentStatus;
    winner: WinnerSummary | null;
  }>
> {
  const res = await computeLeaderboard();
  if (res.error || !res.data) return { data: null, error: res.error ?? "Misslyckades" };
  const playerCount = res.data.length;

  let tournament: TournamentStatus = {
    groupFinished: 0,
    groupTotal: 0,
    knockoutScored: false,
    complete: false,
  };
  let winner: WinnerSummary | null = null;

  try {
    const db = getAdminFirestore();
    const [matchesSnap, koAnswerDoc, koPicksSnap] = await Promise.all([
      db.collection("matches").get(),
      db.collection("knockout_answer").doc("config").get(),
      db.collection("knockout_picks").get(),
    ]);

    const matches = matchesSnap.docs.map((doc) =>
      mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
    );
    const knockoutMatches = matches.filter((m) => m.stage !== "group");

    const answerRow = koAnswerDoc.exists
      ? ({ id: 1, ...koAnswerDoc.data() } as KnockoutAnswerRow)
      : null;
    const mappedAnswer = answerRow ? mapKnockoutAnswer(answerRow) : null;
    const manualAnswer = mappedAnswer
      ? {
          sf1Home: mappedAnswer.sf1Home,
          sf1Away: mappedAnswer.sf1Away,
          sf2Home: mappedAnswer.sf2Home,
          sf2Away: mappedAnswer.sf2Away,
          finalHome: mappedAnswer.finalHome,
          finalAway: mappedAnswer.finalAway,
          bronzeHome: mappedAnswer.bronzeHome,
          bronzeAway: mappedAnswer.bronzeAway,
          champion: mappedAnswer.champion,
        }
      : null;
    const effectiveAnswer = getEffectiveKnockoutAnswer(
      manualAnswer,
      !!mappedAnswer?.set,
      knockoutMatches,
    );
    const answerComplete = knockoutAnswerIsComplete(effectiveAnswer);
    const answerForScoring = knockoutAnswerHasProgress(effectiveAnswer)
      ? effectiveAnswer
      : null;

    tournament = getTournamentStatus(
      matches,
      answerComplete,
      !!answerForScoring,
    );

    if (tournament.complete && res.data.length > 0) {
      const top = res.data[0]!;
      const runnerUp = res.data[1];
      let knockoutSlots: ReturnType<typeof breakdownKnockoutPick> = [];

      const koDoc = koPicksSnap.docs.find((d) => d.id === top.playerId);
      if (answerForScoring && koDoc) {
        const pick = mapKnockoutPick({
          id: koDoc.id,
          ...koDoc.data(),
        } as KnockoutPickRow);
        knockoutSlots = breakdownKnockoutPick(
          {
            sf1Home: pick.sf1Home || null,
            sf1Away: pick.sf1Away || null,
            sf2Home: pick.sf2Home || null,
            sf2Away: pick.sf2Away || null,
            finalHome: pick.finalHome || null,
            finalAway: pick.finalAway || null,
            bronzeHome: pick.bronzeHome || null,
            bronzeAway: pick.bronzeAway || null,
            champion: pick.champion || null,
          },
          answerForScoring,
        );
      }

      winner = {
        playerId: top.playerId,
        name: top.name,
        points: top.points,
        explanation: formatWinnerExplanation(
          top.name,
          top,
          knockoutSlots,
          runnerUp,
        ),
      };
    }
  } catch {
    // Tournament metadata is optional — leaderboard still works without it.
  }

  return {
    data: {
      entries: res.data,
      playerCount,
      jarTotalEur: playerCount * JAR_CONTRIBUTION_EUR,
      jarContributionEur: JAR_CONTRIBUTION_EUR,
      tournament,
      winner,
    },
    error: null,
  };
}
