import { fetchChatSchedule, isFirestoreConfigured } from "@/lib/firestore";
import { getChatWindow } from "@/lib/match-live";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json({ live: [], upcoming: [], count: 0 });
  }

  const res = await fetchChatSchedule();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Failed to load live matches" },
      { status: 500 },
    );
  }

  const upcoming = res.data.upcoming.map((m) => {
    const { opensAt } = getChatWindow(m.kickoffAt);
    return {
      ...m,
      chatOpensAt: new Date(opensAt).toISOString(),
    };
  });

  return NextResponse.json({
    live: res.data.live,
    upcoming,
    count: res.data.live.length,
  });
}
