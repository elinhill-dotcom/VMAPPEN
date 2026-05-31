import type { Outcome } from "@/lib/scoring";

export type OutcomePercents = {
  home: number;
  draw: number;
  away: number;
};

export type ScoreLineStat = {
  home: number;
  away: number;
  label: string;
  count: number;
  percent: number;
};

export type MatchBettingStats = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  dayLabel: string;
  kickoffAt: string;
  groupCode: string | null;
  tipCount: number;
  outcomes: OutcomePercents;
  topScores: ScoreLineStat[];
  avgHome: number;
  avgAway: number;
  majorityOutcome: Outcome;
};

export type TeamBettingStats = {
  team: string;
  championPercent: number;
  semifinalPercent: number;
  finalPercent: number;
  groupWinPercent: number;
  groupDrawPercent: number;
  groupLossPercent: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  matchTips: number;
};

export type ParticipantBettingStats = {
  playerId: string;
  name: string;
  tipCount: number;
  consensusPercent: number;
  avgGoalsPerMatch: number;
  championPick: string | null;
};

export type KnockoutTeamStat = {
  team: string;
  count: number;
  percent: number;
};

export type BettingStats = {
  participantCount: number;
  playersWithGroupPicks: number;
  playersWithKnockoutPicks: number;
  totalGroupTips: number;
  favorites: TeamBettingStats[];
  underdogs: TeamBettingStats[];
  championPicks: KnockoutTeamStat[];
  semifinalPicks: KnockoutTeamStat[];
  participantHighlights: {
    mostConsensus: ParticipantBettingStats | null;
    mostContrarian: ParticipantBettingStats | null;
    highestScoring: ParticipantBettingStats | null;
    lowestScoring: ParticipantBettingStats | null;
  };
  matches: MatchBettingStats[];
};
