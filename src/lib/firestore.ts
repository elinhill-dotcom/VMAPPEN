/** Re-exports for API routes. Client code should import firestore-client / firestore-shared directly. */
export {
  type DbResult,
  isFirestoreConfigured,
  toErrorMessage,
} from "@/lib/firestore-shared";
export { getFirestoreServer } from "@/lib/firestore-admin";
