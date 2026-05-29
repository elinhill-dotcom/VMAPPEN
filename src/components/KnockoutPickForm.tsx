"use client";

import {
  type KnockoutFormState,
  emptyKnockoutForm,
} from "@/lib/knockout-picks";
import { ALL_TEAMS } from "@/lib/teams";

export type { KnockoutFormState };
export { emptyKnockoutForm };

function TeamSelect({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
      >
        <option value="">— Välj —</option>
        {ALL_TEAMS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

type Props = {
  form: KnockoutFormState;
  locked: boolean;
  onChange: (next: KnockoutFormState) => void;
};

export function KnockoutPickForm({ form, locked, onChange }: Props) {
  const set = (key: keyof KnockoutFormState, value: string) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="font-semibold">Semifinaler (4 val)</h3>
        <p className="text-xs text-[var(--muted)]">
          Vilka lag möts i varje semifinal? Välj alla fyra.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Semifinal 1 — hemma"
            value={form.sf1Home}
            disabled={locked}
            onChange={(v) => set("sf1Home", v)}
          />
          <TeamSelect
            label="Semifinal 1 — borta"
            value={form.sf1Away}
            disabled={locked}
            onChange={(v) => set("sf1Away", v)}
          />
          <TeamSelect
            label="Semifinal 2 — hemma"
            value={form.sf2Home}
            disabled={locked}
            onChange={(v) => set("sf2Home", v)}
          />
          <TeamSelect
            label="Semifinal 2 — borta"
            value={form.sf2Away}
            disabled={locked}
            onChange={(v) => set("sf2Away", v)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--featured)] p-5 space-y-4">
        <h3 className="font-semibold">Final (3 val)</h3>
        <p className="text-xs text-[var(--muted)]">
          Vilka två lag möts i finalen, och vem vinner VM?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Final — lag 1"
            value={form.finalHome}
            disabled={locked}
            onChange={(v) => set("finalHome", v)}
          />
          <TeamSelect
            label="Final — lag 2"
            value={form.finalAway}
            disabled={locked}
            onChange={(v) => set("finalAway", v)}
          />
          <div className="sm:col-span-2">
            <TeamSelect
              label="VM-vinnare"
              value={form.champion}
              disabled={locked}
              onChange={(v) => set("champion", v)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
        <h3 className="font-semibold">Bronsmatch (2 val)</h3>
        <p className="text-xs text-[var(--muted)]">
          Vilka lag spelar om bronsmedaljen?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamSelect
            label="Brons — lag 1"
            value={form.bronzeHome}
            disabled={locked}
            onChange={(v) => set("bronzeHome", v)}
          />
          <TeamSelect
            label="Brons — lag 2"
            value={form.bronzeAway}
            disabled={locked}
            onChange={(v) => set("bronzeAway", v)}
          />
        </div>
      </section>
    </div>
  );
}
