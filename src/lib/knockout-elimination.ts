import type { MatchView } from "@/components/MatchCard";
import { resolveBracketTeam } from "@/lib/knockout-resolve";
import { KNOCKOUT_POINTS } from "@/lib/knockout-scoring";
import { toEnglishTeam } from "@/lib/team-names";

const STAGES_BEFORE_SEMI = ["r16", "r8", "qf"] as const;
const STAGES_BEFORE_FINAL = ["r16", "r8", "qf", "sf"] as const;
const ALL_KNOCKOUT_STAGES = [
  "r16",
  "r8",
  "qf",
  "sf",
  "bronze",
  "final",
] as const;

function loserEn(match: MatchView): string | null {
  if (
    !match.finished ||
    match.homeScore === null ||
    match.awayScore === null ||
    match.homeScore === match.awayScore
  ) {
    return null;
  }
  const loser =
    match.homeScore > match.awayScore ? match.awayTeam : match.homeTeam;
  return toEnglishTeam(loser);
}

function winnerEn(match: MatchView): string | null {
  if (
    !match.finished ||
    match.homeScore === null ||
    match.awayScore === null ||
    match.homeScore === match.awayScore
  ) {
    return null;
  }
  const winner =
    match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
  return toEnglishTeam(winner);
}

function resolvedTeamEn(
  label: string,
  matches: MatchView[],
): string | null {
  const { name, pending } = resolveBracketTeam(label, matches);
  if (pending) return null;
  return toEnglishTeam(name);
}

function matchById(matches: MatchView[], id: number): MatchView | undefined {
  return matches.find((m) => m.id === id);
}

function resolvedParticipants(
  match: MatchView | undefined,
  matches: MatchView[],
): string[] {
  if (!match) return [];
  const home = resolvedTeamEn(match.homeTeam, matches);
  const away = resolvedTeamEn(match.awayTeam, matches);
  return [home, away].filter((t): t is string => !!t);
}

function hasLostInStages(
  teamEn: string,
  stages: readonly string[],
  matches: MatchView[],
): boolean {
  for (const match of matches) {
    if (!stages.includes(match.stage) || !match.finished) continue;
    const loser = loserEn(match);
    if (loser === teamEn) return true;
  }
  return false;
}

/** Can this picked team still earn points in the category given played knockout results? */
export function canTeamStillEarnCategory(
  team: string,
  category: keyof typeof KNOCKOUT_POINTS,
  matches: MatchView[],
): boolean {
  const teamEn = toEnglishTeam(team);

  switch (category) {
    case "semifinalist": {
      if (hasLostInStages(teamEn, STAGES_BEFORE_SEMI, matches)) return false;
      const semiTeams = [
        ...resolvedParticipants(matchById(matches, 101), matches),
        ...resolvedParticipants(matchById(matches, 102), matches),
      ];
      if (semiTeams.length === 4 && !semiTeams.includes(teamEn)) return false;
      return true;
    }
    case "finalist": {
      if (hasLostInStages(teamEn, STAGES_BEFORE_FINAL, matches)) return false;
      const finalTeams = resolvedParticipants(matchById(matches, 104), matches);
      if (finalTeams.length === 2 && !finalTeams.includes(teamEn)) return false;
      return true;
    }
    case "champion": {
      return !hasLostInStages(teamEn, ALL_KNOCKOUT_STAGES, matches);
    }
    case "bronzeTeam": {
      if (hasLostInStages(teamEn, STAGES_BEFORE_SEMI, matches)) return false;

      for (const sfId of [101, 102] as const) {
        const sf = matchById(matches, sfId);
        if (sf?.finished && winnerEn(sf) === teamEn) return false;
      }

      const final = matchById(matches, 104);
      if (final?.finished && loserEn(final) === teamEn) return false;

      const bronzeTeams = resolvedParticipants(matchById(matches, 103), matches);
      if (bronzeTeams.length === 2 && !bronzeTeams.includes(teamEn)) {
        return false;
      }

      if (hasLostInStages(teamEn, ["bronze"], matches)) return false;
      return true;
    }
  }
}
