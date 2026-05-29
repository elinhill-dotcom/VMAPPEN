"use client";

import { useCallback, useEffect, useState } from "react";

type AdminPlayer = {
  id: string;
  name: string;
  createdAt: string;
  groupPicksCount: number;
  hasKnockoutPick: boolean;
};

type Props = {
  password: string;
  onMessage: (msg: string, isError?: boolean) => void;
};

export function AdminPlayers({ password, onMessage }: Props) {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [locked, setLocked] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-password": password,
  };

  const load = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    const res = await fetch("/api/admin/players", { headers });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte ladda spelare", true);
      return;
    }
    setPlayers(data.players);
    setLocked(data.locked);
    const names: Record<string, string> = {};
    for (const p of data.players) {
      names[p.id] = p.name;
    }
    setEdits(names);
  }, [password, onMessage]);

  useEffect(() => {
    load();
  }, [load]);

  async function rename(playerId: string) {
    const name = edits[playerId]?.trim();
    if (!name) return;
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ playerId, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte byta namn", true);
      return;
    }
    onMessage(`Namn ändrat till "${data.player.name}".`);
    load();
  }

  async function clearPicks(playerId: string, playerName: string) {
    if (
      !confirm(
        `Rensa alla tips för ${playerName}? De kan fylla i igen under Mina tips.`,
      )
    ) {
      return;
    }
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "clear-picks", playerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte rensa", true);
      return;
    }
    onMessage(`Tips rensade för ${playerName}.`);
    load();
  }

  async function remove(playerId: string, playerName: string) {
    if (
      !confirm(
        `Ta bort ${playerName} helt? De försvinner från tipset och topplistan.`,
      )
    ) {
      return;
    }
    onMessage("");
    const res = await fetch(`/api/admin/players?playerId=${playerId}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte ta bort", true);
      return;
    }
    onMessage(`${playerName} borttagen.`);
    load();
  }

  if (!password) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Ange adminlösenordet ovan för att hantera spelare.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Rätta dubbletter, byt namn vid stavfel, eller låt någon fylla i tipsen
        igen innan turneringen startar.
        {locked && (
          <span className="block mt-2 text-[var(--danger)]">
            Tipsen är låsta — du kan fortfarande byta namn eller ta bort spelare,
            men inte rensa tips.
          </span>
        )}
      </p>

      {loading && players.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Laddar…</p>
      ) : players.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Inga spelare ännu.</p>
      ) : (
        <ul className="space-y-3">
          {players.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <input
                  type="text"
                  value={edits[p.id] ?? p.name}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="flex-1 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-semibold"
                  maxLength={80}
                />
                <button
                  type="button"
                  onClick={() => rename(p.id)}
                  disabled={edits[p.id]?.trim() === p.name}
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-40"
                >
                  Spara namn
                </button>
              </div>
              <p className="text-xs text-[var(--muted)] mb-3">
                Gick med {new Date(p.createdAt).toLocaleString("sv-SE")} ·
                Grupptips {p.groupPicksCount}/72
                {p.hasKnockoutPick ? " · Slutspel ifyllt" : " · Inget slutspel"}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => clearPicks(p.id, p.name)}
                  disabled={locked}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Rensa tips
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id, p.name)}
                  className="rounded-lg border border-[var(--danger)]/50 text-[var(--danger)] px-3 py-1.5 text-sm hover:bg-[var(--danger)]/10"
                >
                  Ta bort spelare
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={load}
        className="text-sm text-[var(--muted)] underline hover:text-white"
      >
        Uppdatera listan
      </button>
    </div>
  );
}
