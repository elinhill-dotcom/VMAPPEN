import type { MatchView } from "@/components/MatchCard";
import { formatCestMatchKickoff } from "@/lib/datetime";
import {
  BRACKET_BRONZE,
  BRACKET_FINAL,
  BRACKET_LEFT,
  BRACKET_RIGHT,
  BRACKET_ROUND_LABELS,
  KNOCKOUT_STAGE_LABELS,
} from "@/lib/knockout-bracket";
import {
  isWinnerRow,
  resolveBracketTeam,
  teamRowScore,
} from "@/lib/knockout-resolve";
import { knockoutMatchLabel } from "@/lib/knockout-labels";

type Props = {
  matches: MatchView[];
};

function matchById(matches: MatchView[], id: number): MatchView | undefined {
  return matches.find((m) => m.id === id);
}

function BracketMatchCard({
  match,
  allMatches,
}: {
  match: MatchView;
  allMatches: MatchView[];
}) {
  const home = resolveBracketTeam(match.homeTeam, allMatches);
  const away = resolveBracketTeam(match.awayTeam, allMatches);

  return (
    <div className="knockout-bracket__match">
      <div
        className={`knockout-bracket__team-row ${
          isWinnerRow(match, "home") ? "knockout-bracket__team-row--winner" : ""
        } ${home.pending ? "knockout-bracket__team-row--pending" : ""}`}
      >
        <span className="knockout-bracket__team-name">{home.name}</span>
        <span className="knockout-bracket__team-score">
          {teamRowScore(match, "home") ?? "–"}
        </span>
      </div>
      <div
        className={`knockout-bracket__team-row ${
          isWinnerRow(match, "away") ? "knockout-bracket__team-row--winner" : ""
        } ${away.pending ? "knockout-bracket__team-row--pending" : ""}`}
      >
        <span className="knockout-bracket__team-name">{away.name}</span>
        <span className="knockout-bracket__team-score">
          {teamRowScore(match, "away") ?? "–"}
        </span>
      </div>
      <p className="knockout-bracket__meta">
        {knockoutMatchLabel(match)}
        {" · "}
        {formatCestMatchKickoff(match.kickoffAt)}
      </p>
    </div>
  );
}

function BracketSide({
  tree,
  matches,
  side,
}: {
  tree: typeof BRACKET_LEFT;
  matches: MatchView[];
  side: "left" | "right";
}) {
  const rounds: { key: keyof typeof BRACKET_ROUND_LABELS; ids: number[] }[] = [
    { key: "r16", ids: tree.r16Pairs.flatMap((p) => [...p]) },
    { key: "r8", ids: [...tree.r8] },
    { key: "qf", ids: [...tree.qf] },
    { key: "sf", ids: [...tree.sf] },
  ];

  return (
    <div className={`knockout-bracket__side knockout-bracket__side--${side}`}>
      {rounds.map(({ key, ids }) => (
        <div key={key} className="knockout-bracket__round">
          <p className="knockout-bracket__round-label">
            {BRACKET_ROUND_LABELS[key]}
          </p>
          <div
            className={`knockout-bracket__round-body knockout-bracket__round-body--${key}`}
          >
            {key === "r16"
              ? tree.r16Pairs.map(([a, b]) => {
                  const ma = matchById(matches, a);
                  const mb = matchById(matches, b);
                  if (!ma || !mb) return null;
                  return (
                    <div key={`${a}-${b}`} className="knockout-bracket__pair">
                      <BracketMatchCard match={ma} allMatches={matches} />
                      <BracketMatchCard match={mb} allMatches={matches} />
                    </div>
                  );
                })
              : ids.map((id) => {
                  const m = matchById(matches, id);
                  if (!m) return null;
                  return (
                    <BracketMatchCard
                      key={id}
                      match={m}
                      allMatches={matches}
                    />
                  );
                })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KnockoutBracket({ matches }: Props) {
  const final = matchById(matches, BRACKET_FINAL);
  const bronze = matchById(matches, BRACKET_BRONZE);

  return (
    <div className="knockout-bracket">
      <p className="text-xs text-[var(--muted)] mb-3">
        Scrolla horisontellt för hela trädet. Vinnare fylls i automatiskt när
        matcher spelats klart.
      </p>
      <div className="knockout-bracket__tree">
        <BracketSide tree={BRACKET_LEFT} matches={matches} side="left" />
        <div className="knockout-bracket__center">
          <p className="knockout-bracket__round-label">Final</p>
          {final && (
            <div className="knockout-bracket__final">
              <span className="knockout-bracket__trophy" aria-hidden>
                🏆
              </span>
              <BracketMatchCard match={final} allMatches={matches} />
            </div>
          )}
          <p className="knockout-bracket__round-label mt-4">Brons</p>
          {bronze && (
            <BracketMatchCard match={bronze} allMatches={matches} />
          )}
        </div>
        <BracketSide tree={BRACKET_RIGHT} matches={matches} side="right" />
      </div>
    </div>
  );
}

export function KnockoutSchedule({ matches }: Props) {
  const byStage = new Map<string, MatchView[]>();
  for (const m of matches) {
    const list = byStage.get(m.stage) ?? [];
    list.push(m);
    byStage.set(m.stage, list);
  }

  const stageOrder = ["r16", "r8", "qf", "sf", "bronze", "final"];

  return (
    <div className="space-y-6">
      {stageOrder.map((stage) => {
        const stageMatches = byStage.get(stage);
        if (!stageMatches?.length) return null;
        return (
          <section key={stage}>
            <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">
              {KNOCKOUT_STAGE_LABELS[stage] ?? stage}
            </h3>
            <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden">
              {stageMatches.map((m) => {
                const home = resolveBracketTeam(m.homeTeam, matches);
                const away = resolveBracketTeam(m.awayTeam, matches);
                const score =
                  m.finished && m.homeScore !== null && m.awayScore !== null
                    ? `${m.homeScore}–${m.awayScore}`
                    : "—";
                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-[var(--card)]/40 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {home.name}{" "}
                        <span className="text-[var(--accent)]">{score}</span>{" "}
                        {away.name}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {formatCestMatchKickoff(m.kickoffAt)}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {knockoutMatchLabel(m)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
