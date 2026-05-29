export type DbResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function isFirestoreConfigured(): boolean {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return false;
  if (typeof window !== "undefined") {
    return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  }
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

export function toErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message);
  }
  return "Något gick fel";
}
