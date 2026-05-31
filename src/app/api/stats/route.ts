import { computeBettingStats } from "@/lib/betting-stats";
import { predictionsLocked } from "@/lib/config";
import {
  CACHE_KEYS,
  READ_HEAVY_CACHE_HEADERS,
  withApiCache,
} from "@/lib/api-cache";
import { getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  if (!predictionsLocked()) {
    return NextResponse.json(
      {
        error:
          "Statistik visas när tipsen låsts — efter avspark 11 juni kl. 21:00.",
        locked: false,
      },
      { status: 403 },
    );
  }

  const res = await withApiCache(CACHE_KEYS.stats, () => computeBettingStats(), 60_000);
  if (res.error || !res.data) {
    const status = /kvoten är slut/i.test(res.error ?? "") ? 429 : 500;
    return NextResponse.json(
      { error: res.error ?? "Kunde inte ladda statistik" },
      { status },
    );
  }

  return NextResponse.json(
    { locked: true, stats: res.data },
    { headers: READ_HEAVY_CACHE_HEADERS },
  );
}
