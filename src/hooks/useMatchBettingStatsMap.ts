"use client";

import { useEffect, useState } from "react";
import type { MatchBettingStats } from "@/lib/betting-stats-types";
import { usePredictionsLocked } from "@/hooks/usePredictionsLocked";

export function useMatchBettingStatsMap() {
  const [map, setMap] = useState<Map<number, MatchBettingStats>>(new Map());
  const { locked, loading: lockLoading } = usePredictionsLocked();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lockLoading) return;
    if (!locked) {
      setMap(new Map());
      setLoading(false);
      return;
    }

    fetch("/api/stats")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return null;
        return data;
      })
      .then((data) => {
        if (data?.stats?.matches) {
          setMap(
            new Map(
              (data.stats.matches as MatchBettingStats[]).map((m) => [
                m.matchId,
                m,
              ]),
            ),
          );
        }
      })
      .finally(() => setLoading(false));
  }, [locked, lockLoading]);

  return { map, available: locked && map.size > 0, loading: lockLoading || loading };
}
