import { requireAdmin } from "@/lib/admin-auth";
import { fetchPicksExport } from "@/lib/export-picks-server";
import { getFirestoreConfigError, isFirestoreConfigured } from "@/lib/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  if (!isFirestoreConfigured()) {
    return NextResponse.json(
      { error: getFirestoreConfigError() },
      { status: 503 },
    );
  }

  const res = await fetchPicksExport();
  if (res.error || !res.data) {
    return NextResponse.json(
      { error: res.error ?? "Export failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ export: res.data });
}
