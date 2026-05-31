"use client";

import { useCallback, useEffect, useState } from "react";

type ConfigResponse = {
  locked?: boolean;
  lockAt?: string;
};

export function usePredictionsLocked() {
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lockAt, setLockAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/config");
    const c = (await res.json().catch(() => ({}))) as ConfigResponse;
    setLocked(!!c.locked);
    setLockAt(typeof c.lockAt === "string" ? c.lockAt : null);
    return c;
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setLocked(false))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      refresh().catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (locked || !lockAt) return;

    const ms = new Date(lockAt).getTime() - Date.now();
    if (ms <= 0) {
      setLocked(true);
      return;
    }

    const timeout = setTimeout(() => {
      setLocked(true);
      refresh().catch(() => {});
    }, ms);

    return () => clearTimeout(timeout);
  }, [lockAt, locked, refresh]);

  return { locked, loading, lockAt };
}
