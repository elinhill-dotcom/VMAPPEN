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
            Vid lika poäng: flest exakta grupptips vinner.
          </p>
        </section>
      </div>

      <SupporterWall />
    </div>
  );
}
