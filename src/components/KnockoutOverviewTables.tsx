import type { KnockoutPickView } from "@/lib/knockout-overview";

type Props = {
  picks: KnockoutPickView[];
  answerScoringStarted: boolean;
};

function teamCell(value: string | null) {
  return value ?? "—";
}

function semiLabel(a: string | null, b: string | null) {
  if (!a && !b) return "—";
  return [a, b].filter(Boolean).join(" · ");
}

export function KnockoutPicksTable({ picks, answerScoringStarted }: Props) {
  if (picks.length === 0) {
    return (
      <p className="text-[var(--muted)] rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        Inga slutspelstips sparade än.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-[var(--card)] text-left text-[var(--muted)]">
          <tr>
            <th className="px-3 py-2">Namn</th>
            <th className="px-3 py-2">Semifinal 1</th>
            <th className="px-3 py-2">Semifinal 2</th>
            <th className="px-3 py-2">Final</th>
            <th className="px-3 py-2">Mästare</th>
            <th className="px-3 py-2">Brons</th>
            {answerScoringStarted && (
              <th className="px-3 py-2 text-center">Poäng</th>
            )}
          </tr>
        </thead>
        <tbody>
          {picks.map((p) => (
            <tr key={p.playerId} className="border-t border-[var(--border)]">
              <td className="px-3 py-2 font-medium whitespace-nowrap">
                {p.name}
                <span className="block text-xs text-[var(--muted)] font-normal">
                  {p.pickCount}/9 val
                </span>
              </td>
              <td className="px-3 py-2 text-[var(--muted)]">
                {semiLabel(p.sf1Home, p.sf1Away)}
              </td>
              <td className="px-3 py-2 text-[var(--muted)]">
                {semiLabel(p.sf2Home, p.sf2Away)}
              </td>
              <td className="px-3 py-2 text-[var(--muted)]">
                {semiLabel(p.finalHome, p.finalAway)}
              </td>
              <td className="px-3 py-2 font-semibold text-[var(--accent)]">
                {teamCell(p.champion)}
              </td>
              <td className="px-3 py-2 text-[var(--muted)]">
                {semiLabel(p.bronzeHome, p.bronzeAway)}
              </td>
              {answerScoringStarted && (
                <td className="px-3 py-2 text-center font-bold">
                  {p.knockoutEarned}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KnockoutPointsTable({ picks, answerScoringStarted }: Props) {
  const sorted = [...picks].sort(
    (a, b) =>
      b.knockoutMaxPossible - a.knockoutMaxPossible ||
      b.knockoutRemaining - a.knockoutRemaining ||
      a.name.localeCompare(b.name, "sv"),
  );

  if (picks.length === 0) {
    return (
      <p className="text-[var(--muted)] rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        Inga slutspelstips att räkna på än.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        {answerScoringStarted
          ? "Intjänat och kvar att hämta i slutspelet. Poäng läggs till i topplistan allteftersom admin publicerar semifinal, final och mästare. Placering i semifinal spelar ingen roll — rätt lag ger poäng oavsett var du satte det."
          : "Max möjliga slutspelspoäng per person (summan av dina 9 val). Ju fler rätt som avslöjas, desto färre poäng kan fortfarande hämtas."}
      </p>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--card)] text-left text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Namn</th>
              <th className="px-4 py-3 text-center">Val</th>
              <th className="px-4 py-3 text-center">Max möjligt</th>
              {answerScoringStarted && (
                <>
                  <th className="px-4 py-3 text-center">Intjänat</th>
                  <th className="px-4 py-3 text-center">Kvar</th>
                </>
              )}
              {!answerScoringStarted && (
                <th className="px-4 py-3 text-center">Kvar att hämta</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.playerId}
                className="border-t border-[var(--border)]"
              >
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-center text-[var(--muted)]">
                  {p.pickCount}/9
                </td>
                <td className="px-4 py-3 text-center font-semibold">
                  {p.knockoutMaxPossible}
                </td>
                {answerScoringStarted ? (
                  <>
                    <td className="px-4 py-3 text-center font-bold text-[var(--accent)]">
                      {p.knockoutEarned}
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--muted)]">
                      {p.knockoutRemaining}
                    </td>
                  </>
                ) : (
                  <td className="px-4 py-3 text-center text-[var(--muted)]">
                    {p.knockoutMaxPossible}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
