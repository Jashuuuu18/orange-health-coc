function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.local.example to .env.local and fill it in.`
    )
  }
  return value
}

// NEXT_PUBLIC_ (client) Firebase config is read directly via static
// `process.env.NEXT_PUBLIC_X` references in lib/firebase/client.ts instead of
// through this module, so the bundler can statically inline it into the
// client bundle. Everything below is server-only.
export const env = {
  firebaseAdmin: {
    projectId: () => required('FIREBASE_ADMIN_PROJECT_ID'),
    clientEmail: () => required('FIREBASE_ADMIN_CLIENT_EMAIL'),
    privateKey: () => required('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },
  sheets: {
    keyFilePath: () => required('GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY_PATH'),
    spreadsheetId: () => required('GOOGLE_SHEETS_SPREADSHEET_ID'),
    cocPointsTab: () =>
      process.env.GOOGLE_SHEETS_COC_POINTS_TAB ?? 'COC-Points (Since 21st July 2026)',
    masterTab: () => process.env.GOOGLE_SHEETS_MASTER_TAB ?? 'Master',
  },
  adminAllowlist: (): string[] =>
    (process.env.ADMIN_EMAIL_ALLOWLIST ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  allowedEmailDomain: (): string =>
    (process.env.ALLOWED_EMAIL_DOMAIN ?? 'orangehealth.in').trim().toLowerCase(),
}
