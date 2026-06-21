import type { MatchBettingStats, OutcomePercents } from "@/lib/betting-stats-types";
import { evaluatePick } from "@/lib/pick-feedback";

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

type UserPickProps = {
  home: string;
  away: string;
  label?: string;
};

type MatchForPick = {
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: string;
  awayTeam: string;
};

type Props = {
  stats: MatchBettingStats;
  compact?: boolean;
  userPick?: UserPickProps | null;
  match?: MatchForPick;
  onFamilyTipsClick?: () => void;
  familyTipsOpen?: boolean;
  hideFamilyStats?: boolean;
};

export function MatchBettingSummary({
  stats,
  compact = false,
  userPick,
  match,
  onFamilyTipsClick,
  familyTipsOpen = false,
  hideFamilyStats = false,
}: Props) {
  if (stats.tipCount === 0 && !userPick) return null;

  const top = stats.topScores[0];
  const pickLabel = userPick?.label ?? "Ditt tips";
  const hasUserPick = !!userPick?.home && userPick.home !== "" && !!userPick?.away && userPick.away !== "";
  const feedback =
    userPick && match
      ? evaluatePick(userPick.home, userPick.away, match)
      : null;

  return (
    <div className="space-y-2">
      {userPick && (
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg)]/50 px-2.5 py-2">
          <p className="text-xs font-semibold text-[var(--accent)]">
            {pickLabel}
          </p>
          {hasUserPick ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">
                {userPick.home}–{userPick.away}
              </span>
              {feedback?.hasPick && (
                <>
                  {feedback.exact ? (
                    <span className="pick-badge pick-badge--exact">Exakt +3</span>
                  ) : feedback.outcomeCorrect ? (
                    <span className="pick-badge pick-badge--ok">Rätt utgång +1</span>
                  ) : (
                    <span className="pick-badge pick-badge--wrong">Fel</span>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Inget tips sparat
            </p>
          )}
        </div>
      )}

      {stats.tipCount > 0 && (
        <>
      {onFamilyTipsClick ? (
        <button
          type="button"
          onClick={onFamilyTipsClick}
          className="text-xs font-semibold text-[var(--accent)] hover:underline text-left"
          aria-expanded={familyTipsOpen}
        >
          Familjens tips ({stats.tipCount})
          {familyTipsOpen ? " ↑" : " ↓"}
        </button>
      ) : (
        <p className="text-xs font-semibold text-[var(--muted)]">
          Familjens tips ({stats.tipCount})
        </p>
      )}
      {!hideFamilyStats && (
        <>
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
        </>
      )}
        </>
      )}
    </div>
  );
}
