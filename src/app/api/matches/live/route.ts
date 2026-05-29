import { fetchLiveMatches, getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ live: [], count: 0 });
  }

  const res = await fetchLiveMatches();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load live matches" },
      { status: 500 },
    );
  }

  return NextResponse.json({ live: res.data, count: res.data.length });
}
