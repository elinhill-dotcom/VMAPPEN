"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadCsv,
  type PicksExportPayload,
} from "@/lib/export-picks";

type Props = {
  password: string;
  onMessage: (msg: string, isError?: boolean) => void;
};

export function AdminExport({ password, onMessage }: Props) {
  const [data, setData] = useState<PicksExportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const headers = {
    "x-admin-password": password,
  };

  const load = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    onMessage("");
    const res = await fetch("/api/admin/export", { headers });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      onMessage(json.error ?? "Kunde inte ladda tips", true);
      return;
    }
    setData(json.export ?? null);
  }, [password, onMessage]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePrint() {
    window.print();
  }

  if (!password) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Logga in som admin för att exportera tips.
      </p>
    );
  }

  const playerCount = data?.players.length ?? 0;
  const picksCount =
    data?.players.reduce(
      (n, p) =>
        n + p.predictions.filter((x) => x.homeScore !== null).length,
      0,
    ) ?? 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Ladda ner alla sparade tips som CSV (öppnas i Excel) eller skriv ut /
        spara som PDF via webbläsaren.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Laddar…" : "Uppdatera"}
        </button>
        <button
          type="button"
          onClick={() => data && downloadCsv(data)}
          disabled={!data || loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          Ladda ner CSV
        </button>
        <button
          type="button"
          onClick={handlePrint}
          disabled={!data || loading}
          className="rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          Skriv ut / PDF
        </button>
      </div>

      {data && (
        <p className="text-xs text-[var(--muted)]">
          {playerCount} spelare · {picksCount} grupptips · exporterad{" "}
          {new Date(data.exportedAt).toLocaleString("sv-SE")}
        </p>
      )}

      {data && (
        <div
          ref={printRef}
          id="admin-export-print"
          className="admin-export-print rounded-xl border border-[var(--border)] bg-white text-black p-6 space-y-8 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-0"
        >
          <header className="border-b border-gray-300 pb-4">
            <h1 className="text-2xl font-bold">SUPER VMAPP — alla tips</h1>
            <p className="text-sm text-gray-600 mt-1">
              Exporterad {new Date(data.exportedAt).toLocaleString("sv-SE")} ·{" "}
              {playerCount} spelare
            </p>
          </header>

          {data.players.map((player) => {
            const filled = player.predictions.filter(
              (p) => p.homeScore !== null && p.awayScore !== null,
            );
            const ko = player.knockout;
            const hasKnockout =
              ko && Object.values(ko).some((v) => v !== "");

            if (filled.length === 0 && !hasKnockout) return null;

            return (
              <section key={player.playerId} className="break-inside-avoid">
                <h2 className="text-lg font-bold border-b border-gray-200 pb-1 mb-3">
                  {player.name}
                </h2>

                {filled.length > 0 && (
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-1 pr-2">Match</th>
                        <th className="py-1 pr-2">Grupp</th>
                        <th className="py-1 text-right">Tips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filled.map((p) => (
                        <tr key={p.matchId} className="border-t border-gray-100">
                          <td className="py-1 pr-2">
                            {p.homeTeam} – {p.awayTeam}
                          </td>
                          <td className="py-1 pr-2 text-gray-600">
                            {p.groupCode ?? "—"}
                          </td>
                          <td className="py-1 text-right font-medium">
                            {p.homeScore}–{p.awayScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {hasKnockout && ko && (
                  <div className="text-sm grid gap-1 sm:grid-cols-2">
                    <p>
                      <span className="text-gray-600">Semifinal 1:</span>{" "}
                      {ko.sf1Home || "—"} – {ko.sf1Away || "—"}
                    </p>
                    <p>
                      <span className="text-gray-600">Semifinal 2:</span>{" "}
                      {ko.sf2Home || "—"} – {ko.sf2Away || "—"}
                    </p>
                    <p>
                      <span className="text-gray-600">Final:</span>{" "}
                      {ko.finalHome || "—"} – {ko.finalAway || "—"}
                    </p>
                    <p>
                      <span className="text-gray-600">Brons:</span>{" "}
                      {ko.bronzeHome || "—"} – {ko.bronzeAway || "—"}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-600">VM-vinnare:</span>{" "}
                      <strong>{ko.champion || "—"}</strong>
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
