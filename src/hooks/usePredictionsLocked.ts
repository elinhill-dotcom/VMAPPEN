"use client";

import { useEffect, useState } from "react";

export function usePredictionsLocked() {
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => setLocked(!!c.locked))
      .catch(() => setLocked(false))
      .finally(() => setLoading(false));
  }, []);

  return { locked, loading };
}
