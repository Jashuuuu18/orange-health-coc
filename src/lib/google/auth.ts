import { google } from 'googleapis'
import { env } from '@/lib/env'

// Reuses the Firebase Admin service account (a regular Google Cloud service
// account under the hood) for Sheets + Slides access too, instead of a
// separate key file — one credential to manage, and it works the same in
// local dev and on Vercel (no filesystem key file to provision there).
// Requires: Sheets API + Slides API enabled on the Firebase project, and the
// target Sheet/Slides deck shared with FIREBASE_ADMIN_CLIENT_EMAIL as Viewer.
let authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null

export function getGoogleAuth() {
  if (!authClient) {
    authClient = new google.auth.GoogleAuth({
      credentials: {
        client_email: env.firebaseAdmin.clientEmail(),
        private_key: env.firebaseAdmin.privateKey(),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/presentations.readonly',
      ],
    })
  }
  return authClient
}
