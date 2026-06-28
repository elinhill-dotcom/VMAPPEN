import type { MatchView } from "@/components/MatchCard";
import type { LeaderboardEntry } from "@/lib/leaderboard-types";
import {
  KNOCKOUT_POINTS,
  type KnockoutSlotBreakdown,
} from "@/lib/knockout-scoring";

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
  knockoutComplete: boolean,
  knockoutScoringStarted: boolean = knockoutComplete,
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
    knockoutComplete;
  return {
    groupFinished,
    groupTotal,
    knockoutScored: knockoutScoringStarted,
    complete,
  };
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
