import { google } from 'googleapis'
import { env } from '@/lib/env'
import { getGoogleAuth } from '@/lib/google/auth'

// Temporary diagnostic: which tabs exist in the workbook the app is reading.
export async function listSheetTabs(): Promise<string[]> {
  const sheets = google.sheets({ version: 'v4', auth: getGoogleAuth() })
  const res = await sheets.spreadsheets.get({
    spreadsheetId: env.sheets.spreadsheetId(),
    fields: 'properties.title,sheets.properties.title',
  })
  const tabs = (res.data.sheets ?? []).map((s) => s.properties?.title ?? '?')
  return [`workbook="${res.data.properties?.title}"`, ...tabs]
}

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
