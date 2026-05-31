import { computePlayerBreakdown } from "@/lib/player-breakdown";
import { getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const { playerId } = await params;
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const res = await computePlayerBreakdown(playerId);
  if (res.error) {
    const status = res.error.includes("hittades") ? 404 : 500;
    return NextResponse.json({ error: res.error }, { status });
  }

  return NextResponse.json({ breakdown: res.data });
}
