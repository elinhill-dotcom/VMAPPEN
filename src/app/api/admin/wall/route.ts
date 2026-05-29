import { deleteWallComment, getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const commentId = req.nextUrl.searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  const res = await deleteWallComment(commentId);
  if (res.error) {
    return NextResponse.json(
      { error: res.error },
      { status: res.error.includes("not found") ? 404 : 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
