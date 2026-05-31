import { NextResponse } from "next/server";
import { getLeaderboardPayload } from "@/lib/leaderboard";
import {
  CACHE_KEYS,
  READ_HEAVY_CACHE_HEADERS,
  withApiCache,
} from "@/lib/api-cache";
import { isFirestoreConfigured, getFirestoreConfigError } from "@/lib/firestore";

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const res = await withApiCache(CACHE_KEYS.leaderboard, () =>
    getLeaderboardPayload(),
  );
  if (res.error || !res.data) {
    const status = /kvoten är slut/i.test(res.error ?? "") ? 429 : 500;
    return NextResponse.json(
      { error: res.error ?? "Failed to load leaderboard" },
      { status },
    );
  }

  return NextResponse.json(res.data, { headers: READ_HEAVY_CACHE_HEADERS });
}
