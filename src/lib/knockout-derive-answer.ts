import type { MatchView } from "@/components/MatchCard";
import { resolveBracketTeam } from "@/lib/knockout-resolve";
import type { KnockoutPickData } from "@/lib/knockout-scoring";
import { toEnglishTeam } from "@/lib/team-names";

function emptyAnswer(): KnockoutPickData {
  return {
    sf1Home: null,
    sf1Away: null,
    sf2Home: null,
    sf2Away: null,
    finalHome: null,
    finalAway: null,
    bronzeHome: null,
    bronzeAway: null,
    champion: null,
  };
}

function resolvedTeamEn(
  label: string,
  matches: MatchView[],
): string | null {
  const { name, pending } = resolveBracketTeam(label, matches);
  if (pending) return null;
  return toEnglishTeam(name);
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

function matchById(matches: MatchView[], id: number): MatchView | undefined {
  return matches.find((m) => m.id === id);
}

/** Build official knockout answer from finished / resolved bracket matches. */
export function deriveKnockoutAnswer(matches: MatchView[]): KnockoutPickData {
  const m101 = matchById(matches, 101);
  const m102 = matchById(matches, 102);
  const m103 = matchById(matches, 103);
  const m104 = matchById(matches, 104);

  return {
    sf1Home: m101 ? resolvedTeamEn(m101.homeTeam, matches) : null,
    sf1Away: m101 ? resolvedTeamEn(m101.awayTeam, matches) : null,
    sf2Home: m102 ? resolvedTeamEn(m102.homeTeam, matches) : null,
    sf2Away: m102 ? resolvedTeamEn(m102.awayTeam, matches) : null,
    finalHome: m104 ? resolvedTeamEn(m104.homeTeam, matches) : null,
    finalAway: m104 ? resolvedTeamEn(m104.awayTeam, matches) : null,
    bronzeHome: m103 ? resolvedTeamEn(m103.homeTeam, matches) : null,
    bronzeAway: m103 ? resolvedTeamEn(m103.awayTeam, matches) : null,
    champion: m104 ? winnerEn(m104) : null,
  };
}

/** Manual admin answer overrides auto-derived fields when set. */
export function mergeKnockoutAnswers(
  manual: KnockoutPickData | null,
  manualPublished: boolean,
  derived: KnockoutPickData,
): KnockoutPickData {
  if (!manualPublished || !manual) return derived;

  const pick = (key: keyof KnockoutPickData) =>
    manual[key] || derived[key] || null;

  return {
    sf1Home: pick("sf1Home"),
    sf1Away: pick("sf1Away"),
    sf2Home: pick("sf2Home"),
    sf2Away: pick("sf2Away"),
    finalHome: pick("finalHome"),
    finalAway: pick("finalAway"),
    bronzeHome: pick("bronzeHome"),
    bronzeAway: pick("bronzeAway"),
    champion: pick("champion"),
  };
}

export function getEffectiveKnockoutAnswer(
  manual: KnockoutPickData | null,
  manualPublished: boolean,
  matches: MatchView[],
): KnockoutPickData {
  return mergeKnockoutAnswers(
    manual,
    manualPublished,
    deriveKnockoutAnswer(matches),
  );
}

export { emptyAnswer as emptyKnockoutAnswer };
