"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MatchCard, type MatchView } from "@/components/MatchCard";
import {
  formatKnockoutDetail,
  formatPointsSummary,
  type PlayerBreakdown,
} from "@/lib/player-breakdown";
import { KNOCKOUT_POINTS } from "@/lib/knockout-scoring";

type Props = {
  breakdown: PlayerBreakdown;
  backHref?: string;
  backLabel?: string;
};

type GroupFilter = "all" | "scored" | "missed" | "pending";

function toMatchView(m: PlayerBreakdown["groupMatches"][number]): MatchView {
  return {
    id: m.matchId,
    matchNumber: null,
    dayLabel: m.dayLabel,
    kickoffAt: m.kickoffAt,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    groupCode: m.groupCode,
    stage: "group",
    featured: m.featured,
    homeScore: m.actualHome,
    awayScore: m.actualAway,
    finished: m.finished,
  };
}

export function PlayerBreakdownView({
  breakdown,
  backHref = "/scoreboard",
  backLabel = "← Tillbaka till topplistan",
}: Props) {
  const { player, rank, entry, groupMatches, knockout } = breakdown;
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(
    breakdown.tournamentComplete ? "scored" : "all",
  );

  const filteredMatches = useMemo(() => {
    return groupMatches.filter((m) => {
      if (groupFilter === "scored") return m.points > 0;
      if (groupFilter === "missed") return m.finished && m.points === 0;
      if (groupFilter === "pending") return !m.finished;
      return true;
    });
  }, [groupMatches, groupFilter]);

  const byDay = useMemo(() => {
    const map: Record<string, typeof filteredMatches> = {};
    for (const m of filteredMatches) {
      if (!map[m.dayLabel]) map[m.dayLabel] = [];
      map[m.dayLabel]!.push(m);
    }
    return Object.entries(map);
  }, [filteredMatches]);

  const pointsExplanation = formatPointsSummary(entry);
  const knockoutDetail =
    knockout.scored && knockout.slots.length > 0
      ? formatKnockoutDetail(knockout.slots)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="text-sm text-[var(--muted)] hover:text-white"
        >
          {backLabel}
        </Link>
      </div>

      <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Placering #{rank}</p>
            <h2 className="burst-heading text-2xl">{player.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--muted)]">Totalt</p>
            <p className="text-3xl font-bold text-[var(--accent)]">
              {entry.points}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3">
            <p className="text-[var(--muted)]">Gruppspel</p>
            <p className="text-xl font-bold">{entry.groupPoints}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {entry.exactHits} exakta · {entry.outcomeHits} rätt utgång
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3">
            <p className="text-[var(--muted)]">Slutspel</p>
            <p className="text-xl font-bold">{entry.knockoutPoints}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {knockout.scored ? "Poäng räknade" : "Väntar på slutspelssvar"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3">
            <p className="text-[var(--muted)]">Exakta grupptips</p>
            <p className="text-xl font-bold">{entry.exactHits}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Tiebreaker vid lika poäng
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4 text-sm space-y-2">
          <p className="font-semibold">Poängförklaring</p>
          <p className="text-[var(--muted)]">{pointsExplanation}</p>
          {knockoutDetail && (
            <p className="text-[var(--muted)]">
              Slutspelsdetaljer: {knockoutDetail}
            </p>
          )}
        </div>
      </section>

      {knockout.scored && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
          <h3 className="font-semibold">Slutspelstips</h3>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg)]/50 text-left text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Val</th>
                  <th className="px-4 py-3">Tips</th>
                  <th className="px-4 py-3 text-right">Poäng</th>
                </tr>
              </thead>
              <tbody>
                {knockout.slots.map((slot) => (
                  <tr
                    key={slot.key}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {slot.label}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {slot.picked ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {slot.hit ? (
                        <span className="pick-badge pick-badge--exact">
                          +{slot.points}
                        </span>
                      ) : slot.picked ? (
                        <span className="pick-badge pick-badge--wrong">Fel</span>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-[var(--border)] bg-[var(--bg)]/50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-[var(--muted)]">
                    Totalt slutspel
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--accent)]">
                    {knockout.totalPoints}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Poäng: {KNOCKOUT_POINTS.semifinalist} per semifinalist,{" "}
            {KNOCKOUT_POINTS.finalist} per finalist, {KNOCKOUT_POINTS.champion}{" "}
            för mästare, {KNOCKOUT_POINTS.bronzeTeam} per bronslag.
          </p>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Gruppmatcher</h3>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Alla"],
                ["scored", "Med poäng"],
                ["missed", "Inga poäng"],
                ["pending", "Ej spelade"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setGroupFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  groupFilter === key
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--card)] text-[var(--muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {byDay.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">
            Inga matcher matchar filtret.
          </p>
        ) : (
          byDay.map(([day, dayMatches]) => (
            <div key={day} className="space-y-3">
              <h4 className="text-sm font-semibold text-[var(--accent)]">
                {day}
              </h4>
              <div className="grid gap-3">
                {dayMatches.map((m) => {
                  const match = toMatchView(m);
                  return (
                    <MatchCard
                      key={m.matchId}
                      match={match}
                      predHome={
                        m.predHome !== null ? String(m.predHome) : ""
                      }
                      predAway={
                        m.predAway !== null ? String(m.predAway) : ""
                      }
                      locked
                      onChange={() => {}}
                      showResult={m.finished}
                      pickLabel="Tipset"
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
