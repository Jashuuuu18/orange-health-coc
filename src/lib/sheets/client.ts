import { google } from 'googleapis'
import { env } from '@/lib/env'
import { getGoogleAuth } from '@/lib/google/auth'

// Temporary diagnostic: per-tab shape summary (headers, row count, latest date)
// with no employee data.
export async function summarizeAllTabs(
  parseDate: (raw: string) => string | null
): Promise<string[]> {
  const sheets = google.sheets({ version: 'v4', auth: getGoogleAuth() })
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: env.sheets.spreadsheetId(),
    fields: 'sheets.properties.title',
  })
  const titles = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? '')
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: env.sheets.spreadsheetId(),
    ranges: titles.map((t) => `'${t.replace(/'/g, "''")}'`),
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  return (res.data.valueRanges ?? []).map((vr, i) => {
    const rows = (vr.values ?? []) as unknown[][]
    const header = (rows[0] ?? []).map((h) => String(h).trim())
    const dateCol = header.findIndex((h) => /date/i.test(h))
    let maxDate = ''
    if (dateCol !== -1) {
      for (const r of rows.slice(1)) {
        const d = parseDate(String(r[dateCol] ?? ''))
        if (d && d > maxDate) maxDate = d
      }
    }
    return `[${titles[i]}] rows=${rows.length} maxDate=${maxDate || 'n/a'} header=${JSON.stringify(header)}`
  })
}

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
