/**
 * Update r16 team names in Firestore without resetting scores.
 * Run: npm run db:patch-r16
 */
import { loadEnvFiles } from "./load-env";
import { cert, initializeApp } from "firebase-admin/app";

loadEnvFiles();
import { getFirestore } from "firebase-admin/firestore";
import { toEnglishTeam } from "../src/lib/team-names";
import { COLLECTIONS } from "../src/lib/firestore";
import { kickoffIso, MATCHES } from "../src/lib/matches-data";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const sa = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!projectId || !sa) {
  console.error(
    "Set NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_JSON",
  );
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(sa) as Record<string, string>),
  projectId,
});

const db = getFirestore();

async function main() {
  const r16 = MATCHES.filter((m) => m.stage === "r16");
  const batch = db.batch();

  for (const m of r16) {
    const ref = db.collection(COLLECTIONS.matches).doc(String(m.id));
    batch.set(
      ref,
      {
        home_team: toEnglishTeam(m.homeTeam),
        away_team: toEnglishTeam(m.awayTeam),
        kickoff_at: kickoffIso(m.date, m.time),
      },
      { merge: true },
    );
  }

  await batch.commit();
  console.log(`Updated ${r16.length} r16 matches with team names.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
