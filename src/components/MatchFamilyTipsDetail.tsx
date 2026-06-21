"use client";

import type { MatchBettingStats } from "@/lib/betting-stats-types";
import { evaluatePick } from "@/lib/pick-feedback";
import type { MatchPlayerTip } from "@/lib/match-tips";
import { OutcomeBar } from "@/components/MatchBettingSummary";

type MatchInfo = {
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: string;
  awayTeam: string;
};

type Props = {
  stats: MatchBettingStats;
  match: MatchInfo;
  tips: MatchPlayerTip[] | null;
  loading: boolean;
  error: string;
};

export function MatchFamilyTipsDetail({
  stats,
  match,
  tips,
  loading,
  error,
}: Props) {
  const top = stats.topScores[0];
  const hasResult =
    match.finished && match.homeScore !== null && match.awayScore !== null;

  return (
    <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 p-3 space-y-4">
      {loading && (
        <p className="text-xs text-[var(--muted)]">Laddar familjens tips…</p>
      )}
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

      {!loading && !error && tips && tips.length === 0 && (
        <p className="text-xs text-[var(--muted)]">Inga tips sparade.</p>
      )}

      {!loading && !error && tips && tips.length > 0 && (
        <>
          <div>
            <p className="text-xs font-semibold text-[var(--accent)] mb-2">
              Allas tips
            </p>
            <ul className="divide-y divide-[var(--border)] rounded-md border border-[var(--border)] overflow-hidden">
              {tips.map((tip) => {
                const feedback = hasResult
                  ? evaluatePick(
                      String(tip.homeScore),
                      String(tip.awayScore),
                      match,
                    )
                  : null;
                return (
                  <li
                    key={tip.playerId}
                    className="flex flex-wrap items-center justify-between gap-2 bg-[var(--card)]/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-white">{tip.name}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold tabular-nums">
                        {tip.homeScore}–{tip.awayScore}
                      </span>
                      {feedback?.hasPick && (
                        <>
                          {feedback.exact ? (
                            <span className="pick-badge pick-badge--exact">
                              Exakt +3
                            </span>
                          ) : feedback.outcomeCorrect ? (
                            <span className="pick-badge pick-badge--ok">
                              Rätt utgång +1
                            </span>
                          ) : (
                            <span className="pick-badge pick-badge--wrong">
                              Fel
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-2 border-t border-[var(--border)] pt-3">
            <p className="text-xs font-semibold text-[var(--muted)]">
              Familjens statistik
            </p>
            <OutcomeBar
              homeTeam={stats.homeTeam}
              awayTeam={stats.awayTeam}
              outcomes={stats.outcomes}
            />
            {top && (
              <p className="text-xs text-[var(--muted)]">
                Vanligast:{" "}
                <strong className="text-white">{top.label}</strong> ({top.percent}
                %)
              </p>
            )}
            <p className="text-xs text-[var(--muted)]">
              Snitt{" "}
              <strong className="text-white">
                {stats.avgHome}–{stats.avgAway}
              </strong>
            </p>
            {stats.topScores.length > 1 && (
              <ul className="text-xs text-[var(--muted)] space-y-1">
                {stats.topScores.map((s) => (
                  <li key={s.label}>
                    {s.label}: {s.count} st ({s.percent}%)
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
