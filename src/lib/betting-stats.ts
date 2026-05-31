import { mapKnockoutPick, mapMatch, mapPrediction } from "@/lib/firestore-mappers";
import type {
  KnockoutPickRow,
  MatchRow,
  PlayerRow,
  PredictionRow,
} from "@/lib/firestore-types";
import { getAdminFirestore, toErrorMessage, type DbResult } from "@/lib/firestore";
import { getOutcome, type Outcome } from "@/lib/scoring";
import { toSwedishTeam } from "@/lib/team-names";
import { ALL_TEAMS } from "@/lib/teams";

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

type TeamAccumulator = {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  matchTips: number;
  semiPicks: number;
  finalPicks: number;
  championPicks: number;
};

function pct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function outcomePercents(
  counts: Record<Outcome, number>,
  total: number,
): OutcomePercents {
  return {
    home: pct(counts.home, total),
    draw: pct(counts.draw, total),
    away: pct(counts.away, total),
  };
}

function majorityOutcome(counts: Record<Outcome, number>): Outcome {
  const entries = Object.entries(counts) as [Outcome, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "home";
}

function initTeamStats(): Map<string, TeamAccumulator> {
  const map = new Map<string, TeamAccumulator>();
  for (const team of ALL_TEAMS) {
    map.set(team, {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      matchTips: 0,
      semiPicks: 0,
      finalPicks: 0,
      championPicks: 0,
    });
  }
  return map;
}

function toTeamBettingStats(
  teamEn: string,
  data: TeamAccumulator,
  knockoutPlayers: number,
): TeamBettingStats {
  const matchTips = data.matchTips;
  return {
    team: toSwedishTeam(teamEn),
    championPercent: pct(data.championPicks, knockoutPlayers),
    semifinalPercent: pct(data.semiPicks, knockoutPlayers),
    finalPercent: pct(data.finalPicks, knockoutPlayers),
    groupWinPercent: pct(data.wins, matchTips),
    groupDrawPercent: pct(data.draws, matchTips),
    groupLossPercent: pct(data.losses, matchTips),
    avgGoalsFor:
      matchTips > 0
        ? Math.round((data.goalsFor / matchTips) * 100) / 100
        : 0,
    avgGoalsAgainst:
      matchTips > 0
        ? Math.round((data.goalsAgainst / matchTips) * 100) / 100
        : 0,
    matchTips,
  };
}

function toKnockoutTeamStats(
  counts: Map<string, number>,
  total: number,
): KnockoutTeamStat[] {
  return [...counts.entries()]
    .map(([teamEn, count]) => ({
      team: toSwedishTeam(teamEn),
      count,
      percent: pct(count, total),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function computeBettingStats(): Promise<DbResult<BettingStats>> {
  try {
    const db = getAdminFirestore();

    const [playersSnap, predsSnap, koPicksSnap, matchesSnap] = await Promise.all([
      db.collection("players").orderBy("name").get(),
      db.collection("predictions").get(),
      db.collection("knockout_picks").get(),
      db.collection("matches").where("stage", "==", "group").get(),
    ]);

    const players = playersSnap.docs.map((doc) => ({
      id: doc.id,
      name: (doc.data() as PlayerRow).name,
    }));

    const matchRows = matchesSnap.docs.map((doc) => ({
      id: Number(doc.id),
      row: doc.data() as MatchRow,
      view: mapMatch({ id: Number(doc.id), ...doc.data() } as MatchRow),
    }));

    const matches = matchRows.map((m) => m.view).sort((a, b) => a.id - b.id);
    const matchMap = new Map(matchRows.map((m) => [m.id, m]));
    const matchEnTeams = new Map(
      matchRows.map((m) => [m.id, { home: m.row.home_team, away: m.row.away_team }]),
    );

    const predsByMatch = new Map<
      number,
      { homeScore: number; awayScore: number; playerId: string }[]
    >();
    const predsByPlayer = new Map<
      string,
      { matchId: number; homeScore: number; awayScore: number }[]
    >();
    const playersWithGroupPicks = new Set<string>();

    for (const doc of predsSnap.docs) {
      const row = doc.data() as PredictionRow;
      if (!matchMap.has(row.match_id)) continue;
      const pred = mapPrediction({ ...row, id: doc.id });
      playersWithGroupPicks.add(pred.playerId);

      const list = predsByMatch.get(pred.matchId) ?? [];
      list.push({
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
        playerId: pred.playerId,
      });
      predsByMatch.set(pred.matchId, list);

      const playerList = predsByPlayer.get(pred.playerId) ?? [];
      playerList.push({
        matchId: pred.matchId,
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
      });
      predsByPlayer.set(pred.playerId, playerList);
    }

    const teamStats = initTeamStats();
    let totalGroupTips = 0;

    const matchStats: MatchBettingStats[] = matches.map((m) => {
      const tips = predsByMatch.get(m.id) ?? [];
      totalGroupTips += tips.length;

      const outcomeCounts: Record<Outcome, number> = {
        home: 0,
        draw: 0,
        away: 0,
      };
      const scoreCounts = new Map<
        string,
        { home: number; away: number; count: number }
      >();
      let sumHome = 0;
      let sumAway = 0;

      const enTeams = matchEnTeams.get(m.id);

      for (const tip of tips) {
        const outcome = getOutcome(tip.homeScore, tip.awayScore);
        outcomeCounts[outcome] += 1;
        sumHome += tip.homeScore;
        sumAway += tip.awayScore;

        const key = `${tip.homeScore}-${tip.awayScore}`;
        const existing = scoreCounts.get(key);
        if (existing) existing.count += 1;
        else
          scoreCounts.set(key, {
            home: tip.homeScore,
            away: tip.awayScore,
            count: 1,
          });

        if (enTeams) {
          const homeData = teamStats.get(enTeams.home)!;
          const awayData = teamStats.get(enTeams.away)!;
          homeData.matchTips += 1;
          awayData.matchTips += 1;
          homeData.goalsFor += tip.homeScore;
          homeData.goalsAgainst += tip.awayScore;
          awayData.goalsFor += tip.awayScore;
          awayData.goalsAgainst += tip.homeScore;

          if (outcome === "home") {
            homeData.wins += 1;
            awayData.losses += 1;
          } else if (outcome === "away") {
            homeData.losses += 1;
            awayData.wins += 1;
          } else {
            homeData.draws += 1;
            awayData.draws += 1;
          }
        }
      }

      const tipCount = tips.length;
      const topScores = [...scoreCounts.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((s) => ({
          home: s.home,
          away: s.away,
          label: `${s.home}–${s.away}`,
          count: s.count,
          percent: pct(s.count, tipCount),
        }));

      return {
        matchId: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        dayLabel: m.dayLabel,
        kickoffAt: m.kickoffAt,
        groupCode: m.groupCode,
        tipCount,
        outcomes: outcomePercents(outcomeCounts, tipCount),
        topScores,
        avgHome: tipCount > 0 ? Math.round((sumHome / tipCount) * 10) / 10 : 0,
        avgAway: tipCount > 0 ? Math.round((sumAway / tipCount) * 10) / 10 : 0,
        majorityOutcome: majorityOutcome(outcomeCounts),
      };
    });

    const majorityByMatch = new Map(
      matchStats.map((ms) => [ms.matchId, ms.majorityOutcome]),
    );

    const koByPlayer = new Map<string, ReturnType<typeof mapKnockoutPick>>();
    for (const doc of koPicksSnap.docs) {
      koByPlayer.set(
        doc.id,
        mapKnockoutPick({ id: doc.id, ...doc.data() } as KnockoutPickRow),
      );
    }
    const playersWithKnockoutPicks = koByPlayer.size;

    for (const pick of koByPlayer.values()) {
      const semiTeams = new Set(
        [pick.sf1Home, pick.sf1Away, pick.sf2Home, pick.sf2Away].filter(
          (t): t is string => !!t,
        ),
      );
      for (const t of semiTeams) {
        if (teamStats.has(t)) teamStats.get(t)!.semiPicks += 1;
      }
      const finalTeams = new Set(
        [pick.finalHome, pick.finalAway].filter((t): t is string => !!t),
      );
      for (const t of finalTeams) {
        if (teamStats.has(t)) teamStats.get(t)!.finalPicks += 1;
      }
      if (pick.champion && teamStats.has(pick.champion)) {
        teamStats.get(pick.champion)!.championPicks += 1;
      }
    }

    const championCounts = new Map<string, number>();
    const semiCounts = new Map<string, number>();
    for (const pick of koByPlayer.values()) {
      if (pick.champion) {
        championCounts.set(
          pick.champion,
          (championCounts.get(pick.champion) ?? 0) + 1,
        );
      }
      const semiTeams = new Set(
        [pick.sf1Home, pick.sf1Away, pick.sf2Home, pick.sf2Away].filter(
          (t): t is string => !!t,
        ),
      );
      for (const t of semiTeams) {
        semiCounts.set(t, (semiCounts.get(t) ?? 0) + 1);
      }
    }

    const allTeamStats = [...teamStats.entries()]
      .map(([teamEn, data]) =>
        toTeamBettingStats(teamEn, data, playersWithKnockoutPicks),
      )
      .filter((t) => t.matchTips > 0 || t.championPercent > 0);

    const favorites = [...allTeamStats]
      .sort((a, b) => {
        const scoreA =
          a.championPercent * 3 + a.semifinalPercent * 2 + a.groupWinPercent;
        const scoreB =
          b.championPercent * 3 + b.semifinalPercent * 2 + b.groupWinPercent;
        return scoreB - scoreA;
      })
      .slice(0, 8);

    const underdogs = [...allTeamStats]
      .filter((t) => t.matchTips > 0)
      .sort((a, b) => a.groupWinPercent - b.groupWinPercent)
      .slice(0, 8);

    const participantStats: ParticipantBettingStats[] = players
      .filter((p) => predsByPlayer.has(p.id) || koByPlayer.has(p.id))
      .map((p) => {
        const tips = predsByPlayer.get(p.id) ?? [];
        let consensusMatches = 0;
        let totalGoals = 0;

        for (const tip of tips) {
          totalGoals += tip.homeScore + tip.awayScore;
          const majority = majorityByMatch.get(tip.matchId);
          if (!majority) continue;
          if (getOutcome(tip.homeScore, tip.awayScore) === majority) {
            consensusMatches += 1;
          }
        }

        const ko = koByPlayer.get(p.id);

        return {
          playerId: p.id,
          name: p.name,
          tipCount: tips.length,
          consensusPercent: pct(consensusMatches, tips.length),
          avgGoalsPerMatch:
            tips.length > 0
              ? Math.round((totalGoals / tips.length) * 10) / 10
              : 0,
          championPick: ko?.champion ? toSwedishTeam(ko.champion) : null,
        };
      });

    const byConsensus = [...participantStats]
      .filter((p) => p.tipCount > 0)
      .sort((a, b) => b.consensusPercent - a.consensusPercent);
    const byGoals = [...participantStats]
      .filter((p) => p.tipCount > 0)
      .sort((a, b) => b.avgGoalsPerMatch - a.avgGoalsPerMatch);

    return {
      data: {
        participantCount: players.length,
        playersWithGroupPicks: playersWithGroupPicks.size,
        playersWithKnockoutPicks,
        totalGroupTips,
        favorites,
        underdogs,
        championPicks: toKnockoutTeamStats(
          championCounts,
          playersWithKnockoutPicks,
        ),
        semifinalPicks: toKnockoutTeamStats(semiCounts, playersWithKnockoutPicks),
        participantHighlights: {
          mostConsensus: byConsensus[0] ?? null,
          mostContrarian: byConsensus[byConsensus.length - 1] ?? null,
          highestScoring: byGoals[0] ?? null,
          lowestScoring: byGoals[byGoals.length - 1] ?? null,
        },
        matches: matchStats,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toErrorMessage(e) };
  }
}
