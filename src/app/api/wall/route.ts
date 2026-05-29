import { NextRequest, NextResponse } from "next/server";
import { createWallComment, fetchWallComments } from "@/lib/firestore-wall";
import { isFirestoreConfigured } from "@/lib/firestore";

const MAX_MESSAGE = 500;
const MAX_NAME = 80;
const MIN_NAME = 2;

export async function GET() {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
      { status: 503 },
    );
  }

  const res = await fetchWallComments();
  if (res.error) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  return NextResponse.json({ comments: res.data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: "Firestore är inte konfigurerad." },
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

  return NextResponse.json({ comment: res.data }, { status: 201 });
}
