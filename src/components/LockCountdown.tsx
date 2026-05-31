"use client";

import { useEffect, useState } from "react";
import { usePredictionsLocked } from "@/hooks/usePredictionsLocked";
import { formatCestDateTime } from "@/lib/datetime";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdownParts(lockAt: string): CountdownParts | null {
  const ms = new Date(lockAt).getTime() - Date.now();
  if (ms <= 0) return null;

  const totalSec = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function LockCountdown() {
  const { locked, loading, lockAt } = usePredictionsLocked();
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    lockAt ? getCountdownParts(lockAt) : null,
  );

  useEffect(() => {
    if (!lockAt || locked) return;

    const tick = () => setParts(getCountdownParts(lockAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockAt, locked]);

  if (loading) return null;

  if (locked) {
    return (
      <section
        className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-5 text-center"
        aria-live="polite"
      >
        <p className="text-lg font-semibold text-[var(--danger)]">
          Tipsen är låsta
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Turneringen har startat — statistik och andras tips är öppna.
        </p>
      </section>
    );
  }

  if (!lockAt || !parts) return null;

  const units: { label: string; value: number }[] = [
    { label: "dagar", value: parts.days },
    { label: "tim", value: parts.hours },
    { label: "min", value: parts.minutes },
    { label: "sek", value: parts.seconds },
  ];

  return (
    <section
      className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-5 text-center"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-white">Nedräkning till avspark</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Tips låses {formatCestDateTime(lockAt)}
      </p>
      <div
        className="mt-4 flex justify-center gap-3 sm:gap-6"
        role="timer"
        aria-label={`Nedräkning till tipslåsning, ${parts.days} dagar ${parts.hours} timmar ${parts.minutes} minuter ${parts.seconds} sekunder`}
      >
        {units.map(({ label, value }) => (
          <div key={label} className="min-w-[3.25rem] sm:min-w-[3.75rem]">
            <p className="text-2xl font-bold tabular-nums text-[var(--accent)] sm:text-3xl">
              {pad(value)}
            </p>
            <p className="text-[0.65rem] uppercase tracking-wide text-[var(--muted)] sm:text-xs">
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Kl. 21:00 låses tips automatiskt och statistik samt andras tips öppnas.
      </p>
    </section>
  );
}
