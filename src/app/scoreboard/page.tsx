"use client";

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

export default function ScoreboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [jarTotalEur, setJarTotalEur] = useState(0);
  const [jarContributionEur, setJarContributionEur] = useState(100);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries);
        setJarTotalEur(data.jarTotalEur);
        setJarContributionEur(data.jarContributionEur);
        setPlayerCount(data.playerCount);
      });
  }, []);

  return (
    <div className="scoreboard-page">
      <div className="scoreboard-page__main space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-[var(--muted)] text-sm">Pott</p>
          <p className="text-3xl font-bold text-[var(--accent)]">{jarTotalEur} kr</p>
          <p className="text-sm text-[var(--muted)] mt-1">
            {playerCount} deltagare × {jarContributionEur} kr var
          </p>
        </div>

        <section>
          <h2 className="burst-heading mb-4">Topplista</h2>
          {entries.length === 0 ? (
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
                      <td className="px-4 py-3 font-semibold">{e.name}</td>
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
            Vid lika poäng: flest exakta grupptips. Dela potten som ni kommer
            överens (t.ex. 60 % / 30 % / 10 % till topp 3).
          </p>
        </section>
      </div>

      <SupporterWall />
    </div>
  );
}
