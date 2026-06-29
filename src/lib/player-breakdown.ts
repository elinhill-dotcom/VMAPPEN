import { breakdownKnockoutPick } from "@/lib/knockout-scoring";
import {
  knockoutAnswerHasProgress,
  knockoutAnswerIsComplete,
} from "@/lib/knockout-potential";
import { getEffectiveKnockoutAnswer } from "@/lib/knockout-derive-answer";
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
import { computeLeaderboard } from "@/lib/leaderboard";
import {
  getTournamentStatus,
  type GroupMatchBreakdown,
  type PlayerBreakdown,
} from "@/lib/player-breakdown-shared";
import { pointsForPrediction } from "@/lib/scoring";
import { toSwedishTeam } from "@/lib/team-names";

export type {
  GroupMatchBreakdown,
  PlayerBreakdown,
  TournamentStatus,
} from "@/lib/player-breakdown-shared";
export {
  formatKnockoutDetail,
  formatPointsSummary,
  formatWinnerExplanation,
  getTournamentStatus,
} from "@/lib/player-breakdown-shared";

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

    const allMatches = matchesSnap.docs.map((doc) =>
      mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
    );
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
    const answerComplete = knockoutAnswerIsComplete(effectiveAnswer);
    const answerForScoring = knockoutAnswerHasProgress(effectiveAnswer)
      ? effectiveAnswer
      : null;

    let knockout: PlayerBreakdown["knockout"] = {
      scored: false,
      slots: [],
      totalPoints: 0,
    };

    if (answerForScoring && koPickDoc.exists) {
      const pick = mapKnockoutPick({
        id: koPickDoc.id,
        ...koPickDoc.data(),
      } as KnockoutPickRow);
      const slots = breakdownKnockoutPick(
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
      ).map((s) => ({
        ...s,
        picked: s.picked ? toSwedishTeam(s.picked) : null,
      }));
      knockout = {
        scored: true,
        slots,
        totalPoints: slots.reduce((sum, s) => sum + s.points, 0),
      };
    }

    const tournament = getTournamentStatus(
      allMatches,
      answerComplete,
      !!answerForScoring,
    );

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
