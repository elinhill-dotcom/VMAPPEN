"use client";

import { useEffect, useMemo, useState } from "react";
import type { MatchView } from "@/components/MatchCard";
import {
  KnockoutBracket,
  KnockoutSchedule,
} from "@/components/KnockoutBracket";
import {
  KnockoutPicksTable,
  KnockoutPointsTable,
} from "@/components/KnockoutOverviewTables";
import { usePredictionsLocked } from "@/hooks/usePredictionsLocked";
import { toSwedishTeam } from "@/lib/team-names";
import type { KnockoutPickView } from "@/lib/knockout-overview";
import type { KnockoutPickData } from "@/lib/knockout-scoring";

type Tab = "schema" | "trad" | "tips" | "poang";

const TABS: { key: Tab; label: string }[] = [
  { key: "schema", label: "Schema" },
  { key: "trad", label: "Träd" },
  { key: "tips", label: "Allas tips" },
  { key: "poang", label: "Poäng" },
];

function AnswerSummary({ answer }: { answer: KnockoutPickData }) {
  const semi = [
    answer.sf1Home,
    answer.sf1Away,
    answer.sf2Home,
    answer.sf2Away,
  ]
    .filter(Boolean)
    .map((t) => toSwedishTeam(t!));
  const fin = [answer.finalHome, answer.finalAway]
    .filter(Boolean)
    .map((t) => toSwedishTeam(t!));
  const bronze = [answer.bronzeHome, answer.bronzeAway]
    .filter(Boolean)
    .map((t) => toSwedishTeam(t!));

  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-4 space-y-2 text-sm">
      <h3 className="font-semibold text-[var(--accent)]">Officiellt slutspelssvar</h3>
      {semi.length > 0 && (
        <p>
          <span className="text-[var(--muted)]">Semifinalister: </span>
          {semi.join(", ")}
        </p>
      )}
      {fin.length > 0 && (
        <p>
          <span className="text-[var(--muted)]">Final: </span>
          {fin.join(" – ")}
        </p>
      )}
      {answer.champion && (
        <p>
          <span className="text-[var(--muted)]">Mästare: </span>
          <strong>{toSwedishTeam(answer.champion)}</strong>
        </p>
      )}
      {bronze.length > 0 && (
        <p>
          <span className="text-[var(--muted)]">Brons: </span>
          {bronze.join(" – ")}
        </p>
      )}
    </section>
  );
}

export default function SlutspelPage() {
  const { locked, loading: lockLoading } = usePredictionsLocked();
  const [tab, setTab] = useState<Tab>("schema");
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [picks, setPicks] = useState<KnockoutPickView[]>([]);
  const [answer, setAnswer] = useState<KnockoutPickData | null>(null);
  const [answerScoringStarted, setAnswerScoringStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const knockoutMatches = useMemo(
    () =>
      matches.filter((m) => m.stage !== "group").sort((a, b) => a.id - b.id),
    [matches],
  );

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setError("Kunde inte ladda matcher"));
  }, []);

  useEffect(() => {
    if (lockLoading) return;
    if (!locked) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/knockout/overview")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "Kunde inte ladda slutspel");
        return d;
      })
      .then((d) => {
        setPicks(d.overview?.picks ?? []);
        setAnswer(d.overview?.answer ?? null);
        setAnswerScoringStarted(!!d.overview?.answerScoringStarted);
        if (d.overview?.matches?.length) {
          setMatches((prev) => {
            const map = new Map(prev.map((m) => [m.id, m]));
            for (const m of d.overview.matches as MatchView[]) {
              map.set(m.id, m);
            }
            return [...map.values()].sort((a, b) => a.id - b.id);
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [locked, lockLoading]);

  return (
    <div className="space-y-6 slutspel-page">
      <section>
        <h2 className="burst-heading text-xl">Slutspel</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          Slutspelsträd, matchschema och familjens slutspelstips. Poäng för
          semifinal, final och brons räknas per lag — det spelar ingen roll
          vilken semifinal du satte laget i.
        </p>
        {!locked && !lockLoading && (
          <p className="text-sm text-amber-300/90 mt-2">
            Allas tips och poängöversikt visas när tipsen låsts (11 juni kl.
            21:00).
          </p>
        )}
      </section>

      {answerScoringStarted && answer && <AnswerSummary answer={answer} />}

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            disabled={!locked && (key === "tips" || key === "poang")}
            className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 ${
              tab === key
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      )}

      {loading && locked ? (
        <p className="text-[var(--muted)]">Laddar slutspel…</p>
      ) : (
        <>
          {tab === "schema" && (
            <KnockoutSchedule matches={knockoutMatches} />
          )}
          {tab === "trad" && (
            <KnockoutBracket matches={knockoutMatches} />
          )}
          {tab === "tips" && locked && (
            <KnockoutPicksTable
              picks={picks}
              answerScoringStarted={answerScoringStarted}
            />
          )}
          {tab === "poang" && locked && (
            <KnockoutPointsTable
              picks={picks}
              answerScoringStarted={answerScoringStarted}
            />
          )}
        </>
      )}
    </div>
  );
}
