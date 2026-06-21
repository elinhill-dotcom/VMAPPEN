import { loadMatchPlayerTips } from "@/lib/match-tips";
import { predictionsLocked, PICKS_HIDDEN_MESSAGE } from "@/lib/config";
import {
  READ_HEAVY_CACHE_HEADERS,
  withApiCache,
} from "@/lib/api-cache";
import { fetchMatchById, getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { NextRequest, NextResponse } from "next/server";

type RouteCtx = { params: Promise<{ matchId: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  if (!predictionsLocked()) {
    return NextResponse.json(
      { error: PICKS_HIDDEN_MESSAGE, locked: false },
      { status: 403 },
    );
  }

  const { matchId: raw } = await ctx.params;
  const matchId = Number(raw);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "Ogiltig match" }, { status: 400 });
  }

  const matchRes = await fetchMatchById(matchId);
  if (matchRes.error) {
    return NextResponse.json({ error: matchRes.error }, { status: 500 });
  }
  if (!matchRes.data) {
    return NextResponse.json({ error: "Matchen hittades inte" }, { status: 404 });
  }

  const res = await withApiCache(
    `match-tips:${matchId}`,
    () => loadMatchPlayerTips(matchId),
    60_000,
  );

  if (res.error || !res.data) {
    const status = /kvoten är slut/i.test(res.error ?? "") ? 429 : 500;
    return NextResponse.json(
      { error: res.error ?? "Kunde inte ladda tips" },
      { status },
    );
  }

  return NextResponse.json(
    { tips: res.data },
    { headers: READ_HEAVY_CACHE_HEADERS },
  );
}
