"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCestDateTime } from "@/lib/datetime";
import { ContinueAsPlayer } from "@/components/ContinueAsPlayer";
import { usePlayerSession } from "@/hooks/usePlayerSession";

type Config = {
  locked: boolean;
  lockAt: string;
  jarContributionEur: number;
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
        <h2 className="text-lg font-semibold mb-3">How it works</h2>
        <ul className="list-disc pl-5 space-y-2 text-[var(--muted)] text-sm">
          <li>
            Join with your <strong className="text-white">name</strong> and
            submit picks before kickoff on 11 June.{" "}
            <strong className="text-white">No login</strong> — use the same name
            later to continue (see below).
          </li>
          <li>
            <strong className="text-white">Come back later:</strong> open{" "}
            <strong className="text-white">My picks</strong>, enter the same
            name if needed, and your saved picks load. Use{" "}
            <strong className="text-white">Save all picks</strong> before you
            close the browser.
          </li>
          <li>
            <strong className="text-white">Step 1 — Group stage:</strong> predict
            the score for all 72 group matches.
          </li>
          <li>
            <strong className="text-white">Step 2 — Semis, final & bronze
            (required):</strong> pick semifinalists, finalists, bronze teams, and
            the champion — 9 picks total. Don&apos;t skip this after the group
            stage!
          </li>
          <li>
            Entry:{" "}
            <strong className="text-[var(--accent)]">
              €{config?.jarContributionEur ?? 10} in the office jar
            </strong>
          </li>
          <li>
            Group points:{" "}
            <strong className="text-white">{config?.pointsExact ?? 3}</strong>{" "}
            for exact score,{" "}
            <strong className="text-white">{config?.pointsOutcome ?? 1}</strong>{" "}
            for correct result (win / draw / loss).
          </li>
          {kp && (
            <li>
              Knockout points: {kp.semifinalist} per correct semifinalist,{" "}
              {kp.finalist} per finalist, {kp.champion} for champion,{" "}
              {kp.bronzeTeam} per bronze-match team.
            </li>
          )}
          <li>
            Matches with{" "}
            <strong className="text-white">
              The Netherlands, Sweden, France, or Mexico
            </strong>{" "}
            are highlighted on the picks page.
          </li>
          <li>
            <strong className="text-white">Live chat:</strong> opens{" "}
            <strong className="text-white">15 min before</strong> kickoff, closes{" "}
            <strong className="text-white">2 hours after</strong> kickoff — enter
            your name and chat with colleagues during the match.
          </li>
          <li>
            <strong className="text-white">Results:</strong> see all match
            scores on the <strong className="text-white">Results</strong> page
            after games are played. On <strong className="text-white">My picks</strong>{" "}
            you’ll see if your winner was right or wrong.
          </li>
        </ul>
        {config?.locked && (
          <p className="mt-4 rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] px-4 py-2 text-sm">
            Picks are locked — the tournament has started.
          </p>
        )}
        {!config?.locked && lockLabel && (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Picks lock: {lockLabel}
          </p>
        )}
      </section>

      {player ? (
        <section className="rounded-xl border border-[var(--accent)]/50 bg-[var(--card)] p-6">
          <p className="text-lg">
            Welcome back, <strong>{player.name}</strong>
          </p>
          {progress && (
            <p className="text-sm text-[var(--muted)] mt-2">
              Saved progress:{" "}
              <strong className="text-white">
                {progress.groupPicksCount}/{progress.groupTotal}
              </strong>{" "}
              group picks ·{" "}
              <strong className="text-white">
                {progress.knockoutFilled}/{progress.knockoutTotal}
              </strong>{" "}
              knockout fields
            </p>
          )}
          <p className="text-xs text-[var(--muted)] mt-2">
            Remembered on this device. On another browser, enter your name on My
            picks to load the same account.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/picks"
              className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-[var(--accent-foreground)]"
            >
              Go to my picks
            </Link>
            <Link
              href="/scoreboard"
              className="rounded-lg border border-[var(--border)] px-5 py-2"
            >
              Scoreboard
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg px-5 py-2 text-[var(--muted)] hover:text-white"
            >
              Use a different name
            </button>
          </div>
        </section>
      ) : (
        <ContinueAsPlayer
          title="Join the pool"
          onContinue={remember}
        />
      )}

      <section className="text-sm text-[var(--muted)]">
        <h3 className="font-semibold text-white mb-2">Groups</h3>
        <div className="grid gap-2 sm:grid-cols-2 text-xs">
          {[
            ["A", "Mexico, South Korea, South Africa, Czech Republic"],
            ["B", "Canada, Qatar, Switzerland, Bosnia and Herzegovina"],
            ["C", "Brazil, Morocco, Haiti, Scotland"],
            ["D", "USA, Paraguay, Australia, Turkey"],
            ["E", "Germany, Curaçao, Ivory Coast, Ecuador"],
            ["F", "Netherlands, Japan, Tunisia, Sweden"],
            ["G", "Belgium, Iran, New Zealand, Egypt"],
            ["H", "Spain, Saudi Arabia, Uruguay, Cape Verde"],
            ["I", "France, Senegal, Norway, Iraq"],
            ["J", "Argentina, Algeria, Austria, Jordan"],
            ["K", "Portugal, Uzbekistan, Colombia, DR Congo"],
            ["L", "England, Ghana, Croatia, Panama"],
          ].map(([g, teams]) => (
            <p key={g}>
              <strong>Group {g}:</strong> {teams}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
