"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCestDateTime } from "@/lib/datetime";
import { ContinueAsPlayer } from "@/components/ContinueAsPlayer";
import { usePlayerSession } from "@/hooks/usePlayerSession";

type Config = {
  locked: boolean;
  lockAt: string;
  pointsExact: number;
  pointsOutcome: number;
  knockoutPoints: {
    semifinalist: number;
    finalist: number;
    champion: number;
    bronzeTeam: number;
  };
};

type Progress = {
  groupPicksCount: number;
  groupTotal: number;
  knockoutFilled: number;
  knockoutTotal: number;
};

export default function HomePage() {
  const { player, remember, signOut } = usePlayerSession();
  const [config, setConfig] = useState<Config | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  useEffect(() => {
    if (!player) {
      setProgress(null);
      return;
    }
    fetch(`/api/players/progress?playerId=${player.id}`)
      .then((r) => r.json())
      .then(setProgress);
  }, [player]);

  const lockLabel = config ? formatCestDateTime(config.lockAt) : "";
  const kp = config?.knockoutPoints;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="burst-heading mb-4">Så funkar det</h2>
        <ul className="list-disc pl-5 space-y-2 text-[var(--muted)] text-sm">
          <li>
            Gå med med ditt <strong className="text-white">namn</strong> och
            lämna in tips före avspark 11 juni.{" "}
            <strong className="text-white">Ingen inloggning</strong> — använd
            samma namn senare för att fortsätta.
          </li>
          <li>
            <strong className="text-white">Kom tillbaka senare:</strong> öppna{" "}
            <strong className="text-white">Mina tips</strong>, skriv samma namn
            om det behövs, och dina sparade tips laddas. Klicka{" "}
            <strong className="text-white">Spara alla tips</strong> innan du
            stänger webbläsaren.
          </li>
          <li>
            <strong className="text-white">Steg 1 — Gruppspel:</strong> tippa
            resultat för alla 72 gruppmatcher.
          </li>
          <li>
            <strong className="text-white">Steg 2 — Semifinal, final & brons
            (obligatoriskt):</strong> välj semifinalister, finalister,
            bronslag och mästare — 9 val totalt. Glöm inte detta efter
            gruppspelet!
          </li>
          <li>
            Grupppoäng:{" "}
            <strong className="text-white">{config?.pointsExact ?? 3}</strong>{" "}
            för exakt resultat,{" "}
            <strong className="text-white">{config?.pointsOutcome ?? 1}</strong>{" "}
            för rätt utgång (vinst / oavgjort / förlust).
          </li>
          {kp && (
            <li>
              Slutspelspoäng: {kp.semifinalist} per rätt semifinalist,{" "}
              {kp.finalist} per finalist, {kp.champion} för mästare,{" "}
              {kp.bronzeTeam} per lag i bronsmatchen.
            </li>
          )}
          <li>
            <strong className="text-white">Sveriges matcher</strong> markeras på
            tips-sidan.
          </li>
          <li>
            <strong className="text-white">Livechatt:</strong> öppnar{" "}
            <strong className="text-white">15 min före</strong> avspark, stänger{" "}
            <strong className="text-white">2 timmar efter</strong> — chatta med
            familjen under matchen.
          </li>
          <li>
            <strong className="text-white">Resultat:</strong> alla matchresultat
            på sidan <strong className="text-white">Resultat</strong>. På{" "}
            <strong className="text-white">Mina tips</strong> ser du om ditt
            tips stämde.
          </li>
        </ul>
        {config?.locked && (
          <p className="mt-4 rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2 text-sm">
            Tipsen är låsta — turneringen har startat.
          </p>
        )}
        {!config?.locked && lockLabel && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Tips låses: {lockLabel}
          </p>
        )}
      </section>

      {player ? (
        <section className="rounded-xl border border-[var(--accent)]/50 bg-[var(--card)] p-6">
          <p className="text-lg">
            Välkommen tillbaka, <strong>{player.name}</strong>
          </p>
          {progress && (
            <p className="text-sm text-[var(--muted)] mt-2">
              Sparat:{" "}
              <strong className="text-white">
                {progress.groupPicksCount}/{progress.groupTotal}
              </strong>{" "}
              grupptips ·{" "}
              <strong className="text-white">
                {progress.knockoutFilled}/{progress.knockoutTotal}
              </strong>{" "}
              slutspelsval
            </p>
          )}
          <p className="text-xs text-[var(--muted)] mt-2">
            Sparat på den här enheten. I en annan webbläsare: skriv ditt namn
            under Mina tips.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/picks"
              className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)]"
            >
              Gå till mina tips
            </Link>
            <Link
              href="/scoreboard"
              className="rounded-lg border border-[var(--border)] px-5 py-2"
            >
              Topplista
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg px-5 py-2 text-[var(--muted)] hover:text-white"
            >
              Byt namn
            </button>
          </div>
        </section>
      ) : (
        <ContinueAsPlayer
          title="Gå med i tipset"
          onContinue={remember}
        />
      )}

      <section className="text-sm text-[var(--muted)]">
        <h3 className="font-semibold text-white mb-2">Grupper</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          {[
            ["A", "Mexiko, Sydkorea, Sydafrika, Tjeckien"],
            ["B", "Kanada, Qatar, Schweiz, Bosnien och Hercegovina"],
            ["C", "Brasilien, Marocko, Haiti, Skottland"],
            ["D", "USA, Paraguay, Australien, Turkiet"],
            ["E", "Tyskland, Curaçao, Elfenbenskusten, Ecuador"],
            ["F", "Nederländerna, Japan, Tunisien, Sverige"],
            ["G", "Belgien, Iran, Nya Zeeland, Egypten"],
            ["H", "Spanien, Saudiarabien, Uruguay, Kap Verde"],
            ["I", "Frankrike, Senegal, Norge, Irak"],
            ["J", "Argentina, Algeriet, Österrike, Jordanien"],
            ["K", "Portugal, Uzbekistan, Colombia, DR Kongo"],
            ["L", "England, Ghana, Kroatien, Panama"],
          ].map(([g, teams]) => (
            <p key={g}>
              <strong>Grupp {g}:</strong> {teams}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
