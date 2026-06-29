"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KnockoutPickForm,
  emptyKnockoutForm,
  type KnockoutFormState,
} from "@/components/KnockoutPickForm";
import { AdminPlayers } from "@/components/AdminPlayers";
import { AdminExport } from "@/components/AdminExport";
import type { MatchView } from "@/components/MatchCard";
import {
  clearAdminSession,
  getAdminPassword,
  isAdminLoggedIn,
  verifyAndLogin,
} from "@/lib/admin-session";
import { knockoutMatchLabel } from "@/lib/knockout-labels";
import { KNOCKOUT_STAGE_LABELS } from "@/lib/knockout-bracket";
import { resolveBracketTeam } from "@/lib/knockout-resolve";
import Link from "next/link";

type AdminTab = "group" | "knockout-results" | "knockout" | "players" | "export";

const KNOCKOUT_STAGE_ORDER = [
  "r16",
  "r8",
  "qf",
  "sf",
  "bronze",
  "final",
] as const;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [pwInput, setPwInput] = useState("");

  const [matches, setMatches] = useState<MatchView[]>([]);
  const [knockout, setKnockout] = useState<KnockoutFormState>(
    emptyKnockoutForm(),
  );
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [tab, setTab] = useState<AdminTab>("group");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const showMessage = useCallback((msg: string, isError = false) => {
    setMessage(msg);
    setMessageIsError(isError);
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn()) {
      setPassword(getAdminPassword()!);
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []));
    fetch("/api/admin/knockout")
      .then((r) => r.json())
      .then((d) => {
        const a = d.answer;
        if (a) {
          setKnockout({
            sf1Home: a.sf1Home ?? "",
            sf1Away: a.sf1Away ?? "",
            sf2Home: a.sf2Home ?? "",
            sf2Away: a.sf2Away ?? "",
            finalHome: a.finalHome ?? "",
            finalAway: a.finalAway ?? "",
            bronzeHome: a.bronzeHome ?? "",
            bronzeAway: a.bronzeAway ?? "",
            champion: a.champion ?? "",
          });
        }
      });
  }, [loggedIn]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    const result = await verifyAndLogin(pwInput);
    setLoggingIn(false);
    if (result.ok) {
      setPassword(pwInput);
      setLoggedIn(true);
    } else {
      setLoginError(result.error ?? "Fel lösenord");
    }
  }

  function handleLogout() {
    clearAdminSession();
    setLoggedIn(false);
    setPassword("");
    setPwInput("");
  }

  const groupMatches = useMemo(
    () => matches.filter((m) => m.stage === "group"),
    [matches],
  );
  const knockoutMatches = useMemo(
    () =>
      matches
        .filter((m) => m.stage !== "group")
        .sort((a, b) => a.id - b.id),
    [matches],
  );

  const shownGroup = groupMatches.filter((m) =>
    filter === "open" ? !m.finished : true,
  );
  const shownKnockout = knockoutMatches.filter((m) =>
    filter === "open" ? !m.finished : true,
  );

  async function saveResult(
    matchId: number,
    homeScore: number,
    awayScore: number,
  ) {
    showMessage("");
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ matchId, homeScore, awayScore, finished: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error ?? "Kunde inte spara", true);
      return;
    }
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...data.match } : m)),
    );
    showMessage(`Resultat sparat för match #${matchId}`);
  }

  async function clearResult(matchId: number) {
    if (
      !confirm(
        "Nollställ resultatet för den här matchen? Matchen markeras som ej spelad.",
      )
    ) {
      return;
    }
    showMessage("");
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ matchId, clear: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error ?? "Kunde inte nollställa", true);
      return;
    }
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, ...data.match } : m)),
    );
    showMessage(`Resultat nollställt för match #${matchId}`);
  }

  async function saveKnockout() {
    showMessage("");
    const res = await fetch("/api/admin/knockout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(knockout),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error ?? "Kunde inte spara", true);
      return;
    }
    showMessage("Slutspelssvar sparade — topplistan uppdaterad.");
  }

  if (!loggedIn) {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 max-w-sm">
          <h2 className="font-semibold mb-3">Admin</h2>
          <form onSubmit={handleLogin} className="space-y-3">
            <label className="block text-sm text-[var(--muted)]">
              Lösenord
            </label>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={loggingIn || !pwInput}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
            >
              {loggingIn ? "Kontrollerar…" : "Logga in"}
            </button>
            {loginError && (
              <p className="text-sm text-[var(--danger)]">{loginError}</p>
            )}
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Admin</h2>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-[var(--muted)] underline hover:text-white"
          >
            Logga ut
          </button>
        </div>
      </section>

      {message && (
        <p
          className={`text-sm ${
            messageIsError ? "text-[var(--danger)]" : "text-[var(--success)]"
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("players")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "players"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Spelare
        </button>
        <button
          type="button"
          onClick={() => setTab("export")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "export"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Exportera tips
        </button>
        <button
          type="button"
          onClick={() => setTab("group")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "group"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Gruppresultat
        </button>
        <button
          type="button"
          onClick={() => setTab("knockout-results")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "knockout-results"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Slutspelsresultat
        </button>
        <button
          type="button"
          onClick={() => setTab("knockout")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === "knockout"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--card)]"
          }`}
        >
          Slutspelssvar
        </button>
      </div>

      {tab === "players" && (
        <AdminPlayers password={password} onMessage={showMessage} />
      )}

      {tab === "export" && (
        <AdminExport password={password} onMessage={showMessage} />
      )}

      {tab === "group" && (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("open")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "open"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              Ej klara
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              Alla
            </button>
          </div>

          <div className="space-y-4">
            {shownGroup.map((m) => (
              <AdminMatchRow
                key={m.id}
                match={m}
                onSave={saveResult}
                onClear={clearResult}
              />
            ))}
          </div>
        </>
      )}

      {tab === "knockout-results" && (
        <>
          <p className="text-sm text-[var(--muted)]">
            Spara vinnare per slutspelsmatch — trädet och poängen uppdateras
            automatiskt. Lag som åker ut försvinner från &quot;Kvar&quot; i
            slutspelspoäng.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("open")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "open"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              Ej klara
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "bg-[var(--card)]"
              }`}
            >
              Alla
            </button>
          </div>

          <div className="space-y-8">
            {KNOCKOUT_STAGE_ORDER.map((stage) => {
              const stageMatches = shownKnockout.filter((m) => m.stage === stage);
              if (stageMatches.length === 0) return null;
              return (
                <section key={stage} className="space-y-3">
                  <h3 className="font-semibold text-[var(--accent)]">
                    {KNOCKOUT_STAGE_LABELS[stage]}
                  </h3>
                  {stageMatches.map((m) => (
                    <AdminKnockoutMatchRow
                      key={m.id}
                      match={m}
                      allMatches={knockoutMatches}
                      onSave={saveResult}
                      onClear={clearResult}
                    />
                  ))}
                </section>
              );
            })}
          </div>
        </>
      )}

      {tab === "knockout" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Valfritt manuellt slutspelssvar om du vill åsidosätta det som
            härleds från matchresultat. Normalt räcker det att fylla i
            slutspelsresultat ovan.
          </p>
          <KnockoutPickForm
            form={knockout}
            locked={false}
            onChange={setKnockout}
          />
          <button
            type="button"
            onClick={saveKnockout}
            className="rounded-lg bg-[var(--success)] px-5 py-2 font-semibold text-[var(--accent-foreground)]"
          >
            Spara slutspelssvar
          </button>
        </div>
      )}
    </div>
  );
}

function AdminKnockoutMatchRow({
  match,
  allMatches,
  onSave,
  onClear,
}: {
  match: MatchView;
  allMatches: MatchView[];
  onSave: (id: number, h: number, a: number) => void;
  onClear: (id: number) => void;
}) {
  const [home, setHome] = useState(
    match.homeScore !== null ? String(match.homeScore) : "0",
  );
  const [away, setAway] = useState(
    match.awayScore !== null ? String(match.awayScore) : "0",
  );

  const homeResolved = resolveBracketTeam(match.homeTeam, allMatches);
  const awayResolved = resolveBracketTeam(match.awayTeam, allMatches);
  const canPickWinner = !homeResolved.pending && !awayResolved.pending;
  const label = knockoutMatchLabel(match);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)] mb-2">
        #{match.id}
        {label ? ` · ${label}` : ""} · {match.dayLabel}
      </p>
      <p className="font-semibold mb-3">
        {homeResolved.name} – {awayResolved.name}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {canPickWinner && (
          <>
            <button
              type="button"
              onClick={() => onSave(match.id, 1, 0)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg)]"
            >
              {homeResolved.name} vann
            </button>
            <button
              type="button"
              onClick={() => onSave(match.id, 0, 1)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--bg)]"
            >
              {awayResolved.name} vann
            </button>
            <span className="text-xs text-[var(--muted)]">eller resultat:</span>
          </>
        )}
        <input
          type="number"
          min={0}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
        />
        <span>–</span>
        <input
          type="number"
          min={0}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
        />
        <button
          type="button"
          onClick={() => onSave(match.id, Number(home), Number(away))}
          className="rounded-lg bg-[var(--success)] px-4 py-1.5 text-sm font-medium text-[var(--accent-foreground)]"
        >
          {match.finished ? "Uppdatera" : "Spara resultat"}
        </button>
        {match.finished && (
          <>
            <span className="text-xs text-[var(--muted)]">Klar</span>
            <button
              type="button"
              onClick={() => onClear(match.id)}
              className="rounded-lg border border-[var(--danger)]/50 px-4 py-1.5 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10"
            >
              Nollställ resultat
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AdminMatchRow({
  match,
  onSave,
  onClear,
}: {
  match: MatchView;
  onSave: (id: number, h: number, a: number) => void;
  onClear: (id: number) => void;
}) {
  const [home, setHome] = useState(
    match.homeScore !== null ? String(match.homeScore) : "0",
  );
  const [away, setAway] = useState(
    match.awayScore !== null ? String(match.awayScore) : "0",
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs text-[var(--muted)] mb-2">
        #{match.id}
        {match.groupCode ? ` · Grupp ${match.groupCode}` : ""} · {match.dayLabel}
      </p>
      <p className="font-semibold mb-3">
        {match.homeTeam} – {match.awayTeam}
      </p>
      <Link
        href={`/live/${match.id}`}
        className="text-xs text-[var(--accent)] hover:underline mb-3 inline-block"
      >
        Testa livechatt →
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          min={0}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
        />
        <span>–</span>
        <input
          type="number"
          min={0}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="w-14 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-center"
        />
        <button
          type="button"
          onClick={() => onSave(match.id, Number(home), Number(away))}
          className="rounded-lg bg-[var(--success)] px-4 py-1.5 text-sm font-medium text-[var(--accent-foreground)]"
        >
          {match.finished ? "Uppdatera" : "Spara resultat"}
        </button>
        {match.finished && (
          <>
            <span className="text-xs text-[var(--muted)]">Klar</span>
            <button
              type="button"
              onClick={() => onClear(match.id)}
              className="rounded-lg border border-[var(--danger)]/50 px-4 py-1.5 text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10"
            >
              Nollställ resultat
            </button>
          </>
        )}
      </div>
    </div>
  );
}
