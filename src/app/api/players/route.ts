import { findOrCreatePlayerByName, fetchPlayers, getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name : "";

  const res = await findOrCreatePlayerByName(name);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Could not register" },
      { status: res.error?.includes("2â€“80") ? 400 : 500 },
    );
  }

  return NextResponse.json({ player: res.data });
}

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const res = await fetchPlayers();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load players" },
      { status: 500 },
    );
  }

  return NextResponse.json({ players: res.data });
}
