import { NextRequest, NextResponse } from "next/server";
import { predictionsLocked } from "@/lib/config";
import type { KnockoutFormState } from "@/lib/knockout-picks";
import { findPlayerById } from "@/lib/firestore";
import {
  loadKnockoutPick,
  saveKnockoutPick,
} from "@/lib/firestore";
import { isFirestoreConfigured } from "@/lib/firestore";
import { ALL_TEAMS } from "@/lib/teams";

const validTeams = new Set<string>(ALL_TEAMS);

function sanitizeTeam(v: unknown): string {
  if (typeof v !== "string" || !v) return "";
  return validTeams.has(v) ? v : "";
}

export async function GET(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const res = await loadKnockoutPick(playerId);
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  return NextResponse.json({ pick: res.data });
}

export async function POST(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  if (predictionsLocked()) {
    return NextResponse.json(
      { error: "Picks are locked â€” the tournament has started." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  if (!playerId) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const form: KnockoutFormState = {
    sf1Home: sanitizeTeam(body.sf1Home),
    sf1Away: sanitizeTeam(body.sf1Away),
    sf2Home: sanitizeTeam(body.sf2Home),
    sf2Away: sanitizeTeam(body.sf2Away),
    finalHome: sanitizeTeam(body.finalHome),
    finalAway: sanitizeTeam(body.finalAway),
    bronzeHome: sanitizeTeam(body.bronzeHome),
    bronzeAway: sanitizeTeam(body.bronzeAway),
    champion: sanitizeTeam(body.champion),
  };

  const saveRes = await saveKnockoutPick(playerId, form);
  if (saveRes.error || !saveRes.data) {
    return NextResponse.json(
      { error: saveRes.error ?? "Save failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, pick: saveRes.data });
}
