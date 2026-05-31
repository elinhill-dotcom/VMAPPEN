"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatCestMatchKickoff } from "@/lib/datetime";
import {
  MatchBettingSummary,
} from "@/components/MatchBettingSummary";
import { usePredictionsLocked } from "@/hooks/usePredictionsLocked";
import type {
  BettingStats,
  MatchBettingStats,
  TeamBettingStats,
} from "@/lib/betting-stats-types";

function PercentBar({
  label,
  percent,
  accent,
}: {
  label: string;
  percent: number;
  accent?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm gap-3">
        <span className="font-medium truncate">{label}</span>
        <span className={accent ? "text-[var(--accent)] font-bold" : "text-[var(--muted)]"}>
          {percent}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
        <div
          className={`h-full rounded-full ${accent ? "bg-[var(--accent)]" : "bg-[var(--sweden-blue-bright)]"}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function TeamTable({
  title,
  teams,
  variant,
}: {
  title: string;
  teams: TeamBettingStats[];
  variant: "favorites" | "underdogs";
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--muted)]">
            <tr>
              <th className="pb-2 pr-3">Lag</th>
              <th className="pb-2 pr-3 text-right">Vinst i grupp</th>
              <th className="pb-2 pr-3 text-right hidden sm:table-cell">VM-vinnare</th>
              <th className="pb-2 text-right hidden md:table-cell">Semifinal</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.team} className="border-t border-[var(--border)]">
                <td className="py-2.5 pr-3 font-medium">{t.team}</td>
                <td
                  className={`py-2.5 pr-3 text-right font-bold ${
                    variant === "favorites"
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {t.groupWinPercent}%
                </td>
                <td className="py-2.5 pr-3 text-right hidden sm:table-cell">
                  {t.championPercent > 0 ? `${t.championPercent}%` : "—"}
                </td>
                <td className="py-2.5 text-right hidden md:table-cell">
                  {t.semifinalPercent > 0 ? `${t.semifinalPercent}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MatchRow({ match }: { match: MatchBettingStats }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 hover:bg-[var(--bg)]/30 transition-colors"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold">
              {match.homeTeam} – {match.awayTeam}
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {formatCestMatchKickoff(match.kickoffAt)}
              {match.groupCode ? ` · Grupp ${match.groupCode}` : ""}
            </p>
          </div>
          <span className="text-xs text-[var(--muted)]">
            {match.tipCount} tips {open ? "▲" : "▼"}
          </span>
        </div>
        {match.tipCount > 0 ? (
          <MatchBettingSummary stats={match} />
        ) : (
          <p className="text-xs text-[var(--muted)]">Inga tips ännu</p>
        )}
      </button>

      {open && match.tipCount > 0 && (
        <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--bg)]/20">
          <p className="text-sm text-[var(--muted)]">
            Snittresultat:{" "}
            <strong className="text-white">
              {match.avgHome}–{match.avgAway}
            </strong>
          </p>
          {match.topScores.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--muted)] mb-2">
                Vanligaste resultattips
              </p>
              <div className="space-y-2">
                {match.topScores.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium">{s.label}</span>
                    <span className="text-[var(--accent)] font-bold">
                      {s.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { locked, loading: lockLoading } = usePredictionsLocked();
  const [stats, setStats] = useState<BettingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => {
    if (!lockLoading && !locked) {
      router.replace("/");
    }
  }, [lockLoading, locked, router]);

  useEffect(() => {
    if (lockLoading || !locked) return;

    fetch("/api/stats")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Kunde inte ladda statistik",
          );
        }
        return data;
      })
      .then((data) => {
        if (data) setStats(data.stats ?? null);
      })
      .catch((e) => {
        setError(
          e instanceof Error ? e.message : "Kunde inte ladda statistik",
        );
      })
      .finally(() => setLoading(false));
  }, [lockLoading, locked]);

  const groups = useMemo(() => {
    if (!stats) return [];
    const codes = new Set(
      stats.matches.map((m) => m.groupCode).filter((g): g is string => !!g),
    );
    return [...codes].sort();
  }, [stats]);

  const filteredMatches = useMemo(() => {
    if (!stats) return [];
    if (groupFilter === "all") return stats.matches;
    return stats.matches.filter((m) => m.groupCode === groupFilter);
  }, [stats, groupFilter]);

  const matchesByDay = useMemo(() => {
    const map: Record<string, MatchBettingStats[]> = {};
    for (const m of filteredMatches) {
      if (!map[m.dayLabel]) map[m.dayLabel] = [];
      map[m.dayLabel]!.push(m);
    }
    return Object.entries(map);
  }, [filteredMatches]);

  if (lockLoading || !locked) {
    return null;
  }

  if (loading) {
    return <p className="text-[var(--muted)]">Laddar statistik…</p>;
  }

  if (error || !stats) {
    return (
      <div className="space-y-4">
        <h2 className="burst-heading">Familjens statistik</h2>
        <p className="text-[var(--danger)]">{error || "Ingen data"}</p>
      </div>
    );
  }

  const { participantHighlights: ph } = stats;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="burst-heading mb-2">Familjens statistik</h2>
        <p className="text-sm text-[var(--muted)]">
          Så här tippar familjen — baserat på{" "}
          <strong className="text-white">{stats.playersWithGroupPicks}</strong>{" "}
          deltagares grupptips ({stats.totalGroupTips} tips totalt) och{" "}
          <strong className="text-white">{stats.playersWithKnockoutPicks}</strong>{" "}
          slutspelstips.
        </p>
      </section>

      {stats.championPicks.length > 0 && (
        <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--featured)] p-5 space-y-4">
          <h3 className="font-semibold">Vem tror vi vinner VM?</h3>
          <div className="space-y-3">
            {stats.championPicks.slice(0, 6).map((t, i) => (
              <PercentBar
                key={t.team}
                label={t.team}
                percent={t.percent}
                accent={i === 0}
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <TeamTable
          title="Lag vi tror bäst på"
          teams={stats.favorites}
          variant="favorites"
        />
        <TeamTable
          title="Lag vi tror sämst på i gruppspelet"
          teams={stats.underdogs}
          variant="underdogs"
        />
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="font-semibold">Tippligan — vem tippar som familjen?</h3>
        <p className="text-xs text-[var(--muted)]">
          Jämför hur mycket varje deltagares tips följer majoriteten i varje
          match.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ph.mostConsensus && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4">
              <p className="text-xs text-[var(--muted)]">Mest överens med familjen</p>
              <Link
                href={`/scoreboard/${ph.mostConsensus.playerId}`}
                className="font-bold text-lg hover:text-[var(--accent)]"
              >
                {ph.mostConsensus.name}
              </Link>
              <p className="text-sm text-[var(--accent)] mt-1">
                {ph.mostConsensus.consensusPercent}% samma utgång som majoriteten
              </p>
            </div>
          )}
          {ph.mostContrarian &&
            ph.mostContrarian.playerId !== ph.mostConsensus?.playerId && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                <p className="text-xs text-[var(--muted)]">Mest egna vägar</p>
                <Link
                  href={`/scoreboard/${ph.mostContrarian.playerId}`}
                  className="font-bold text-lg hover:text-[var(--accent)]"
                >
                  {ph.mostContrarian.name}
                </Link>
                <p className="text-sm text-[var(--muted)] mt-1">
                  {ph.mostContrarian.consensusPercent}% samma utgång som majoriteten
                </p>
              </div>
            )}
          {ph.highestScoring && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4">
              <p className="text-xs text-[var(--muted)]">Mest målrika tips</p>
              <Link
                href={`/scoreboard/${ph.highestScoring.playerId}`}
                className="font-bold text-lg hover:text-[var(--accent)]"
              >
                {ph.highestScoring.name}
              </Link>
              <p className="text-sm text-[var(--muted)] mt-1">
                Snitt {ph.highestScoring.avgGoalsPerMatch} mål per match
              </p>
            </div>
          )}
          {ph.lowestScoring &&
            ph.lowestScoring.playerId !== ph.highestScoring?.playerId && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4">
                <p className="text-xs text-[var(--muted)]">Mest försiktiga tips</p>
                <Link
                  href={`/scoreboard/${ph.lowestScoring.playerId}`}
                  className="font-bold text-lg hover:text-[var(--accent)]"
                >
                  {ph.lowestScoring.name}
                </Link>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Snitt {ph.lowestScoring.avgGoalsPerMatch} mål per match
                </p>
              </div>
            )}
        </div>
      </section>

      {stats.semifinalPicks.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
          <h3 className="font-semibold">Vanligaste semifinalisttips</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.semifinalPicks.slice(0, 8).map((t) => (
              <PercentBar key={t.team} label={t.team} percent={t.percent} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Per match</h3>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm"
          >
            <option value="all">Alla grupper</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                Grupp {g}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Klicka på en match för vanligaste resultattips och snittresultat.
        </p>

        {matchesByDay.map(([day, dayMatches]) => (
          <div key={day} className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--accent)]">{day}</h4>
            <div className="grid gap-3">
              {dayMatches.map((m) => (
                <MatchRow key={m.matchId} match={m} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
