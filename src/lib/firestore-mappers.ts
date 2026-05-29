import type { MatchView } from "@/components/MatchCard";
import { formatSvDayLabel } from "@/lib/datetime";
import { isFeaturedMatch } from "@/lib/teams";
import { toSwedishTeam } from "@/lib/team-names";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import type {
  ChatMessageRow,
  KnockoutAnswerRow,
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
  WallCommentRow,
} from "@/lib/firestore-types";

function toIsoString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

export function mapPlayer(row: PlayerRow) {
  return {
    id: row.id,
    name: row.name,
    createdAt: toIsoString(row.created_at),
  };
}

export function mapMatch(row: MatchRow): MatchView {
  const kickoffAt = toIsoString(row.kickoff_at);
  const homeEn = row.home_team;
  const awayEn = row.away_team;
  return {
    id: row.id,
    matchNumber: row.match_number,
    dayLabel: formatSvDayLabel(kickoffAt),
    kickoffAt,
    homeTeam: toSwedishTeam(homeEn),
    awayTeam: toSwedishTeam(awayEn),
    groupCode: row.group_code,
    stage: row.stage,
    featured: isFeaturedMatch(homeEn, awayEn),
    homeScore: row.home_score,
    awayScore: row.away_score,
    finished: row.finished,
  };
}

export function mapPrediction(row: PredictionRow) {
  return {
    id: row.id,
    playerId: row.player_id,
    matchId: row.match_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
  };
}

export function mapKnockoutPick(row: KnockoutPickRow): KnockoutFormState {
  return {
    sf1Home: row.sf1_home ?? "",
    sf1Away: row.sf1_away ?? "",
    sf2Home: row.sf2_home ?? "",
    sf2Away: row.sf2_away ?? "",
    finalHome: row.final_home ?? "",
    finalAway: row.final_away ?? "",
    bronzeHome: row.bronze_home ?? "",
    bronzeAway: row.bronze_away ?? "",
    champion: row.champion ?? "",
  };
}

export function knockoutPickToRow(
  playerId: string,
  form: KnockoutFormState,
): Omit<KnockoutPickRow, "id"> {
  return {
    player_id: playerId,
    sf1_home: form.sf1Home || null,
    sf1_away: form.sf1Away || null,
    sf2_home: form.sf2Home || null,
    sf2_away: form.sf2Away || null,
    final_home: form.finalHome || null,
    final_away: form.finalAway || null,
    bronze_home: form.bronzeHome || null,
    bronze_away: form.bronzeAway || null,
    champion: form.champion || null,
  };
}

export function mapKnockoutAnswer(row: KnockoutAnswerRow) {
  return {
    id: row.id,
    sf1Home: row.sf1_home,
    sf1Away: row.sf1_away,
    sf2Home: row.sf2_home,
    sf2Away: row.sf2_away,
    finalHome: row.final_home,
    finalAway: row.final_away,
    bronzeHome: row.bronze_home,
    bronzeAway: row.bronze_away,
    champion: row.champion,
    set: row.set,
  };
}

export function mapChatMessage(row: ChatMessageRow) {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: toIsoString(row.created_at),
  };
}

export function mapWallComment(row: WallCommentRow) {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: toIsoString(row.created_at),
  };
}

export function docToRow<T extends { id: string }>(
  id: string,
  data: Record<string, unknown>,
): T {
  return { id, ...data } as T;
}
