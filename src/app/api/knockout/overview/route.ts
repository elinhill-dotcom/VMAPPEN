import { computeKnockoutOverview } from "@/lib/knockout-overview";
import { predictionsLocked, PICKS_HIDDEN_MESSAGE } from "@/lib/config";
import {
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
      { error: PICKS_HIDDEN_MESSAGE, locked: false },
      { status: 403 },
    );
  }

  const res = await withApiCache(
    "knockout-overview",
    () => computeKnockoutOverview(),
    60_000,
  );

  if (res.error || !res.data) {
    const status = /kvoten är slut/i.test(res.error ?? "") ? 429 : 500;
    return NextResponse.json(
      { error: res.error ?? "Kunde inte ladda slutspel" },
      { status },
    );
  }

  return NextResponse.json(
    { overview: res.data },
    { headers: READ_HEAVY_CACHE_HEADERS },
  );
}
