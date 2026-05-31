import { computeBettingStats } from "@/lib/betting-stats";
import { predictionsLocked } from "@/lib/config";
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

  const res = await computeBettingStats();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Kunde inte ladda statistik" },
      { status: 500 },
    );
  }

  return NextResponse.json({ locked: true, stats: res.data });
}
