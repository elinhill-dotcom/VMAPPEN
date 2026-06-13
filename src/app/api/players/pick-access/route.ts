import { findPlayerById, getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { getPlayerPickAccess } from "@/lib/pick-access";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Spelaren hittades inte." }, { status: 404 });
  }

  const access = getPlayerPickAccess(playerRes.data.picksUnlocked);
  return NextResponse.json(access);
}
