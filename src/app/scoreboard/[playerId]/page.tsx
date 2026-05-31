"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PlayerBreakdownView } from "@/components/PlayerBreakdownView";
import type { PlayerBreakdown } from "@/lib/player-breakdown-shared";

export default function PlayerScorePage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [breakdown, setBreakdown] = useState<PlayerBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    fetch(`/api/players/${playerId}/breakdown`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Kunde inte ladda resultat",
          );
        }
        return data;
      })
      .then((data) => {
        setBreakdown(data.breakdown ?? null);
        setError("");
      })
      .catch((e) => {
        setBreakdown(null);
        setError(
          e instanceof Error ? e.message : "Kunde inte ladda resultat",
        );
      })
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return <p className="text-[var(--muted)]">Laddar resultat…</p>;
  }

  if (error || !breakdown) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--danger)]">{error || "Hittades inte"}</p>
        <a href="/scoreboard" className="text-sm text-[var(--accent)]">
          ← Tillbaka till topplistan
        </a>
      </div>
    );
  }

  return <PlayerBreakdownView breakdown={breakdown} />;
}
