import { mapKnockoutAnswer, mapKnockoutPick, mapMatch } from "@/lib/firestore-mappers";
import type {
  KnockoutAnswerRow,
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
} from "@/lib/firestore-types";
import { getAdminFirestore, toErrorMessage, type DbResult } from "@/lib/firestore";
import {
  knockoutAnswerHasProgress,
  knockoutAnswerIsComplete,
  knockoutPointsStatus,
} from "@/lib/knockout-potential";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import type { KnockoutPickData } from "@/lib/knockout-scoring";
import { toSwedishTeam } from "@/lib/team-names";
import type { MatchView } from "@/components/MatchCard";

function normalizePick(form: KnockoutFormState): KnockoutPickData {
  return {
    sf1Home: form.sf1Home || null,
    sf1Away: form.sf1Away || null,
    sf2Home: form.sf2Home || null,
    sf2Away: form.sf2Away || null,
    finalHome: form.finalHome || null,
    finalAway: form.finalAway || null,
    bronzeHome: form.bronzeHome || null,
    bronzeAway: form.bronzeAway || null,
    champion: form.champion || null,
  };
}

export type KnockoutPickView = {
  playerId: string;
  name: string;
  sf1Home: string | null;
  sf1Away: string | null;
  sf2Home: string | null;
  sf2Away: string | null;
  finalHome: string | null;
  finalAway: string | null;
  bronzeHome: string | null;
  bronzeAway: string | null;
  champion: string | null;
  pickCount: number;
  knockoutEarned: number;
  knockoutRemaining: number;
  knockoutMaxPossible: number;
};

export type KnockoutOverview = {
  matches: MatchView[];
  answer: KnockoutPickData | null;
  /** Minst en slutspelskategori publicerad — poäng räknas stegvis. */
  answerScoringStarted: boolean;
  /** Mästare satt — turneringen är avgjord. */
  answerComplete: boolean;
  picks: KnockoutPickView[];
};

function svTeam(code: string | null | undefined): string | null {
  if (!code) return null;
  return toSwedishTeam(code);
}

function toPickView(
  playerId: string,
  name: string,
  pick: KnockoutPickData,
  answer: KnockoutPickData | null,
): KnockoutPickView {
  const status = knockoutPointsStatus(pick, answer);
  const pickCount = [
    pick.sf1Home,
    pick.sf1Away,
    pick.sf2Home,
    pick.sf2Away,
    pick.finalHome,
    pick.finalAway,
    pick.champion,
    pick.bronzeHome,
    pick.bronzeAway,
  ].filter(Boolean).length;

  return {
    playerId,
    name,
    sf1Home: svTeam(pick.sf1Home),
    sf1Away: svTeam(pick.sf1Away),
    sf2Home: svTeam(pick.sf2Home),
    sf2Away: svTeam(pick.sf2Away),
    finalHome: svTeam(pick.finalHome),
    finalAway: svTeam(pick.finalAway),
    bronzeHome: svTeam(pick.bronzeHome),
    bronzeAway: svTeam(pick.bronzeAway),
    champion: svTeam(pick.champion),
    pickCount,
    knockoutEarned: status.earned,
    knockoutRemaining: status.remaining,
    knockoutMaxPossible: status.maxPossible,
  };
}

export async function computeKnockoutOverview(): Promise<
  DbResult<KnockoutOverview>
> {
  try {
    const db = getAdminFirestore();
    const knockoutStages = ["r16", "r8", "qf", "sf", "bronze", "final"];

    const [playersSnap, koPicksSnap, koAnswerDoc, matchesSnap] =
      await Promise.all([
        db.collection("players").orderBy("name").get(),
        db.collection("knockout_picks").get(),
        db.collection("knockout_answer").doc("config").get(),
        db
          .collection("matches")
          .where("stage", "in", knockoutStages)
          .get(),
      ]);

    const matches = matchesSnap.docs
      .map((doc) =>
        mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
      )
      .sort((a, b) => a.id - b.id);

    const answerRow = koAnswerDoc.exists
      ? ({ id: 1, ...koAnswerDoc.data() } as KnockoutAnswerRow)
      : null;
    const mappedAnswer = answerRow ? mapKnockoutAnswer(answerRow) : null;
    const answer: KnockoutPickData | null = mappedAnswer
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
    const answerScoringStarted = !!(
      mappedAnswer?.set &&
      answer &&
      knockoutAnswerHasProgress(answer)
    );
    const answerComplete = !!(
      mappedAnswer?.set &&
      answer &&
      knockoutAnswerIsComplete(answer)
    );

    const koByPlayer = new Map<string, KnockoutPickData>();
    for (const doc of koPicksSnap.docs) {
      koByPlayer.set(
        doc.id,
        normalizePick(
          mapKnockoutPick({ id: doc.id, ...doc.data() } as KnockoutPickRow),
        ),
      );
    }

    const picks: KnockoutPickView[] = playersSnap.docs
      .map((doc) => {
        const row = { id: doc.id, ...doc.data() } as PlayerRow;
        const pick = koByPlayer.get(row.id);
        if (!pick) return null;
        return toPickView(
          row.id,
          row.name,
          pick,
          answerScoringStarted ? answer : null,
        );
      })
      .filter((p): p is KnockoutPickView => p !== null);

    return {
      data: { matches, answer, answerScoringStarted, answerComplete, picks },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
