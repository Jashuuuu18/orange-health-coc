# Orange Health — Code of Conduct Dashboard

Read-only dashboard for Operations and Emedics to track Code of Conduct (COC)
points. Data lives in a Google Sheet that Ops edits directly; this app never
writes to it. Auth and role/Employee-ID mapping are backed by Firebase.

## Stack

- Next.js 16 (App Router, Turbopack) + Tailwind CSS v4
- Firebase Authentication (client) + Firebase Admin SDK (server session cookies + Firestore role/Employee-ID store)
- Google Sheets API (service account, read-only) as the single source of truth for COC data
- Deploy target: Vercel

## One-time setup

### 1. Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started** → enable **Email/Password** sign-in.
3. **Build → Firestore Database → Create database** → start in **Production mode** (any region). The app only ever touches Firestore via the Admin SDK on the server, so leave the default rules — client-side Firestore access is never used and should stay locked down.
4. **Project settings → General → Your apps → Add app (Web `</>`)** → copy the `firebaseConfig` values into `.env.local` as `NEXT_PUBLIC_FIREBASE_*`.
5. **Project settings → Service accounts → Generate new private key** → downloads a JSON file. Fill `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` escapes, wrap in quotes) from that file into `.env.local`. Do not commit this file.

### 2. Google Sheet access

1. In the same (or a separate) Google Cloud project, enable the **Google Sheets API** and create a **Service Account**.
2. Generate a JSON key for it and save it locally, e.g. `~/orange-health-coc/service-account.json` (already gitignored).
3. Open the target Google Sheet → **Share** → add the service account's `client_email` (from the JSON) as **Viewer**.
4. Set `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY_PATH` to that file's path and `GOOGLE_SHEETS_SPREADSHEET_ID` to the sheet ID (the string between `/d/` and `/edit` in the URL) in `.env.local`.
5. Confirm the tab names in `.env.local` (`GOOGLE_SHEETS_COC_POINTS_TAB`, `GOOGLE_SHEETS_MASTER_TAB`) match the sheet exactly.

### 3. Admin access

There's no separate "make someone an admin" UI — it's allowlist-based:

1. Add the Ops team's emails to `ADMIN_EMAIL_ALLOWLIST` in `.env.local` (comma-separated).
2. Each person visits `/login/admin` and uses **"First time? Create an admin account"** once with their allow-listed email — this both creates their Firebase Auth account and marks them `role: admin` in Firestore. After that they just sign in normally.
3. To revoke admin access, remove the email from the allowlist (existing sessions still work until they expire; delete their Firestore `users/{uid}` doc to fully cut access).

### 4. Employee access

Employees self-sign-up at `/login/employee`: they enter their **Employee ID**,
which is verified server-side against the distinct Employee IDs already
present in the COC-Points sheet before an account can be created. The
Employee ID is then permanently tied to their account in Firestore — it's
never read from client input again after signup, so an employee can never
switch which record they see.

**Known limitation:** because there's no separate employee roster sheet, an
employee with zero violations on record can't self-verify yet — they'll be
able to sign up as soon as Ops logs their first entry. If that's a problem in
practice, the fix is adding an Employee roster sheet/tab and switching
`employeeIdExists` in `src/lib/sheets/coc-points.ts` to check that instead.

### 5. Run it

```bash
cp .env.local.example .env.local   # fill in the values from steps 1–3
npm install
npm run dev
```

## Data mapping

`src/lib/sheets/parse.ts` maps sheet columns by **header name** (case/spacing
insensitive, with a few common aliases) rather than fixed column letters, so
minor header edits in the sheet won't break parsing. If a required column
truly goes missing or gets renamed to something not in the alias list, the
app throws a clear error naming exactly which column is missing and what
headers it did find — extend the alias arrays in that file if that happens.

Expected columns:

- **COC-Points sheet**: Employee ID, Employee Name, Role, Date, Violation, Points, Remarks
- **Master sheet**: Violation Name, Penalty Points, Description

Dates are parsed leniently (`YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`); an
unparseable date falls back to showing the sheet's raw text so nothing is
silently dropped.

**Temporary placeholder:** the Master tab is actually a multi-section policy
document (sections A–D), not a flat table — the flat parser above only
handles the violations table part of it. The "D. Penalty Point System"
section (its own Violation/Points/Penalty table + disciplinary thresholds)
is hardcoded in `src/lib/policy/penalty-points.ts` from a screenshot, and is
known to be incomplete (only 3 of the sheet's rows were visible). Once Sheets
API credentials are wired up, inspect the real Master tab layout and replace
that file with a proper parser for the full document.

Sheet reads are cached in-memory for 15s (COC-Points) / 60s (Master) per
server instance to avoid hammering the Sheets API — data is never more than
that far behind what's in the sheet.

## Deploying to Vercel

1. Push this repo to GitHub, import it in Vercel.
2. Add every variable from `.env.local` as a Vercel environment variable —
   **except** `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY_PATH`. Vercel's filesystem is
   ephemeral, so instead: base64-encode the service-account JSON
   (`base64 -i service-account.json`), store it as
   `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY_JSON_BASE64`, and adjust
   `src/lib/sheets/client.ts` to build `GoogleAuth({ credentials: JSON.parse(atob(...)) })`
   instead of `keyFile` when that variable is present. (Left as a follow-up —
   local/VM deploys with a real file on disk work as-is.)
3. Deploy.
