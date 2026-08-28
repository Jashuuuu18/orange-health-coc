# Orange Health COC Dashboard — Full Handoff

Self-contained summary of this project: what it is, how it's built, every link needed to access it, and everything discovered/decided while building and deploying it. Written so it can be pasted into a new conversation (with an AI or a person) and give them everything needed to continue without access to the original build session.

## Quick links

| What | Link |
|---|---|
| **Live app** | https://orange-health-coc.vercel.app |
| GitHub repo | https://github.com/Jashuuuu18/orange-health-coc |
| Vercel project dashboard | https://vercel.com/jaswanthbavigadda01-1149s-projects/orange-health-coc |
| Firebase console | https://console.firebase.google.com/project/orange-health-coc/overview |
| Google Cloud console (same project) | https://console.cloud.google.com/home/dashboard?project=orange-health-coc |
| COC-Points + Master Google Sheet | https://docs.google.com/spreadsheets/d/1wghoryB83b_wFc9cA96Cm68Zv3PpnuwNHTJMxxiu8LM/edit |
| Penalty Points Google Slides deck | https://docs.google.com/presentation/d/1yMJoNwQzBYj6qHYae_HOAmL9wjNCHTGYzDBlzlHYn9c/edit |
| Admin login | https://orange-health-coc.vercel.app/login/admin |
| Employee login | https://orange-health-coc.vercel.app/login/employee |

**Service account email** (has Viewer access to the Sheet and Slides deck; also the Firebase Admin credential): `firebase-adminsdk-fbsvc@orange-health-coc.iam.gserviceaccount.com`

**Admin allowlist** (who can sign in as Admin): `sai.jaswanth@orangehealth.in`, `surya.k@orangehealth.in`, `chetan.gupta@orangehealth.in`

**Google Cloud project owners** (IAM Owner role, i.e. who can enable APIs / manage the project itself): `sai.jaswanth@orangehealth.in`, plus whichever personal/work Google account was originally used to create the Firebase project (see "Infrastructure gotchas" below — this took real effort to sort out).

## What it is

A read-only web dashboard for Orange Health's Operations team and Emedics (field agents) to track Code of Conduct violations and points. Ops keeps updating a Google Sheet by hand exactly as before; the app only ever reads from it, never writes back.

### Pages

- **`/admin/dashboard`** — Admin-only. Summary cards (Total Employees, Total Violations, Total Points, Highest Points Holder, Most Common Violation, Recent Violations), a filterable/sortable/paginated table of every violation (search by ID/name, filter by role/violation/date range), a "By Employee" tab with running totals, and CSV export. All live from the **COC-Points** tab of the Google Sheet above.
- **`/employee/dashboard`** — Employee-only. Shows only *their own* record: name, Employee ID, role, total points, total violations, and a searchable/sortable/paginated history table. Structurally impossible for one employee to see another's data (see Auth model below).
- **`/code-of-conduct`** — Any logged-in user. Reads the **Master** tab of the same spreadsheet, which has an unusual two-tables-side-by-side layout (see "Decisions" below) — renders as two sections, "CT SOP Violations" and "Behavioural Violations".
- **`/penalty-points`** — Any logged-in user. A focused violation → points lookup table. Currently backed by manually-transcribed static content (kept in sync by editing a code file whenever the source changes), merged with any real tables found in the Slides deck above (currently none — see "Decisions").
- **`/login`, `/login/admin`, `/login/employee`** — public. Role chooser, then role-specific sign-in/sign-up forms, each with a "Forgot password?" link.

## Tech stack

- **Next.js 16** (App Router, Turbopack bundler) + React 19 + TypeScript + Tailwind CSS v4
- **Firebase Authentication** (client SDK) for login; **Firebase Admin SDK** (server-side) for verifying sessions and managing Firestore
- **Firestore** stores only `users/{uid}` docs — `{ email, role, employeeId, name, createdAt }`. Never touched from the browser directly, only via the Admin SDK on the server, so its security rules are left at their default-locked state.
- **Google Sheets API** — reads the COC-Points and Master tabs
- **Google Slides API** — reads the Penalty Points deck
- **Vercel** — hosting, auto-deploys on every push to `main` via a connected GitHub integration
- **GitHub** — source control, public repo

## Auth model (how access control actually works)

