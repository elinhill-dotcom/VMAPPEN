type CacheEntry = { data: unknown; expires: number };

const store = new Map<string, CacheEntry>();

export const CACHE_KEYS = {
  leaderboard: "leaderboard",
  wall: "wall",
  stats: "stats",
  matches: "matches",
} as const;

export async function withApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 45_000,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) {
    return hit.data as T;
  }

  const data = await fetcher();
  store.set(key, { data, expires: now + ttlMs });
  return data;
}

export function invalidateApiCache(...keys: string[]): void {
  for (const key of keys) {
    store.delete(key);
  }
}

export function invalidateAllApiCache(): void {
  store.clear();
}

export const READ_HEAVY_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
};
