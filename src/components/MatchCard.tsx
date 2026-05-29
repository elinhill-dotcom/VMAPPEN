"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCestMatchKickoff } from "@/lib/datetime";
import { isMatchLive } from "@/lib/match-live";
import { evaluatePick } from "@/lib/pick-feedback";

export type MatchView = {
  id: number;
  matchNumber: number | null;
  dayLabel: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  groupCode: string | null;
  stage: string;
  featured: boolean;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
};

type Props = {
  match: MatchView;
  predHome: string;
  predAway: string;
  locked: boolean;
  onChange: (home: string, away: string) => void;
  showResult?: boolean;
};

const STAGE_LABELS: Record<string, string> = {
  group: "Gruppspel",
};

export function MatchCard({
  match,
  predHome,
  predAway,
  locked,
  onChange,
  showResult,
}: Props) {
  const featured = match.featured;
  const [live, setLive] = useState(() => isMatchLive(match.kickoffAt));

  useEffect(() => {
    const tick = () => setLive(isMatchLive(match.kickoffAt));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [match.kickoffAt]);

  const feedback =
    showResult ? evaluatePick(predHome, predAway, match) : null;

  return (
    <article
      className={`rounded-xl border p-4 ${
        featured
          ? "border-[var(--featured-border)] bg-[var(--featured)] ring-1 ring-[var(--featured-border)]/40"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <time>{formatCestMatchKickoff(match.kickoffAt)}</time>
        {match.groupCode && (
          <span className="rounded bg-black/30 px-2 py-0.5">
            Grupp {match.groupCode}
          </span>
        )}
        <span>{STAGE_LABELS[match.stage] ?? match.stage}</span>
        {featured && (
          <span className="rounded bg-[var(--accent)] px-2 py-0.5 font-bold text-[var(--accent-foreground)] border border-[#0a1420] shadow-[2px_2px_0_#0a1420]">
            Sverigematch
          </span>
        )}
        {live && <span className="live-badge">LIVE</span>}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="text-right font-semibold">{match.homeTeam}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            value={predHome}
            disabled={locked}
            onChange={(e) => onChange(e.target.value, predAway)}
            className="w-12 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-center"
            aria-label={`Mål ${match.homeTeam}`}
          />
          <span className="text-[var(--muted)]">–</span>
          <input
            type="number"
            min={0}
            max={20}
            value={predAway}
            disabled={locked}
            onChange={(e) => onChange(predHome, e.target.value)}
            className="w-12 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-center"
            aria-label={`Mål ${match.awayTeam}`}
          />
        </div>
        <span className="font-semibold">{match.awayTeam}</span>
      </div>

      {feedback && (
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3 text-sm space-y-2">
          <p className="text-center text-[var(--muted)]">
            Slutresultat:{" "}
            <strong className="text-white">{feedback.actualLabel}</strong> ·{" "}
            {feedback.winnerLabel}
          </p>
          {feedback.hasPick ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-[var(--muted)]">
                Ditt tips: {feedback.pickLabel}
              </span>
              {feedback.exact ? (
                <span className="pick-badge pick-badge--exact">Exakt +3</span>
              ) : feedback.outcomeCorrect ? (
                <span className="pick-badge pick-badge--ok">Rätt utgång +1</span>
              ) : (
                <span className="pick-badge pick-badge--wrong">Fel</span>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-[var(--muted)]">
              Inget tips sparat för den här matchen
            </p>
          )}
        </div>
      )}

      {live && (
        <Link
          href={`/live/${match.id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-[var(--accent-foreground)] hover:opacity-90"
        >
          Livechatt — chatta med familjen
        </Link>
      )}
    </article>
  );
}
