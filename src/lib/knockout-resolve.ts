import type { MatchView } from "@/components/MatchCard";
import {
  pendingLoserLabel,
  pendingWinnerLabel,
} from "@/lib/knockout-labels";

function winnerName(match: MatchView): string | null {
  if (
    !match.finished ||
    match.homeScore === null ||
    match.awayScore === null ||
    match.homeScore === match.awayScore
  ) {
    return null;
  }
  return match.homeScore > match.awayScore
    ? match.homeTeam
    : match.awayTeam;
}

function loserName(match: MatchView): string | null {
  if (
    !match.finished ||
    match.homeScore === null ||
    match.awayScore === null ||
    match.homeScore === match.awayScore
  ) {
    return null;
  }
  return match.homeScore > match.awayScore
    ? match.awayTeam
    : match.homeTeam;
}

/** Resolve winner/loser placeholders to team name when the source match is finished. */
export function resolveBracketTeam(
  label: string,
  matches: MatchView[],
): { name: string; pending: boolean } {
  const win = label.match(/^(?:Winner|Vinnare)\s+M(\d+)$/i);
  if (win) {
    const id = Number(win[1]);
    const source = matches.find((m) => m.id === id);
    if (!source) return { name: "Vinnare", pending: true };
    const w = winnerName(source);
    return w
      ? { name: w, pending: false }
      : { name: pendingWinnerLabel(source), pending: true };
  }

  const lose = label.match(/^(?:Loser|Förlorare)\s+M(\d+)$/i);
  if (lose) {
    const id = Number(lose[1]);
    const source = matches.find((m) => m.id === id);
    if (!source) return { name: "Förlorare", pending: true };
    const l = loserName(source);
    return l
      ? { name: l, pending: false }
      : { name: pendingLoserLabel(source), pending: true };
  }

  return { name: label, pending: false };
}

export function teamRowScore(
  match: MatchView,
  side: "home" | "away",
): string | null {
  if (
    !match.finished ||
    match.homeScore === null ||
    match.awayScore === null
  ) {
    return null;
  }
  return side === "home" ? String(match.homeScore) : String(match.awayScore);
}

export function isWinnerRow(
  match: MatchView,
  side: "home" | "away",
): boolean {
  if (
    !match.finished ||
    match.homeScore === null ||
    match.awayScore === null
  ) {
    return false;
  }
  if (match.homeScore === match.awayScore) return false;
  return side === "home"
    ? match.homeScore > match.awayScore
    : match.awayScore > match.homeScore;
}
