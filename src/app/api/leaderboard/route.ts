import { NextResponse } from "next/server";
import { getLeaderboardPayload } from "@/lib/leaderboard";
import { isFirestoreConfigured } from "@/lib/firestore";

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const res = await getLeaderboardPayload();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load leaderboard" },
      { status: 500 },
    );
  }

  return NextResponse.json(res.data);
}
