"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredPlayer } from "@/lib/player-storage";

type WallComment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

export function SupporterWall() {
  const [comments, setComments] = useState<WallComment[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/wall");
    const data = await res.json();
    setComments(data.comments ?? []);
  }, []);

  useEffect(() => {
    const player = getStoredPlayer();
    if (player?.name) setName(player.name);
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPosting(true);
    try {
      const res = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kunde inte publicera");
        return;
      }
      setMessage("");
      setComments((prev) => [data.comment, ...prev]);
    } finally {
      setPosting(false);
    }
  }

  return (
    <aside className="supporter-wall flex flex-col h-full min-h-[320px]">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span aria-hidden>📣</span>
          Hejaropps vägg
        </h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          Heja, skämt eller hype — håll det trevligt.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3 mb-4 shrink-0"
      >
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Ditt namn</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            placeholder="Namn"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Kommentar</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            maxLength={500}
            rows={3}
            placeholder="Heja Sverige! / Lycka till allihopa!"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 resize-y"
          />
        </label>
        <p className="text-xs text-[var(--muted)] text-right">
          {message.length}/500
        </p>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          disabled={posting}
          className="w-full rounded-lg bg-[var(--accent)] py-2 font-semibold text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {posting ? "Publicerar…" : "Publicera på väggen"}
        </button>
      </form>

      <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden flex flex-col min-h-0">
        <p className="text-xs text-[var(--muted)] px-4 py-2 border-b border-[var(--border)] shrink-0">
          {comments.length} meddelande{comments.length === 1 ? "" : "n"}
        </p>
        <ul className="overflow-y-auto flex-1 p-3 space-y-3 max-h-[420px] lg:max-h-none">
          {comments.length === 0 ? (
            <li className="text-sm text-[var(--muted)] text-center py-8">
              Var först med att skriva något!
            </li>
          ) : (
            comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/60 p-3"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-semibold text-[var(--accent)]">
                    {c.name}
                  </span>
                  <time className="text-[10px] text-[var(--muted)] shrink-0">
                    {new Date(c.createdAt).toLocaleString("sv-SE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {c.message}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}
