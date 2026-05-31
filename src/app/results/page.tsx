"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCestMatchKickoff } from "@/lib/datetime";
import { winnerLabel } from "@/lib/pick-feedback";
import type { MatchView } from "@/components/MatchCard";
import { MatchBettingSummary } from "@/components/MatchBettingSummary";
import { useMatchBettingStatsMap } from "@/hooks/useMatchBettingStatsMap";

export default function ResultsPage() {
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [filter, setFilter] = useState<"all" | "finished" | "upcoming">("all");
  const [group, setGroup] = useState<string>("all");
  const { map: bettingStatsMap, available: statsAvailable } =
    useMatchBettingStatsMap();

  useEffect(() => {
    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []));
  }, []);

  const groups = useMemo(() => {
    const codes = new Set(
      matches.map((m) => m.groupCode).filter((g): g is string => !!g),
    );
    return [...codes].sort();
  }, [matches]);

  const shown = useMemo(() => {
    return matches.filter((m) => {
      if (group !== "all" && m.groupCode !== group) return false;
      if (filter === "finished") return m.finished;
      if (filter === "upcoming") return !m.finished;
      return true;
    });
  }, [matches, filter, group]);

  const byDay = useMemo(() => {
    const map: Record<string, MatchView[]> = {};
    for (const m of shown) {
      if (!map[m.dayLabel]) map[m.dayLabel] = [];
      map[m.dayLabel].push(m);
    }
    return Object.entries(map);
  }, [shown]);

  const finishedCount = matches.filter((m) => m.finished).length;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="burst-heading text-xl">Matchresultat</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          Alla gruppmatcher på ett ställe. Resultat läggs in efter varje match —
          kolla <strong className="text-white">Mina tips</strong> för att se om
          du hade rätt.
        </p>
        <p className="text-sm text-[var(--accent)] mt-1">
          {finishedCount} / {matches.length} matcher spelade
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Alla"],
            ["finished", "Spelade"],
            ["upcoming", "Ej spelade"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === key
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
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

      {byDay.length === 0 ? (
        <p className="text-[var(--muted)]">Inga matcher matchar filtret.</p>
      ) : (
        byDay.map(([day, dayMatches]) => (
          <section key={day}>
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">
              {day}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--card)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3 text-center">Resultat</th>
                    <th className="px-4 py-3">Utfall</th>
                    <th className="px-4 py-3 hidden sm:table-cell">Grupp</th>
                  </tr>
                </thead>
                <tbody>
                  {dayMatches.map((m) => {
                    const betting = bettingStatsMap.get(m.id);
                    return (
                      <tr
                        key={m.id}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {m.homeTeam} – {m.awayTeam}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {formatCestMatchKickoff(m.kickoffAt)}
                          </p>
                          {statsAvailable && betting && (
                            <div className="mt-3 max-w-md">
                              <MatchBettingSummary stats={betting} compact />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-[var(--accent)]">
                          {m.finished &&
                          m.homeScore !== null &&
                          m.awayScore !== null
                            ? `${m.homeScore}–${m.awayScore}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {m.finished &&
                          m.homeScore !== null &&
                          m.awayScore !== null
                            ? winnerLabel(
                                m.homeScore,
                                m.awayScore,
                                m.homeTeam,
                                m.awayTeam,
                              )
                            : "Väntar"}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-[var(--muted)]">
                          {m.groupCode ? `Grupp ${m.groupCode}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
