"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAdminLoggedIn } from "@/lib/admin-session";
import { formatCestMatchKickoff } from "@/lib/datetime";

type LiveMatch = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
  groupCode: string | null;
};

function MatchChatLink({ m, badge }: { m: LiveMatch; badge: string }) {
  const score =
    m.homeScore !== null && m.awayScore !== null
      ? `${m.homeScore} – ${m.awayScore}`
      : "vs";
  return (
    <li>
      <Link
        href={`/live/${m.id}`}
        className="block rounded-xl border border-[var(--accent)]/50 bg-[var(--card)] p-4 hover:border-[var(--accent)] transition"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-lg">
            {m.homeTeam}{" "}
            <span className="text-[var(--accent)]">{score}</span> {m.awayTeam}
          </p>
          <span className="live-badge">{badge}</span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">
          {formatCestMatchKickoff(m.kickoffAt)}
          {m.groupCode ? ` · Grupp ${m.groupCode}` : ""}
        </p>
      </Link>
    </li>
  );
}

export default function LivePage() {
  const [live, setLive] = useState<LiveMatch[]>([]);
  const [testMatches, setTestMatches] = useState<LiveMatch[]>([]);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const sync = () => setAdmin(isAdminLoggedIn());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  useEffect(() => {
    const load = () =>
      fetch("/api/matches/live")
        .then((r) => r.json())
        .then((d) => setLive(d.live ?? []));
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!admin) {
      setTestMatches([]);
      return;
    }

    fetch("/api/matches?stage=group")
      .then((r) => r.json())
      .then((d) => setTestMatches(d.matches ?? []));
  }, [admin]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="flex flex-wrap items-center gap-2">
          <span className="live-badge">LIVE</span>
          <span className="burst-heading text-xl">Matchchatt</span>
        </h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          Chatten öppnar <strong className="text-white">15 minuter före</strong>{" "}
          avspark och stänger{" "}
          <strong className="text-white">2 timmar efter</strong> avspark. Chatta
          med kollegor — resultat publiceras på Resultat-sidan.
        </p>
      </section>

      {admin && testMatches.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-300">
            Admin — testa chatt (valfri match)
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Du är inloggad som admin. Öppna valfri match nedan för att testa
            chatten utanför det vanliga tidsfönstret.
          </p>
          <ul className="space-y-3">
            {testMatches.map((m) => (
              <MatchChatLink key={m.id} m={m} badge="Testchatt →" />
            ))}
          </ul>
        </section>
      )}

      {live.length === 0 ? (
        <p className="text-[var(--muted)] rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          Ingen match är live just nu. Chatten öppnar 15 minuter före avspark
          och stänger 2 timmar efter.
        </p>
      ) : (
        <section className="space-y-3">
          {admin && testMatches.length > 0 && (
            <h3 className="text-sm font-semibold">Live nu</h3>
          )}
          <ul className="space-y-3">
            {live.map((m) => (
              <MatchChatLink key={m.id} m={m} badge="Livechatt →" />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
