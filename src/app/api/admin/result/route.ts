import { clearMatchResult, getFirestoreConfigError, isFirestoreConfigured, updateMatchResult } from "@/lib/firestore";
import { CACHE_KEYS, invalidateApiCache } from "@/lib/api-cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { GROUP_MATCH_IDS } from "@/lib/matches-data";

const validGroupIds = new Set(GROUP_MATCH_IDS);

function invalidateResultCaches() {
  invalidateApiCache(
    CACHE_KEYS.leaderboard,
    CACHE_KEYS.stats,
    CACHE_KEYS.matches,
  );
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
  const matchId = Number(body.matchId);

  if (!validGroupIds.has(matchId)) {
    return NextResponse.json({ error: "Invalid match" }, { status: 400 });
  }

  if (body.clear === true || body.action === "clear") {
    const res = await clearMatchResult(matchId);
    if (res.error || !res.data) {
      return NextResponse.json(
        { error: res.error ?? "Clear failed" },
        { status: 500 },
      );
    }
    invalidateResultCaches();
    return NextResponse.json({ match: res.data });
  }

  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);
  const finished = body.finished !== false;

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  const res = await updateMatchResult(matchId, homeScore, awayScore, finished);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Update failed" },
      { status: 500 },
    );
  }

  invalidateResultCaches();
  return NextResponse.json({ match: res.data });
}
