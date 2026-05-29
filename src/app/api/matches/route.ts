import { NextRequest, NextResponse } from "next/server";
import { fetchMatches } from "@/lib/firestore";
import { isFirestoreConfigured } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const stage = req.nextUrl.searchParams.get("stage") ?? undefined;
  const res = await fetchMatches(stage ? { stage } : undefined);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Kunde inte ladda matcher" },
      { status: 500 },
    );
  }

  return NextResponse.json({ matches: res.data });
}
