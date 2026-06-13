import {
  clearPlayerMatchPick,
  clearPlayerPicks,
  createPlayerByName,
  deletePlayer,
  fetchAdminPlayers,
  findPlayerById,
  getFirestoreConfigError,
  isFirestoreConfigured,
  isPlayerNameTaken,
  renamePlayer,
  saveAdminPlayerPrediction,
  setPlayerPicksUnlocked,
} from "@/lib/firestore";
import { CACHE_KEYS, invalidateApiCache } from "@/lib/api-cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { predictionsLocked } from "@/lib/config";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
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
      { error: getFirestoreConfigError() },
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
      { error: "Namnet är redan taget." },
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
      { error: getFirestoreConfigError() },
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

  invalidateApiCache(CACHE_KEYS.leaderboard, CACHE_KEYS.stats);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const body = await req.json();
  const action = body.action as string | undefined;

  if (action === "create-player") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const res = await createPlayerByName(name);
    if (res.error || !res.data) {
      return NextResponse.json(
        { error: res.error ?? "Kunde inte skapa spelare" },
        { status: res.error?.includes("taget") ? 409 : 400 },
      );
    }
    invalidateApiCache(CACHE_KEYS.leaderboard, CACHE_KEYS.stats);
    return NextResponse.json({ player: res.data }, { status: 201 });
  }

  if (action === "unlock-picks") {
    const playerId = body.playerId as string | undefined;
    const unlocked = body.unlocked === true;
    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }
    const res = await setPlayerPicksUnlocked(playerId, unlocked);
    if (res.error || !res.data) {
      return NextResponse.json(
        { error: res.error ?? "Kunde inte uppdatera" },
        { status: 404 },
      );
    }
    return NextResponse.json({ player: res.data });
  }

  if (action === "set-match-pick") {
    const playerId = body.playerId as string | undefined;
    const matchId = Number(body.matchId);
    const homeScore = Number(body.homeScore);
    const awayScore = Number(body.awayScore);
    if (!playerId || !Number.isInteger(matchId)) {
      return NextResponse.json({ error: "Ogiltig data" }, { status: 400 });
    }
    const playerRes = await findPlayerById(playerId);
    if (!playerRes.data) {
      return NextResponse.json({ error: "Spelaren hittades inte." }, { status: 404 });
    }
    const res = await saveAdminPlayerPrediction(
      playerId,
      matchId,
      homeScore,
      awayScore,
    );
    if (res.error || !res.data) {
      return NextResponse.json(
        { error: res.error ?? "Kunde inte spara tips" },
        { status: 400 },
      );
    }
    invalidateApiCache(CACHE_KEYS.leaderboard, CACHE_KEYS.stats);
    return NextResponse.json({ prediction: res.data });
  }

  if (action === "clear-match-pick") {
    const playerId = body.playerId as string | undefined;
    const matchId = Number(body.matchId);
    if (!playerId || !Number.isInteger(matchId)) {
      return NextResponse.json({ error: "Ogiltig data" }, { status: 400 });
    }
    const res = await clearPlayerMatchPick(playerId, matchId);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 500 });
    }
    invalidateApiCache(CACHE_KEYS.leaderboard, CACHE_KEYS.stats);
    return NextResponse.json({ ok: true });
  }

  if (action === "clear-picks") {
    const playerId = body.playerId as string | undefined;
    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
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

    invalidateApiCache(CACHE_KEYS.leaderboard, CACHE_KEYS.stats);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
