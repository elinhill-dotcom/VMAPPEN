# VM 2026 — Kontorspool

Tippa gruppmatcher och slutspel för Fotbolls-VM 2026. Svenskt gränssnitt, svenska flaggfärger, Firestore som databas.

## Kom igång

1. Skapa ett [Firebase-projekt](https://console.firebase.google.com/) och aktivera **Firestore**.
2. Kopiera `.env.example` till `.env.local` och fyll i:
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (hela JSON från Service accounts → Generate new private key)
   - `ADMIN_PASSWORD`
3. Publicera regler och index:
   ```bash
   firebase deploy --only firestore
   ```
   (eller klistra in `firestore.rules` manuellt i Firebase Console)
4. Seed matcher:
   ```bash
   npm install
   npm run db:seed
   ```
5. Starta appen:
   ```bash
   npm run dev
   ```

## Funktioner

- **Ingen inloggning** — spelare anger namn, sparas i `localStorage` (`vmapp_player`)
- **Grupptips** — 72 matcher
- **Slutspel** — semifinal, final, brons, mästare (9 val)
- **Topplista** — poäng och pott (100 kr per deltagare)
- **Livechatt** — öppen 15 min före till 2 h efter avspark
- **Hejaropps vägg** — kommentarer vid topplistan
- **Admin** — resultat, slutspelssvar, spelare

## Teknik

- Next.js 15, React 19, Tailwind 4
- Firestore (firebase + firebase-admin)
- Realtid i chatten via Firestore `onSnapshot`
