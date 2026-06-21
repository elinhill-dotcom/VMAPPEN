"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { formatCestMatchKickoff } from "@/lib/datetime";
import { winnerLabel } from "@/lib/pick-feedback";
import type { MatchView } from "@/components/MatchCard";
import { ExpandableMatchBettingSummary } from "@/components/ExpandableMatchBettingSummary";
import { useMatchBettingStatsMap } from "@/hooks/useMatchBettingStatsMap";
import { usePredictionsLocked } from "@/hooks/usePredictionsLocked";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { useScrollToTodayMatchDay } from "@/hooks/useScrollToTodayMatchDay";
import { daySectionId, sortMatchDayGroups } from "@/lib/match-day-scroll";

type PredMap = Record<number, { home: string; away: string }>;

const RESULTS_SCROLL_RETRIES = [300, 750, 1500, 2500];

export default function ResultsPage() {
  const { player, hydrated } = usePlayerSession();
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [preds, setPreds] = useState<PredMap>({});
  const [filter, setFilter] = useState<"all" | "finished" | "upcoming">("all");
  const [group, setGroup] = useState<string>("all");
  const [matchesReady, setMatchesReady] = useState(false);
  const [predsReady, setPredsReady] = useState(true);
  const { loading: lockLoading, locked } = usePredictionsLocked();
  const { map: bettingStatsMap, available: statsAvailable, loading: statsLoading } =
    useMatchBettingStatsMap();

  useEffect(() => {
    setMatchesReady(false);
    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .finally(() => setMatchesReady(true));
  }, []);

  useEffect(() => {
    if (!player) {
      setPreds({});
      setPredsReady(true);
      return;
    }
    setPredsReady(false);
    fetch(`/api/predictions?playerId=${player.id}`)
      .then((r) => r.json())
      .then((d) => {
        const map: PredMap = {};
        for (const p of d.predictions ?? []) {
          map[p.matchId] = {
            home: String(p.homeScore),
            away: String(p.awayScore),
          };
        }
        setPreds(map);
      })
      .finally(() => setPredsReady(true));
  }, [player]);

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
    return sortMatchDayGroups(Object.entries(map));
  }, [shown]);

  const finishedCount = matches.filter((m) => m.finished).length;

  const showBettingBlocks = locked && !!player;
  const bettingLayoutReady =
    !showBettingBlocks || statsAvailable || !statsLoading;

  const scrollReady =
    matchesReady &&
    hydrated &&
    predsReady &&
    !lockLoading &&
    bettingLayoutReady &&
    matches.length > 0 &&
    byDay.length > 0;

  useScrollToTodayMatchDay(
    byDay,
    scrollReady,
    `${filter}-${group}-${player?.id ?? "anon"}-${statsAvailable ? "stats" : "nostats"}`,
    {
      behavior: "auto",
      retries: RESULTS_SCROLL_RETRIES,
      stabilizeMs: 3500,
    },
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="burst-heading text-xl">Matchresultat</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          Alla gruppmatcher på ett ställe. Resultat läggs in efter varje match.
          {statsAvailable && player && (
            <>
              {" "}
              Klicka på Familjens tips för att se allas individuella tips.
            </>
          )}
          {statsAvailable && hydrated && !player && (
            <>
              {" "}
              Gå till <strong className="text-white">Mina tips</strong> och skriv
              ditt namn för att se dina tips här.
            </>
          )}
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
          <section key={day} className="match-day-section match-day-section--results">
            <h3
              id={daySectionId(day)}
              className="text-sm font-semibold text-[var(--accent)] mb-3 scroll-mt-4"
            >
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
                    const userPick = player
                      ? (preds[m.id] ?? { home: "", away: "" })
                      : undefined;
                    const showBettingBlock =
                      statsAvailable && (!!betting || !!player);
                    return (
                      <Fragment key={m.id}>
                        <tr className="border-t border-[var(--border)]">
                          <td className="px-4 py-3">
                            <p className="font-medium">
                              {m.homeTeam} – {m.awayTeam}
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                              {formatCestMatchKickoff(m.kickoffAt)}
                            </p>
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
                        {showBettingBlock && (
                          <tr className="border-t border-[var(--border)] bg-[var(--card)]/25">
                            <td colSpan={4} className="px-4 py-3">
                              <ExpandableMatchBettingSummary
                                stats={
                                  betting ?? {
                                    matchId: m.id,
                                    homeTeam: m.homeTeam,
                                    awayTeam: m.awayTeam,
                                    dayLabel: m.dayLabel,
                                    kickoffAt: m.kickoffAt,
                                    groupCode: m.groupCode,
                                    tipCount: 0,
                                    outcomes: { home: 0, draw: 0, away: 0 },
                                    topScores: [],
                                    avgHome: 0,
                                    avgAway: 0,
                                    majorityOutcome: "draw" as const,
                                  }
                                }
                                userPick={userPick}
                                match={m}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
