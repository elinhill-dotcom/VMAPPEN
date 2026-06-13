import { findPlayerById, getFirestoreConfigError, loadGroupPredictions, saveGroupPredictions, isFirestoreConfigured } from "@/lib/firestore";
import { NextRequest, NextResponse } from "next/server";
import { predictionsLocked, PICKS_LOCKED_MESSAGE } from "@/lib/config";

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

  const res = await loadGroupPredictions(playerId);
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  return NextResponse.json({ predictions: res.data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  const items = body.predictions as
    | { matchId: number; homeScore: number; awayScore: number }[]
    | undefined;

  if (!playerId || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  if (predictionsLocked()) {
    if (!playerRes.data.picksUnlocked) {
      return NextResponse.json({ error: PICKS_LOCKED_MESSAGE }, { status: 403 });
    }
  }

  const onlyUnfinished = predictionsLocked() && playerRes.data.picksUnlocked;
  const saveRes = await saveGroupPredictions(playerId, items, {
    onlyUnfinished,
  });
  if (saveRes.error || !saveRes.data) {
    return NextResponse.json(
      { error: saveRes.error ?? "Save failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, savedCount: saveRes.data.savedCount });
}
