"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlayerPickAccess } from "@/lib/pick-access";

const defaultAccess: PlayerPickAccess = {
  globallyLocked: false,
  playerUnlocked: false,
  canSavePicks: true,
};

export function usePlayerPickAccess(playerId: string | null | undefined) {
  const [access, setAccess] = useState<PlayerPickAccess>(defaultAccess);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!playerId) {
      setAccess(defaultAccess);
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/players/pick-access?playerId=${playerId}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAccess({
        globallyLocked: !!data.globallyLocked,
        playerUnlocked: !!data.playerUnlocked,
        canSavePicks: !!data.canSavePicks,
      });
    }
    setLoading(false);
  }, [playerId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return { access, loading, refresh };
}
