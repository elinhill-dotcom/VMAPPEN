import type { MatchBettingStats, OutcomePercents } from "@/lib/betting-stats-types";

export function OutcomeBar({
  homeTeam,
  awayTeam,
  outcomes,
}: {
  homeTeam: string;
  awayTeam: string;
  outcomes: OutcomePercents;
}) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full border border-[var(--border)]">
        {outcomes.home > 0 && (
          <div
            className="bg-[var(--sweden-blue-bright)]"
            style={{ width: `${outcomes.home}%` }}
            title={`${homeTeam} vinner: ${outcomes.home}%`}
          />
        )}
        {outcomes.draw > 0 && (
          <div
            className="bg-[var(--muted)]"
            style={{ width: `${outcomes.draw}%` }}
            title={`Oavgjort: ${outcomes.draw}%`}
          />
        )}
        {outcomes.away > 0 && (
          <div
            className="bg-[var(--accent)]"
            style={{ width: `${outcomes.away}%` }}
            title={`${awayTeam} vinner: ${outcomes.away}%`}
          />
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--muted)]">
        <span>
          {homeTeam} {outcomes.home}%
        </span>
        <span>Oavgjort {outcomes.draw}%</span>
        <span>
          {awayTeam} {outcomes.away}%
        </span>
      </div>
    </div>
  );
}

type Props = {
  stats: MatchBettingStats;
  compact?: boolean;
};

export function MatchBettingSummary({ stats, compact = false }: Props) {
  if (stats.tipCount === 0) return null;

  const top = stats.topScores[0];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--muted)]">
        Familjens tips ({stats.tipCount})
      </p>
      <OutcomeBar
        homeTeam={stats.homeTeam}
        awayTeam={stats.awayTeam}
        outcomes={stats.outcomes}
      />
      {top && (
        <p className="text-xs text-[var(--muted)]">
          Vanligast:{" "}
          <strong className="text-white">{top.label}</strong> ({top.percent}%)
          {!compact && (
            <>
              {" "}
              · Snitt {stats.avgHome}–{stats.avgAway}
            </>
          )}
        </p>
      )}
    </div>
  );
}
