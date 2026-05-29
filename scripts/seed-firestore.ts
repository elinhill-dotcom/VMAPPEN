/**
 * Seed matches into Firestore. Requires:
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_JSON
 * Run: npm run db:seed
 */
import { loadEnvFiles } from "./load-env";
import { cert, initializeApp } from "firebase-admin/app";

loadEnvFiles();
import { getFirestore } from "firebase-admin/firestore";
import { isFeaturedMatch } from "../src/lib/teams";
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
  const batch = db.batch();

  for (const m of MATCHES) {
    const homeTeam = toEnglishTeam(m.homeTeam);
    const awayTeam = toEnglishTeam(m.awayTeam);
    const ref = db.collection(COLLECTIONS.matches).doc(String(m.id));
    batch.set(
      ref,
      {
        id: m.id,
        match_number: m.matchNumber ?? null,
        day_label: m.dayLabel,
        kickoff_at: kickoffIso(m.date, m.time),
        home_team: homeTeam,
        away_team: awayTeam,
        group_code: m.groupCode ?? null,
        stage: m.stage,
        broadcaster: m.broadcaster ?? null,
        featured: isFeaturedMatch(homeTeam, awayTeam),
        home_score: null,
        away_score: null,
        finished: false,
      },
      { merge: true },
    );
  }

  batch.set(
    db.collection(COLLECTIONS.knockoutAnswer).doc("config"),
    { id: 1, set: false },
    { merge: true },
  );

  await batch.commit();
  console.log(`Seeded ${MATCHES.length} matches into Firestore.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
