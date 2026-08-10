import { google } from 'googleapis'
import { env } from '@/lib/env'

// Shared across Sheets (COC-Points tracker) and Slides (Code of Conduct
// policy deck) — same service account, both scopes granted up front so one
// GoogleAuth instance covers both APIs.
let authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null

export function getGoogleAuth() {
  if (!authClient) {
    authClient = new google.auth.GoogleAuth({
      keyFile: env.sheets.keyFilePath(),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/presentations.readonly',
      ],
    })
  }
  return authClient
}
