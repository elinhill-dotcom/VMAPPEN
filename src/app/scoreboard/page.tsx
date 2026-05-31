"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SupporterWall } from "@/components/SupporterWall";

type Entry = {
  playerId: string;
  name: string;
  points: number;
  groupPoints: number;
  knockoutPoints: number;
  exactHits: number;
  outcomeHits: number;
  groupPicksCount: number;
};

type TournamentStatus = {
  groupFinished: number;
  groupTotal: number;
  knockoutScored: boolean;
  complete: boolean;
};

type WinnerSummary = {
  playerId: string;
  name: string;
  points: number;
  explanation: string;
};

export default function ScoreboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [jarTotal, setJarTotal] = useState(0);
  const [jarPerPlayer, setJarPerPlayer] = useState(100);
  const [playerCount, setPlayerCount] = useState(0);
  const [tournament, setTournament] = useState<TournamentStatus | null>(null);
  const [winner, setWinner] = useState<WinnerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Kunde inte ladda topplistan",
          );
        }
        return data;
      })
      .then((data) => {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setJarTotal(data.jarTotalEur ?? 0);
        setJarPerPlayer(data.jarContributionEur ?? 100);
        setPlayerCount(data.playerCount ?? 0);
        setTournament(data.tournament ?? null);
        setWinner(data.winner ?? null);
        setError("");
      })
      .catch((e) => {
        setEntries([]);
        setError(
          e instanceof Error ? e.message : "Kunde inte ladda topplistan",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="scoreboard-page">
      <div className="scoreboard-page__main space-y-6">
        <section>
          <h2 className="burst-heading mb-4">Topplista</h2>

          {winner && (
            <div className="rounded-xl border border-[var(--accent)] bg-[var(--featured)] p-5 mb-6 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    Turneringen är slut — grattis!
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    <Link
                      href={`/scoreboard/${winner.playerId}`}
                      className="hover:underline"
                    >
                      {winner.name}
                    </Link>{" "}
                    vann potten
                  </p>
                </div>
                <p className="text-3xl font-bold text-[var(--accent)]">
                  {winner.points} p
                </p>
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {winner.explanation}
              </p>
              <Link
                href={`/scoreboard/${winner.playerId}`}
                className="inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
              >
                Se alla {winner.name}s tips och poäng →
              </Link>
            </div>
          )}

          {!loading && tournament && !tournament.complete && (
            <p className="text-sm text-[var(--muted)] mb-4">
              Turneringen pågår — {tournament.groupFinished}/
              {tournament.groupTotal} gruppmatcher klara
              {tournament.knockoutScored
                ? ", slutspelspoäng räknas"
                : ", slutspelspoäng väntar"}
              .
            </p>
          )}

          <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-5 mb-6">
            <p className="text-[var(--muted)] text-sm">Potten</p>
            <p className="text-3xl font-bold text-[var(--accent)]">
              {loading ? "…" : `${jarTotal} kr`}
            </p>
            <p className="text-sm text-[var(--muted)] mt-1">
              {loading
                ? "Laddar…"
                : `${playerCount} deltagare × ${jarPerPlayer} kr`}
            </p>
          </div>

          {error && (
            <p className="text-sm text-[var(--danger)] mb-3">{error}</p>
          )}
          {loading ? (
            <p className="text-[var(--muted)]">Laddar topplista…</p>
          ) : entries.length === 0 ? (
            <p className="text-[var(--muted)]">Ingen har gått med ännu.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--card)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Namn</th>
                    <th className="px-4 py-3 text-right">Totalt</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">
                      Grupp
                    </th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">
                      Slutspel
                    </th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">
                      Exakta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr
                      key={e.playerId}
                      className={`border-t border-[var(--border)] ${
                        i === 0 ? "bg-[var(--accent)]/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold">
                        <Link
                          href={`/scoreboard/${e.playerId}`}
                          className="hover:text-[var(--accent)] hover:underline"
                        >
                          {e.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--accent)] font-bold">
                        {e.points}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {e.groupPoints}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {e.knockoutPoints}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-[var(--muted)]">
                        {e.exactHits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-[var(--muted)] mt-3">
            Klicka på ett namn för att se tips och poängförklaring. Vid lika
            poäng: flest exakta grupptips vinner.
          </p>
        </section>
      </div>

      <SupporterWall />
    </div>
  );
}
