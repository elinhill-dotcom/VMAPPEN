import type { MatchView } from "@/components/MatchCard";
import { KNOCKOUT_STAGE_LABELS } from "@/lib/knockout-bracket";

const KNOCKOUT_IDS_BY_STAGE: Record<string, number[]> = {
  r16: [
    73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88,
  ],
  r8: [89, 90, 91, 92, 93, 94, 95, 96],
  qf: [97, 98, 99, 100],
  sf: [101, 102],
  bronze: [103],
  final: [104],
};

function shortTeam(name: string): string {
  if (/^(?:Winner|Vinnare|Loser|Förlorare)\s/i.test(name)) return name;
  if (name.length <= 14) return name;
  return name.replace(" och Hercegovina", "").slice(0, 14).trim();
}

/** Short "Hemma–Borta" for a known match. */
export function knockoutMatchupShort(match: MatchView): string {
  return `${shortTeam(match.homeTeam)}–${shortTeam(match.awayTeam)}`;
}

/** Friendly label for a knockout match, e.g. "16-dels 3". */
export function knockoutMatchLabel(match: MatchView): string {
  if (match.stage === "final") return KNOCKOUT_STAGE_LABELS.final;
  if (match.stage === "bronze") return KNOCKOUT_STAGE_LABELS.bronze;

  const ids = KNOCKOUT_IDS_BY_STAGE[match.stage];
  if (!ids) return "";

  const index = ids.indexOf(match.id);
  if (index < 0) return "";

  switch (match.stage) {
    case "r16":
      return `16-dels ${index + 1}`;
    case "r8":
      return `8-dels ${index + 1}`;
    case "qf":
      return `Kvarts ${index + 1}`;
    case "sf":
      return `Semifinal ${index + 1}`;
    default:
      return "";
  }
}

export function pendingWinnerLabel(source: MatchView): string {
  return `Vinnare · ${knockoutMatchupShort(source)}`;
}

export function pendingLoserLabel(source: MatchView): string {
  return `Förlorare · ${knockoutMatchupShort(source)}`;
}
