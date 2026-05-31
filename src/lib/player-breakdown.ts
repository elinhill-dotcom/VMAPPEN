import type { MatchView } from "@/components/MatchCard";
import {
  breakdownKnockoutPick,
  KNOCKOUT_POINTS,
  type KnockoutSlotBreakdown,
} from "@/lib/knockout-scoring";
import {
  mapKnockoutAnswer,
  mapKnockoutPick,
  mapMatch,
  mapPlayer,
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
import { computeLeaderboard, type LeaderboardEntry } from "@/lib/leaderboard";
import { pointsForPrediction } from "@/lib/scoring";
import { toSwedishTeam } from "@/lib/team-names";

export type GroupMatchBreakdown = {
  matchId: number;
  dayLabel: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  groupCode: string | null;
  featured: boolean;
  predHome: number | null;
  predAway: number | null;
  actualHome: number | null;
  actualAway: number | null;
  finished: boolean;
  points: number;
};

export type PlayerBreakdown = {
  player: { id: string; name: string };
  rank: number;
  entry: LeaderboardEntry;
  tournamentComplete: boolean;
  groupMatches: GroupMatchBreakdown[];
  knockout: {
    scored: boolean;
    slots: KnockoutSlotBreakdown[];
    totalPoints: number;
  };
};

export type TournamentStatus = {
  groupFinished: number;
  groupTotal: number;
  knockoutScored: boolean;
  complete: boolean;
};

export function getTournamentStatus(
  matches: MatchView[],
  knockoutScored: boolean,
): TournamentStatus {
  const groupMatches = matches.filter((m) => m.stage === "group");
  const groupFinished = groupMatches.filter(
    (m) =>
      m.finished && m.homeScore !== null && m.awayScore !== null,
  ).length;
  const groupTotal = groupMatches.length;
  const complete =
    groupTotal > 0 &&
    groupFinished === groupTotal &&
    knockoutScored;
  return { groupFinished, groupTotal, knockoutScored, complete };
}

export function formatPointsSummary(entry: LeaderboardEntry): string {
  const parts: string[] = [];

  if (entry.groupPoints > 0) {
    const groupParts: string[] = [];
    if (entry.exactHits > 0) {
      groupParts.push(`${entry.exactHits} exakta resultat (+${entry.exactHits * 3})`);
    }
    if (entry.outcomeHits > 0) {
      groupParts.push(`${entry.outcomeHits} rätt utgång (+${entry.outcomeHits})`);
    }
    parts.push(
      `Gruppspel: ${entry.groupPoints} poäng${groupParts.length ? ` (${groupParts.join(", ")})` : ""}`,
    );
  } else {
    parts.push("Gruppspel: 0 poäng");
  }

  if (entry.knockoutPoints > 0) {
    parts.push(`Slutspel: ${entry.knockoutPoints} poäng`);
  } else {
    parts.push("Slutspel: 0 poäng");
  }

  return parts.join(". ") + ".";
}

export function formatKnockoutDetail(slots: KnockoutSlotBreakdown[]): string {
  const hits = slots.filter((s) => s.hit);
  if (hits.length === 0) return "Inga rätt slutspelstips.";

  const byCategory: Record<string, number> = {};
  for (const slot of hits) {
    byCategory[slot.category] = (byCategory[slot.category] ?? 0) + 1;
  }

  const labels: string[] = [];
  if (byCategory.semifinalist) {
    labels.push(
      `${byCategory.semifinalist} semifinalist${byCategory.semifinalist > 1 ? "er" : ""} (+${byCategory.semifinalist * KNOCKOUT_POINTS.semifinalist})`,
    );
  }
  if (byCategory.finalist) {
    labels.push(
      `${byCategory.finalist} finalist${byCategory.finalist > 1 ? "er" : ""} (+${byCategory.finalist * KNOCKOUT_POINTS.finalist})`,
    );
  }
  if (byCategory.champion) {
    labels.push(`rätt VM-vinnare (+${KNOCKOUT_POINTS.champion})`);
  }
  if (byCategory.bronzeTeam) {
    labels.push(
      `${byCategory.bronzeTeam} bronslag (+${byCategory.bronzeTeam * KNOCKOUT_POINTS.bronzeTeam})`,
    );
  }

  return labels.join(", ");
}

export function formatWinnerExplanation(
  name: string,
  entry: LeaderboardEntry,
  knockoutSlots: KnockoutSlotBreakdown[],
  runnerUp?: LeaderboardEntry,
): string {
  let text = `${name} vann med ${entry.points} poäng totalt. ${formatPointsSummary(entry)}`;

  if (entry.knockoutPoints > 0 && knockoutSlots.length > 0) {
    text += ` Slutspelsdetaljer: ${formatKnockoutDetail(knockoutSlots)}.`;
  }

  if (runnerUp && runnerUp.points === entry.points) {
    text += ` Delad förstaplats — ${runnerUp.name} hade också ${runnerUp.points} poäng`;
    if (entry.exactHits !== runnerUp.exactHits) {
      text += `, men ${name} hade fler exakta grupptips (${entry.exactHits} mot ${runnerUp.exactHits})`;
    }
    text += ".";
  } else if (runnerUp) {
    text += ` ${runnerUp.name} kom tvåa med ${runnerUp.points} poäng (${runnerUp.exactHits} exakta grupptips).`;
  }

  return text;
}

export async function computePlayerBreakdown(
  playerId: string,
): Promise<DbResult<PlayerBreakdown>> {
  try {
    const db = getAdminFirestore();

    const [playerDoc, predsSnap, koPickDoc, koAnswerDoc, matchesSnap, lbRes] =
      await Promise.all([
        db.collection("players").doc(playerId).get(),
        db.collection("predictions").where("player_id", "==", playerId).get(),
        db.collection("knockout_picks").doc(playerId).get(),
        db.collection("knockout_answer").doc("config").get(),
        db.collection("matches").get(),
        computeLeaderboard(),
      ]);

    if (!playerDoc.exists) {
      return { data: null, error: "Deltagaren hittades inte" };
    }

    if (lbRes.error || !lbRes.data) {
      return { data: null, error: lbRes.error ?? "Kunde inte ladda topplista" };
    }

    const rankIndex = lbRes.data.findIndex((e) => e.playerId === playerId);
    if (rankIndex < 0) {
      return { data: null, error: "Deltagaren hittades inte i topplistan" };
    }

    const player = mapPlayer({ id: playerDoc.id, ...playerDoc.data() } as PlayerRow);
    const entry = lbRes.data[rankIndex]!;

    const predMap = new Map<number, ReturnType<typeof mapPrediction>>();
    for (const doc of predsSnap.docs) {
      const p = mapPrediction({ id: doc.id, ...doc.data() } as PredictionRow);
      predMap.set(p.matchId, p);
    }

    const matches = matchesSnap.docs
      .map((doc) =>
        mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
      )
      .filter((m) => m.stage === "group")
      .sort((a, b) => a.id - b.id);

    const groupMatches: GroupMatchBreakdown[] = matches.map((m) => {
      const pred = predMap.get(m.id);
      const predHome = pred?.homeScore ?? null;
      const predAway = pred?.awayScore ?? null;
      let points = 0;
      if (
        m.finished &&
        m.homeScore !== null &&
        m.awayScore !== null &&
        predHome !== null &&
        predAway !== null
      ) {
        points = pointsForPrediction(
          predHome,
          predAway,
          m.homeScore,
          m.awayScore,
        );
      }
      return {
        matchId: m.id,
        dayLabel: m.dayLabel,
        kickoffAt: m.kickoffAt,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        groupCode: m.groupCode,
        featured: m.featured,
        predHome,
        predAway,
        actualHome: m.homeScore,
        actualAway: m.awayScore,
        finished: m.finished,
        points,
      };
    });

    const answerRow = koAnswerDoc.exists
      ? ({ id: 1, ...koAnswerDoc.data() } as KnockoutAnswerRow)
      : null;
    const mappedAnswer = answerRow ? mapKnockoutAnswer(answerRow) : null;
    const answer =
      mappedAnswer?.set && mappedAnswer.champion ? mappedAnswer : null;

    let knockout: PlayerBreakdown["knockout"] = {
      scored: false,
      slots: [],
      totalPoints: 0,
    };

    if (answer && koPickDoc.exists) {
      const pick = mapKnockoutPick({
        id: koPickDoc.id,
        ...koPickDoc.data(),
      } as KnockoutPickRow);
      const slots = breakdownKnockoutPick(pick, answer).map((s) => ({
        ...s,
        picked: s.picked ? toSwedishTeam(s.picked) : null,
      }));
      knockout = {
        scored: true,
        slots,
        totalPoints: slots.reduce((sum, s) => sum + s.points, 0),
      };
    }

    const allMatches = matchesSnap.docs.map((doc) =>
      mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
    );
    const tournament = getTournamentStatus(allMatches, !!answer);

    return {
      data: {
        player,
        rank: rankIndex + 1,
        entry,
        tournamentComplete: tournament.complete,
        groupMatches,
        knockout,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
