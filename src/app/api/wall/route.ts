import { createWallComment, fetchWallComments, getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { CACHE_KEYS, invalidateApiCache, READ_HEAVY_CACHE_HEADERS, withApiCache } from "@/lib/api-cache";
import { NextRequest, NextResponse } from "next/server";

const MAX_MESSAGE = 500;
const MAX_NAME = 80;
const MIN_NAME = 2;

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const res = await withApiCache(CACHE_KEYS.wall, () => fetchWallComments(), 30_000);
  if (res.error) {
    const status = /kvoten är slut/i.test(res.error) ? 429 : 500;
    return NextResponse.json({ error: res.error }, { status });
  }

  return NextResponse.json(
    { comments: res.data ?? [] },
    { headers: READ_HEAVY_CACHE_HEADERS },
  );
}

export async function POST(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < MIN_NAME || name.length > MAX_NAME) {
    return NextResponse.json(
      { error: "Enter a name (2â€“80 characters)." },
      { status: 400 },
    );
  }
  if (message.length < 1 || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Comment must be 1â€“${MAX_MESSAGE} characters.` },
      { status: 400 },
    );
  }

  const res = await createWallComment(name, message);
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Could not post comment" },
      { status: 500 },
    );
  }

  invalidateApiCache(CACHE_KEYS.wall);

  return NextResponse.json({ comment: res.data }, { status: 201 });
}
