import { NextRequest, NextResponse } from "next/server";
import { getAdminPassword } from "@/lib/admin-auth";
import { verifyAdminPassword } from "@/lib/config";
import { isMatchLive } from "@/lib/match-live";
import { fetchMatchById } from "@/lib/firestore-matches";
import {
  insertChatMessage,
  loadChatMessages,
} from "@/lib/firestore-chat-server";
import { isFirestoreConfigured } from "@/lib/firestore-shared";

type RouteCtx = { params: Promise<{ matchId: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
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

  const since = req.nextUrl.searchParams.get("since") ?? undefined;
  const msgRes = await loadChatMessages(matchId, since);
  if (msgRes.error) {
    return NextResponse.json({ error: msgRes.error }, { status: 500 });
  }

  const match = matchRes.data;
  const adminTestMode = verifyAdminPassword(getAdminPassword(req));
  const live = adminTestMode || isMatchLive(match.kickoffAt);

  return NextResponse.json({
    match: {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      kickoffAt: match.kickoffAt,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      finished: match.finished,
      groupCode: match.groupCode,
      stage: match.stage,
    },
    live,
    adminTestMode,
    messages: msgRes.data ?? [],
  });
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const { matchId: raw } = await ctx.params;
  const matchId = Number(raw);
  if (!Number.isInteger(matchId)) {
    return NextResponse.json({ error: "Ogiltig match" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.message !== "string") {
    return NextResponse.json({ error: "Ogiltig begäran" }, { status: 400 });
  }

  const adminPassword = req.headers.get("x-admin-password") ?? "";
  const isAdmin = verifyAdminPassword(adminPassword);

  const res = await insertChatMessage(matchId, body.name, body.message, {
    skipLiveCheck: isAdmin,
  });
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Kunde inte skicka" },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: res.data });
}
