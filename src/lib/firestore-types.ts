/** Firestore document shapes (snake_case). */

export type PlayerRow = {
  id: string;
  name: string;
  created_at: string;
};

export type MatchRow = {
  id: number;
  match_number: number | null;
  day_label: string;
  kickoff_at: string;
  home_team: string;
  away_team: string;
  group_code: string | null;
  stage: string;
  broadcaster: string | null;
  featured: boolean;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
};

export type PredictionRow = {
  id: string;
  player_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
};

export type KnockoutPickRow = {
  id: string;
  player_id: string;
  sf1_home: string | null;
  sf1_away: string | null;
  sf2_home: string | null;
  sf2_away: string | null;
  final_home: string | null;
  final_away: string | null;
  bronze_home: string | null;
  bronze_away: string | null;
  champion: string | null;
};

export type KnockoutAnswerRow = {
  id: number;
  sf1_home: string | null;
  sf1_away: string | null;
  sf2_home: string | null;
  sf2_away: string | null;
  final_home: string | null;
  final_away: string | null;
  bronze_home: string | null;
  bronze_away: string | null;
  champion: string | null;
  set: boolean;
};

export type ChatMessageRow = {
  id: string;
  match_id: number;
  name: string;
  message: string;
  created_at: string;
};

export type WallCommentRow = {
  id: string;
  name: string;
  message: string;
  created_at: string;
};
