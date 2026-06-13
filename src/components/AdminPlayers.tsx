"use client";

import { useCallback, useEffect, useState } from "react";
import type { MatchView } from "@/components/MatchCard";

type AdminPlayer = {
  id: string;
  name: string;
  createdAt: string;
  groupPicksCount: number;
  hasKnockoutPick: boolean;
  picksUnlocked: boolean;
};

type PredMap = Record<number, { home: string; away: string }>;

type Props = {
  password: string;
  onMessage: (msg: string, isError?: boolean) => void;
};

export function AdminPlayers({ password, onMessage }: Props) {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [locked, setLocked] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [managePlayerId, setManagePlayerId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [pickEdits, setPickEdits] = useState<PredMap>({});
  const [loadingPicks, setLoadingPicks] = useState(false);

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

  useEffect(() => {
    if (!password) return;
    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []));
  }, [password]);

  async function createPlayer(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (name.length < 2) return;
    setCreating(true);
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "create-player", name }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte skapa spelare", true);
      return;
    }
    setNewName("");
    onMessage(`Spelare "${data.player.name}" tillagd. Hen kan gå till Mina tips och skriva samma namn.`);
    load();
  }

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

  async function toggleUnlock(playerId: string, playerName: string, unlock: boolean) {
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "unlock-picks", playerId, unlocked: unlock }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte uppdatera", true);
      return;
    }
    onMessage(
      unlock
        ? `${playerName} kan nu fylla i ospelade matcher och slutspel.`
        : `Tips låsta igen för ${playerName}.`,
    );
    load();
  }

  async function openManagePicks(playerId: string) {
    if (managePlayerId === playerId) {
      setManagePlayerId(null);
      return;
    }
    setManagePlayerId(playerId);
    setLoadingPicks(true);
    const res = await fetch(`/api/predictions?playerId=${playerId}`);
    const data = await res.json();
    setLoadingPicks(false);
    const map: PredMap = {};
    for (const p of data.predictions ?? []) {
      map[p.matchId] = {
        home: String(p.homeScore),
        away: String(p.awayScore),
      };
    }
    setPickEdits(map);
  }

  async function saveMatchPick(playerId: string, matchId: number) {
    const pick = pickEdits[matchId];
    if (!pick?.home || !pick?.away) {
      onMessage("Ange hemma- och bortamål.", true);
      return;
    }
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "set-match-pick",
        playerId,
        matchId,
        homeScore: Number(pick.home),
        awayScore: Number(pick.away),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte spara tips", true);
      return;
    }
    onMessage(`Tips sparat för match #${matchId}.`);
    load();
  }

  async function clearMatchPick(playerId: string, matchId: number) {
    onMessage("");
    const res = await fetch("/api/admin/players", {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "clear-match-pick", playerId, matchId }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMessage(data.error ?? "Kunde inte ta bort tips", true);
      return;
    }
    setPickEdits((prev) => {
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
    onMessage(`Tips borttaget för match #${matchId}.`);
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
    if (managePlayerId === playerId) setPickEdits({});
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
    if (managePlayerId === playerId) setManagePlayerId(null);
    load();
  }

  const finishedMatches = matches.filter((m) => m.finished);

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
        Lägg till spelare, lås upp individuella tips efter avspark, och hantera
        tips på redan spelade matcher. Upplåsta spelare kan bara betta på
        ospelade matcher — spelade matcher styr du här.
        {locked && (
          <span className="block mt-2 text-[var(--accent)]">
            Tipsen är låsta globalt — använd &quot;Lås upp tips&quot; för den som
            glömt fylla i.
          </span>
        )}
      </p>

      <form
        onSubmit={createPlayer}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-wrap gap-2 items-end"
      >
        <label className="flex-1 min-w-[180px] text-sm">
          <span className="text-[var(--muted)]">Ny spelare</span>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="För- och efternamn"
            minLength={2}
            maxLength={80}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={creating || newName.trim().length < 2}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {creating ? "Lägger till…" : "Lägg till spelare"}
        </button>
      </form>

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
                {p.picksUnlocked && (
                  <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                    Upplåst
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] mb-3">
                Gick med {new Date(p.createdAt).toLocaleString("sv-SE")} ·
                Grupptips {p.groupPicksCount}/72
                {p.hasKnockoutPick ? " · Slutspel ifyllt" : " · Inget slutspel"}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.picksUnlocked ? (
                  <button
                    type="button"
                    onClick={() => toggleUnlock(p.id, p.name, false)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                  >
                    Lås tips igen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleUnlock(p.id, p.name, true)}
                    className="rounded-lg border border-[var(--accent)]/50 text-[var(--accent)] px-3 py-1.5 text-sm hover:bg-[var(--accent)]/10"
                  >
                    Lås upp tips
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openManagePicks(p.id)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  {managePlayerId === p.id
                    ? "Dölj spelade matcher"
                    : "Hantera spelade matcher"}
                </button>
                <button
                  type="button"
                  onClick={() => clearPicks(p.id, p.name)}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  Rensa alla tips
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id, p.name)}
                  className="rounded-lg border border-[var(--danger)]/50 text-[var(--danger)] px-3 py-1.5 text-sm hover:bg-[var(--danger)]/10"
                >
                  Ta bort spelare
                </button>
              </div>

              {managePlayerId === p.id && (
                <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-3">
                  <p className="text-sm font-semibold">
                    Spelade matcher — admin
                  </p>
                  {loadingPicks ? (
                    <p className="text-sm text-[var(--muted)]">Laddar tips…</p>
                  ) : finishedMatches.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">
                      Inga spelade matcher ännu.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-80 overflow-y-auto">
                      {finishedMatches.map((m) => {
                        const pick = pickEdits[m.id] ?? { home: "", away: "" };
                        const hasPick = pick.home !== "" && pick.away !== "";
                        return (
                          <li
                            key={m.id}
                            className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-3 text-sm"
                          >
                            <p className="font-medium mb-2">
                              {m.homeTeam} – {m.awayTeam}
                              {m.homeScore !== null && m.awayScore !== null && (
                                <span className="text-[var(--accent)] ml-2">
                                  ({m.homeScore}–{m.awayScore})
                                </span>
                              )}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={20}
                                value={pick.home}
                                onChange={(e) =>
                                  setPickEdits((prev) => ({
                                    ...prev,
                                    [m.id]: {
                                      home: e.target.value,
                                      away: prev[m.id]?.away ?? "",
                                    },
                                  }))
                                }
                                className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
                                aria-label="Hemma"
                              />
                              <span className="text-[var(--muted)]">–</span>
                              <input
                                type="number"
                                min={0}
                                max={20}
                                value={pick.away}
                                onChange={(e) =>
                                  setPickEdits((prev) => ({
                                    ...prev,
                                    [m.id]: {
                                      home: prev[m.id]?.home ?? "",
                                      away: e.target.value,
                                    },
                                  }))
                                }
                                className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
                                aria-label="Borta"
                              />
                              <button
                                type="button"
                                onClick={() => saveMatchPick(p.id, m.id)}
                                className="rounded bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-[var(--accent-foreground)]"
                              >
                                Spara tips
                              </button>
                              {hasPick && (
                                <button
                                  type="button"
                                  onClick={() => clearMatchPick(p.id, m.id)}
                                  className="rounded border border-[var(--border)] px-2 py-1 text-xs"
                                >
                                  Ta bort
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
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
