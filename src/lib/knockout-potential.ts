import {
  KNOCKOUT_POINTS,
  type KnockoutPickData,
} from "@/lib/knockout-scoring";
import { canTeamStillEarnCategory } from "@/lib/knockout-elimination";
import type { MatchView } from "@/components/MatchCard";

const SLOT_DEFS: {
  key: keyof KnockoutPickData;
  category: keyof typeof KNOCKOUT_POINTS;
}[] = [
  { key: "sf1Home", category: "semifinalist" },
  { key: "sf1Away", category: "semifinalist" },
  { key: "sf2Home", category: "semifinalist" },
  { key: "sf2Away", category: "semifinalist" },
  { key: "finalHome", category: "finalist" },
  { key: "finalAway", category: "finalist" },
  { key: "champion", category: "champion" },
  { key: "bronzeHome", category: "bronzeTeam" },
  { key: "bronzeAway", category: "bronzeTeam" },
];

function teamsInSemis(answer: KnockoutPickData): string[] {
  return [answer.sf1Home, answer.sf1Away, answer.sf2Home, answer.sf2Away].filter(
    (t): t is string => !!t,
  );
}

function teamsInFinal(answer: KnockoutPickData): string[] {
  return [answer.finalHome, answer.finalAway].filter((t): t is string => !!t);
}

function teamsInBronze(answer: KnockoutPickData): string[] {
  return [answer.bronzeHome, answer.bronzeAway].filter((t): t is string => !!t);
}

function actualTeamsForCategory(
  answer: KnockoutPickData,
  category: keyof typeof KNOCKOUT_POINTS,
): string[] {
  switch (category) {
    case "semifinalist":
      return teamsInSemis(answer);
    case "finalist":
      return teamsInFinal(answer);
    case "champion":
      return answer.champion ? [answer.champion] : [];
    case "bronzeTeam":
      return teamsInBronze(answer);
  }
}

export const KNOCKOUT_MAX_POINTS = SLOT_DEFS.reduce(
  (sum, s) => sum + KNOCKOUT_POINTS[s.category],
  0,
);

export type KnockoutPointsStatus = {
  earned: number;
  remaining: number;
  maxPossible: number;
};

export function knockoutAnswerHasProgress(answer: KnockoutPickData): boolean {
  return (
    teamsInSemis(answer).length > 0 ||
    teamsInFinal(answer).length > 0 ||
    teamsInBronze(answer).length > 0 ||
    !!answer.champion
  );
}

export function knockoutAnswerIsComplete(answer: KnockoutPickData): boolean {
  return !!answer.champion;
}

/** Incremental slutspelspoäng — per kategori när admin publicerat svaret. */
export function scoreKnockoutPickIncremental(
  pick: KnockoutPickData,
  answer: KnockoutPickData,
  matches: MatchView[] | null = null,
): number {
  return knockoutPointsStatus(pick, answer, matches).earned;
}

/** Max points from filled slots; earned/remaining use partial official answer when available. */
export function knockoutPointsStatus(
  pick: KnockoutPickData,
  answer: KnockoutPickData | null,
  matches: MatchView[] | null = null,
): KnockoutPointsStatus {
  let maxPossible = 0;
  let earned = 0;
  let remaining = 0;

  for (const { key, category } of SLOT_DEFS) {
    const picked = pick[key];
    if (!picked) continue;

    const slotMax = KNOCKOUT_POINTS[category];
    maxPossible += slotMax;

    const actual = answer ? actualTeamsForCategory(answer, category) : [];
    if (actual.length === 0) {
      if (
        matches &&
        !canTeamStillEarnCategory(picked, category, matches)
      ) {
        continue;
      }
      remaining += slotMax;
      continue;
    }

    const hit = actual.includes(picked);
    if (hit) earned += slotMax;
  }

  return { earned, remaining, maxPossible };
}
