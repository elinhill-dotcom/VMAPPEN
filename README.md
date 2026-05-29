# VM 2026 — Familjetipset (SUPER VMAPP)

Tippa gruppmatcher och slutspel för Fotbolls-VM 2026. Svenskt gränssnitt, svenska flaggfärger, Firestore som databas.

## Kom igång

1. Skapa ett [Firebase-projekt](https://console.firebase.google.com/) och aktivera **Firestore**.
2. Kopiera `.env.example` till `.env` och fyll i alla `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON` (hela service account JSON på en rad) och `ADMIN_PASSWORD`.
3. **Vercel:** lägg samma variabler under Project → Settings → Environment Variables. Utan `FIREBASE_SERVICE_ACCOUNT_JSON` får du fel när någon ska gå med i tipset.
4. Firestore-kollektioner: `players`, `matches`, `predictions`, `chat_messages` (plus `knockout_picks`, `knockout_answer`, `wall_comments` för slutspel och vägg).
4. Publicera regler och index:
   ```bash
   firebase deploy --only firestore
   ```
   (eller klistra in `firestore.rules` manuellt i Firebase Console)
6. Seed matcher:
   ```bash
   npm install
   npm run db:seed
   ```
7. Starta appen:
   ```bash
   npm run dev
   ```

## Funktioner

- **Ingen inloggning** — spelare anger namn, sparas i `localStorage` (`vmapp_player`)
- **Grupptips** — 72 matcher
- **Slutspel** — semifinal, final, brons, mästare (9 val)
- **Topplista** — poäng för alla i familjen
- **Livechatt** — öppen 15 min före till 2 h efter avspark
- **Hejaropps vägg** — kommentarer vid topplistan
- **Admin** — resultat, slutspelssvar, spelare

## Teknik

- Next.js 15, React 19, Tailwind 4
- `src/lib/firebase.ts` — klientconfig + `onSnapshot` för livechatt
- `src/lib/firestore.ts` — server-CRUD (firebase-admin)
- Ingen auth — endast visningsnamn
