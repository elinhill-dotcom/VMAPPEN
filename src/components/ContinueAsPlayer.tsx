"use client";

import { useState } from "react";
import { joinOrResumeByName } from "@/lib/join-player";
import type { StoredPlayer } from "@/lib/player-storage";

type Props = {
  onContinue: (player: StoredPlayer) => void;
  title?: string;
};

export function ContinueAsPlayer({
  onContinue,
  title = "Fortsätt med dina tips",
}: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await joinOrResumeByName(name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onContinue(result.player);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--card)] p-6 space-y-4 max-w-lg">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-[var(--muted)]">
        Det finns <strong className="text-white">inget lösenord</strong>. Dina
        tips sparas på servern under ditt namn. När du kommer tillbaka, skriv
        samma namn så laddas allt du sparat — även halvfärdiga rader.
      </p>
      <ul className="text-xs text-[var(--muted)] list-disc pl-4 space-y-1">
        <li>
          <strong className="text-white">Samma webbläsare:</strong> vi
          kommer oftast ihåg dig automatiskt.
        </li>
        <li>
          <strong className="text-white">Ny telefon eller dator:</strong> skriv
          ditt namn nedan och tryck Fortsätt.
        </li>
        <li>
          Klicka <strong className="text-white">Spara alla tips</strong> på
          tips-sidan innan du stänger fliken.
        </li>
      </ul>
      <form onSubmit={submit} className="flex flex-wrap gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ditt namn"
          className="flex-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2"
          required
          minLength={2}
          maxLength={80}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {loading ? "Laddar…" : "Fortsätt"}
        </button>
      </form>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </section>
  );
}