- **Admin**: gated by an email allowlist (`ADMIN_EMAIL_ALLOWLIST` env var). A first-time sign-up with an allow-listed `@orangehealth.in` email creates their Firebase Auth account *and* writes `role: admin` to their Firestore doc, in the same server-side request (never trusting the client to say "I'm an admin"). After that, they just sign in normally.
- **Employee**: self-service sign-up with their **Employee ID**. There is no separate employee roster sheet, so the app can't verify an ID belongs to a specific real person — it just checks whether that ID has any rows in COC-Points to pull a name from, and if not, creates the account anyway as a zero-points employee. Once created, that Employee ID is permanently written to Firestore and *never re-read from client input again* on subsequent logins — meaning even if someone tried, they can't switch which record they're viewing after their first sign-up.
- **New sign-ups only** (not existing sign-ins) are restricted to `@orangehealth.in` emails, enforced server-side (`ALLOWED_EMAIL_DOMAIN` env var, defaults to `orangehealth.in`).
- **Sessions**: httpOnly, 14-day, signed cookie created via Firebase Admin's `createSessionCookie`. Route protection happens at two layers — a lightweight `proxy.ts` (Next.js's replacement for `middleware.ts` as of v16) redirects logged-out visitors before rendering, and each protected layout separately calls `requireAdmin()` / `requireEmployee()` / `requireUser()` server-side, which is the layer that's actually enforced (per Next.js's own guidance not to rely on proxy/middleware alone for security).
- **Forgot password**: both login pages call Firebase's built-in `sendPasswordResetEmail`. Deliberately shows the same "if an account exists..." message whether or not the email actually has an account, to avoid leaking who's registered. **Known issue**: these emails currently land in spam for `orangehealth.in` recipients, because Firebase's default sender (`noreply@orange-health-coc.firebaseapp.com`) is unfamiliar to Google Workspace's filters. Feature itself works; just tell people to check spam, or fix later via Firebase Console → Authentication → Templates → custom SMTP/sender verification.

## Decisions made (and why)

