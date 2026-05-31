import { fetchMatches, getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import {
  CACHE_KEYS,
  READ_HEAVY_CACHE_HEADERS,
  withApiCache,
} from "@/lib/api-cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const stage = req.nextUrl.searchParams.get("stage") ?? undefined;
  const cacheKey = stage ? `${CACHE_KEYS.matches}:${stage}` : CACHE_KEYS.matches;
  const res = await withApiCache(cacheKey, () =>
    fetchMatches(stage ? { stage } : undefined),
  );
  if (res.error || !res.data) {
    const status = /kvoten är slut/i.test(res.error ?? "") ? 429 : 500;
    return NextResponse.json(
      { error: res.error ?? "Kunde inte ladda matcher" },
      { status },
    );
  }

  return NextResponse.json(
    { matches: res.data },
    { headers: READ_HEAVY_CACHE_HEADERS },
  );
}
