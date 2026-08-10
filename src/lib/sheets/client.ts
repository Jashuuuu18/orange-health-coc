import { google } from 'googleapis'
import { env } from '@/lib/env'
import { getGoogleAuth } from '@/lib/google/auth'

export async function getSheetValues(tabName: string): Promise<string[][]> {
  const sheets = google.sheets({ version: 'v4', auth: getGoogleAuth() })
  const range = `'${tabName.replace(/'/g, "''")}'`
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.sheets.spreadsheetId(),
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  return (res.data.values as string[][] | undefined) ?? []
}