1. **No employee roster verification** — accepted risk. The only data source is COC-Points (violations), so an employee with a clean record has no row to verify against. Rather than block clean employees from ever signing up, any well-formed Employee ID is accepted. Trade-off: someone could theoretically sign up with a real coworker's unused ID before that coworker does. Fix if it ever matters: add a roster sheet/tab and check against that in `employeeIdExists()` (`src/lib/sheets/coc-points.ts`).
2. **Penalty Points page is a hybrid, not purely live** — originally meant to read a real Slides table live. In practice: (a) the first deck linked turned out to have the content as a flattened *image* (screenshot pasted onto a slide), which the Slides API cannot OCR or extract structured data from — only real native tables/text; (b) even after switching to a fresh deck and asking Ops to build a real `Insert → Table`, that proved too much manual friction. Landed on: a static, manually-transcribed table (`src/lib/policy/static-tables.ts`) that's always shown, *merged* with whatever real tables the Slides API does find (currently zero, but harmless — if a real table is ever added to the deck, it'll appear automatically alongside the static one). **To update this content: send a screenshot of the new/changed table to whoever's maintaining the code, and have them edit that one file** — a few lines, no other changes needed.
3. **Master sheet has an unusual two-block layout** — not a single flat table. The actual header row is: `SN | CT SOP Violation | Type of Issue | Penalty | (blank) | SN | Behavioural Violation | Type of Issue | Penalty` — i.e. two independent violation tables placed side-by-side in the same sheet. The parser (`src/lib/sheets/master.ts`) locates each block by finding its violation-name column, then reads the three columns immediately after it as Violation / Type of Issue / Penalty. If Ops ever restructures this sheet (adds a third block, renames these exact header strings, reorders columns within a block), that file needs a matching update.
4. **Date parsing handles multiple real-world formats** seen in the sheet: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, and `D - Mon - YY` (e.g. `7 - Aug - 26`, discovered when a specific employee's row broke the "Last Violation" summary column because it fell through every other pattern).
5. **No separate Google Sheets/Slides service account** — reuses the Firebase Admin service account credentials, since a Firebase project's service account is a normal Google Cloud service account under the hood. Simpler to manage one credential instead of two; just needed the Sheets API and Slides API individually enabled on the same Google Cloud project, and the actual Sheet/Slides documents shared with that service account's email as Viewer.
6. **Sign-up domain restriction** (`@orangehealth.in` only) was added specifically to stop random people from creating Admin or Employee accounts even if they somehow knew a valid Employee ID or got past the allowlist check some other way — a defense-in-depth layer, not the primary access control.

## Infrastructure gotchas hit during setup (read before debugging blind)

These caused most of the actual time spent — worth knowing before repeating the same debugging:

1. **`jose` package CJS/ESM incompatibility**: `firebase-admin` depends on `jwks-rsa`, which does `require('jose')` — but the `jose` version that resolved (v6) dropped CommonJS support entirely (ESM-only). This built fine locally and on Vercel, but crashed *at runtime* on every request touching `firebase-admin` with `ERR_REQUIRE_ESM`, specifically under Turbopack's external-module-loading shim. Fixed with an npm `overrides` entry pinning `jose` to `^4.15.5` (last version with real CJS support, same API surface `jwks-rsa` needs) in `package.json`.
2. **`NEXT_PUBLIC_*` environment variables are baked in at build time**, not read live. Editing one in Vercel's dashboard does nothing to the live site until a fresh deployment runs.
3. **Pasted env var values picked up invisible corruption multiple times**: a trailing space on `FIREBASE_ADMIN_PROJECT_ID` caused a Firebase token "aud" (audience) mismatch error; an earlier `FIREBASE_ADMIN_PRIVATE_KEY` paste accidentally included literal wrapping quote characters as part of the value (they were meant as `.env`-*file* syntax, not something to type into a web form's Value field), which broke PEM parsing with a cryptic OpenSSL "DECODER routines::unsupported" error. Lesson: paste the raw value only into Vercel's Value field, never wrap it in quotes there.
4. **"Google Sheets/Slides API has not been used in project..." (403)** means the API needs enabling per-Google-Cloud-project at `console.cloud.google.com/apis/library`. This is separate from sharing the specific document — both are required: (a) enable the API on the project once, (b) share each individual Sheet/Slides file with the service account's email as Viewer.
5. **Multiple Google accounts caused real confusion**: the account used inside Firebase Console (which can manage Auth, Firestore, and generate service-account keys just fine) did *not* automatically have full Google Cloud IAM access — enabling APIs via the raw Cloud Console API Library requires the broader `resourcemanager.projects.get` permission, which turned out to belong to a *different* Google account (whichever one was active in the browser at the exact moment the Firebase project was first created). Fixed by finding that other account (checked via `console.cloud.google.com/apis/library` → "Select a project" → seeing which account's project list actually contained `orange-health-coc`) and granting the primary work account (`sai.jaswanth@orangehealth.in`) the **Owner** IAM role from there, so future work doesn't need account-switching.
6. **`vercel env pull` refuses to return real values for anything marked "Sensitive"** — it substitutes a literal `[SENSITIVE]` placeholder string, even for the project owner. Any verification of live credential values has to happen by testing the actual deployed behavior (e.g., hitting a real endpoint and reading server logs), not by pulling env vars locally.
7. A service-account private key was accidentally pasted into a chat session once during setup — treated as compromised and rotated immediately afterward (generated a fresh key in Firebase Console, updated the env vars, deleted the old key's ID in Google Cloud IAM). Worth periodically checking `console.cloud.google.com/iam-admin/serviceaccounts` → the `firebase-adminsdk-fbsvc@...` account → **Keys** tab to confirm no other stray/old keys are still active.
8. **Vercel deploys are fast, not slow** — every deploy this session went live in roughly 30–90 seconds after triggering. Any apparent "delay" was actually a misconfigured env var causing a real error, not a hosting propagation lag. `NEXT_PUBLIC_*` changes need a fresh deploy to take effect (see #2); everything else takes effect on the very next request once redeployed.
9. **Environment variable changes never auto-deploy** — only pushing code to `main` on GitHub triggers Vercel's automatic deploy. If someone edits an env var directly in the Vercel dashboard, a deploy has to be triggered manually afterward (Vercel dashboard → Deployments → "⋯" on the latest → Redeploy, or `vercel --prod` from a machine with the Vercel CLI logged in).

## Environment variables reference

All of these are set in Vercel under Project Settings → Environment Variables (Production + Preview). A `.env.local.example` in the repo documents the same list for local development.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config (client-safe) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ″ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ″ (= `orange-health-coc`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ″ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ″ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ″ |
| `FIREBASE_ADMIN_PROJECT_ID` | Server-side Admin SDK + reused for Sheets/Slides auth (= `orange-health-coc`, no trailing space!) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email, same one shared on the Sheet/Slides docs |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account private key (rotate if ever exposed) |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | `1wghoryB83b_wFc9cA96Cm68Zv3PpnuwNHTJMxxiu8LM` |
| `GOOGLE_SHEETS_COC_POINTS_TAB` | `COC-Points (Since 21st July 2026)` |
| `GOOGLE_SHEETS_MASTER_TAB` | `Master` |
| `GOOGLE_SLIDES_PRESENTATION_ID` | `1yMJoNwQzBYj6qHYae_HOAmL9wjNCHTGYzDBlzlHYn9c` |
| `ADMIN_EMAIL_ALLOWLIST` | Comma-separated, no spaces: currently 3 emails (see Quick Links) |
| `ALLOWED_EMAIL_DOMAIN` | `orangehealth.in` |

## Current status

As of the end of this build session: the app is **live and functioning end-to-end** — admin login/signup works, the Admin Dashboard shows real live COC-Points data (verified against the actual sheet), the Code of Conduct page reads both blocks of the Master sheet correctly, and the Penalty Points page shows the static table. Three admins are on the allowlist. Forgot-password works (mind the spam folder). No known blocking bugs remain; see "Open items" below for lower-priority follow-ups.

## Open items / possible follow-ups

- **Employee roster sheet** — only worth building if ID-squatting turns out to be a real problem in practice (see Decisions #1).
- **Real Slides-based Penalty Points sync** — dormant. Would need someone to actually build native tables in the deck (Insert → Table, typed directly into cells, not a pasted image) for the live path to ever return real data; static content is the reliable path until/unless that happens.
- **Password reset email deliverability** — cosmetic; landing in spam isn't broken, but a custom sender/SMTP setup in Firebase would fix it properly.
- **No admin UI for managing the allowlist** — it's a Vercel env var today, edited by hand. Could build a proper admin-managed list in Firestore later if this needs to change often.
