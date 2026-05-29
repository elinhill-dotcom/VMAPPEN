import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { predictionsLocked } from "@/lib/config";
import {
  clearPlayerPicks,
} from "@/lib/firestore-predictions";
import {
  deletePlayer,
  fetchAdminPlayers,
  findPlayerById,
  isPlayerNameTaken,
  renamePlayer,
} from "@/lib/firestore-players";
import { isFirestoreConfigured } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const res = await fetchAdminPlayers();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load players" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    locked: predictionsLocked(),
    players: res.data,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const playerId = body.playerId as string | undefined;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!playerId || name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Invalid name or player" }, { status: 400 });
  }

  const takenRes = await isPlayerNameTaken(name, playerId);
  if (takenRes.error) {
    return NextResponse.json({ error: takenRes.error }, { status: 500 });
  }
  if (takenRes.data) {
    return NextResponse.json(
      { error: "That name is already taken." },
      { status: 409 },
    );
  }

  const res = await renamePlayer(playerId, name);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Player not found" },
      { status: res.error?.includes("not found") ? 404 : 500 },
    );
  }

  return NextResponse.json({ player: res.data });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const playerId = req.nextUrl.searchParams.get("playerId");

  if (typeof playerId !== "string" || !playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const res = await deletePlayer(playerId);
  if (res.error) {
    return NextResponse.json(
      { error: res.error },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const body = await req.json();
  if (body.action !== "clear-picks") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const playerId = body.playerId as string | undefined;
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  if (predictionsLocked()) {
    return NextResponse.json(
      { error: "Picks are locked â€” cannot clear picks after kickoff." },
      { status: 403 },
    );
  }

  const playerRes = await findPlayerById(playerId);
  if (playerRes.error) {
    return NextResponse.json({ error: playerRes.error }, { status: 500 });
  }
  if (!playerRes.data) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const clearRes = await clearPlayerPicks(playerId);
  if (clearRes.error) {
    return NextResponse.json({ error: clearRes.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
