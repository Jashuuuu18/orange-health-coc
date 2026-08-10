import { google } from 'googleapis'
import { env } from '@/lib/env'

// Use googleapis' own bundled google-auth-library so the GoogleAuth instance
// type matches what google.sheets() expects (a separately installed
// google-auth-library package can resolve to an incompatible nested version).
let authClient: InstanceType<typeof google.auth.GoogleAuth> | null = null

function getAuth() {
  if (!authClient) {
    authClient = new google.auth.GoogleAuth({
      keyFile: env.sheets.keyFilePath(),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
  }
  return authClient
}

export async function getSheetValues(tabName: string): Promise<string[][]> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const range = `'${tabName.replace(/'/g, "''")}'`
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.sheets.spreadsheetId(),
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  return (res.data.values as string[][] | undefined) ?? []
}
