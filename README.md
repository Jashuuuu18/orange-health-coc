# Orange Health — Code of Conduct Dashboard

Read-only dashboard for Operations and Emedics to track Code of Conduct (COC)
points. Violation data lives in a Google Sheet that Ops edits directly, and
policy/penalty-point content lives in a Google Slides deck — this app never
writes to either. Auth and role/Employee-ID mapping are backed by Firebase.

**Live**: [orange-health-coc.vercel.app](https://orange-health-coc.vercel.app)
**Repo**: [github.com/Jashuuuu18/orange-health-coc](https://github.com/Jashuuuu18/orange-health-coc)

## Stack

- Next.js 16 (App Router, Turbopack) + Tailwind CSS v4
- Firebase Authentication (client) + Firebase Admin SDK (server session cookies + Firestore role/Employee-ID store)
- Google Sheets API (COC-Points tracker) + Google Slides API (Code of Conduct / penalty-points policy deck), both read-only
- Deploy target: Vercel (auto-deploys on push to `main`)

## One-time setup

### 1. Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Authentication → Get started** → enable **Email/Password** sign-in.
3. **Firestore Database → Create database** → **Production mode** (any region). The app only ever touches Firestore via the Admin SDK on the server, so leave the default (locked) rules — client-side Firestore access is never used.
4. **Project settings → General → Your apps → Add app (Web `</>`)** → copy the `firebaseConfig` values into `.env.local` as `NEXT_PUBLIC_FIREBASE_*`.
5. **Project settings → Service accounts → Generate new private key** → downloads a JSON file. Fill `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` escapes, wrap in quotes) from that file into `.env.local`. Do not commit this file — and if it's ever pasted somewhere it shouldn't be (chat, a doc, etc.), rotate it: generate a new key, update the env vars, then delete the old key at [console.cloud.google.com/iam-admin/serviceaccounts](https://console.cloud.google.com/iam-admin/serviceaccounts).

### 2. Google Sheets + Slides access

No separate service account needed — the Firebase Admin service account from step 1 is a regular Google Cloud service account, so it's reused for both:

1. [console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library) (same project as the Firebase project) → search **Google Sheets API** → Enable. Repeat for **Google Slides API**.
2. Open the COC-Points Google Sheet → **Share** → add `FIREBASE_ADMIN_CLIENT_EMAIL` as **Viewer**.
3. Open the Code of Conduct Google Slides deck → **Share** → add the same email as **Viewer**.
4. Set `GOOGLE_SHEETS_SPREADSHEET_ID` and `GOOGLE_SLIDES_PRESENTATION_ID` in `.env.local` (the ID is the string in each doc's URL between `/d/` and `/edit`).
5. Confirm `GOOGLE_SHEETS_COC_POINTS_TAB` matches the sheet's tab name exactly.

### 3. Admin access

There's no separate "make someone an admin" UI — it's allowlist-based:

1. Add the Ops team's emails to `ADMIN_EMAIL_ALLOWLIST` in `.env.local` (comma-separated).
2. Each person visits `/login/admin` and uses **"First time? Create an admin account"** once with their allow-listed email — this both creates their Firebase Auth account and marks them `role: admin` in Firestore. After that they just sign in normally.
3. To revoke admin access, remove the email from the allowlist and redeploy (existing sessions still work until they expire, up to 14 days; delete their Firestore `users/{uid}` doc to cut access immediately).

New sign-ups (admin or employee) are also restricted to the `ALLOWED_EMAIL_DOMAIN` (defaults to `orangehealth.in`) — enforced server-side, existing accounts signing in are unaffected.

### 4. Employee access

Employees self-sign-up at `/login/employee`: they enter their **Employee ID**
and email. There's no separate employee roster sheet, so any well-formed
Employee ID is accepted at sign-up (an ID with zero rows in COC-Points can't
be told apart from a made-up one without one) — if they do have violations on
record, their name gets pulled in automatically; if not, they're treated as a
zero-points employee. The Employee ID is permanently tied to their account in
Firestore at that point — never read from client input again after signup —
so an employee can never switch which record they see, and re-checking an ID
doesn't change anyone's assignment.

If ID-squatting (someone signing up with a real coworker's Employee ID before
that coworker does) becomes a real problem, the fix is adding an actual
employee roster sheet/tab and checking against that instead of accepting any
ID, in `employeeIdExists` in `src/lib/sheets/coc-points.ts`.

### 5. Run it

```bash
cp .env.local.example .env.local   # fill in the values from steps 1–3
npm install
npm run dev
```

## Data mapping

### COC-Points (violations tracker)

`src/lib/sheets/parse.ts` maps sheet columns by **header name** (case/spacing
insensitive, with a few common aliases) rather than fixed column letters, so
minor header edits in the sheet won't break parsing. If a required column
truly goes missing or gets renamed to something not in the alias list, the
app throws a clear error naming exactly which column is missing and what
headers it did find — extend the alias arrays in that file if that happens.

Expected columns: Employee ID, Employee Name, Role, Date, Violation, Points, Remarks.

Dates are parsed leniently (`YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`); an
unparseable date falls back to showing the sheet's raw text so nothing is
silently dropped.

### Code of Conduct / Penalty Points (Slides deck)

`src/lib/slides/parse.ts` walks every slide in the deck and pulls out every
**table** it finds (paired with that slide's title and any other text on the
slide as freeform notes) — it doesn't try to render the deck's full narrative
content, just the tabular violation → points data. New tables added to the
deck show up automatically on `/code-of-conduct` and `/penalty-points`
without a code change. If a slide's title or notes don't come through as
expected, check `src/lib/slides/parse.ts` — the title is guessed from the
slide's TITLE placeholder, falling back to the topmost text box.

Both Sheets and Slides reads are cached in-memory (15s / 60s respectively)
per server instance to avoid hammering the APIs — data is never more than
that far behind what's in the source.

## Deploying to Vercel

Already set up: pushing to `main` on GitHub auto-deploys via Vercel's Git integration. To do it from scratch on a new project:

1. Push this repo to GitHub, import it in Vercel (or `vercel link`).
2. Add every variable from `.env.local` as a Vercel environment variable (Production + Preview) under Project → Settings → Environment Variables.
3. `NEXT_PUBLIC_*` variables are baked in at **build time** — changing one in Vercel requires a fresh deploy to take effect, not just a save.
4. Deploy (`vercel --prod`, or it happens automatically on push).
