import { env } from '@/lib/env'
import { getSheetValues } from './client'
import { buildColumnIndex, toNumber, toText } from './parse'
import type { SlideTableSection } from '@/lib/slides/parse'

type Field = 'violation' | 'points' | 'description'

const ALIASES: Record<Field, string[]> = {
  violation: ['violationname', 'violation', 'name', 'cocviolation'],
  points: ['penaltypoints', 'points', 'penalty', 'pointvalue'],
  description: ['description', 'details', 'policy', 'policydetails', 'info', 'notes'],
}

const TTL_MS = 60_000
let cache: { data: SlideTableSection; expires: number } | null = null

async function fetchMasterSection(): Promise<SlideTableSection> {
  const rows = await getSheetValues(env.sheets.masterTab())
  if (rows.length === 0) {
    return { slideTitle: 'Code of Conduct', headers: [], rows: [], notes: [] }
  }

  const [headerRow, ...dataRows] = rows
  const col = buildColumnIndex(headerRow, ALIASES, 'Master')

  const parsedRows = dataRows
    .filter((row) => row.some((cell) => toText(cell) !== ''))
    .map((row) => [toText(row[col.violation]), String(toNumber(row[col.points])), toText(row[col.description])])
    .filter((r) => r[0] !== '')

  return {
    slideTitle: 'Code of Conduct',
    headers: ['Violation', 'Points', 'Description'],
    rows: parsedRows,
    notes: [],
  }
}

export async function getMasterSection(): Promise<SlideTableSection> {
  if (cache && cache.expires > Date.now()) return cache.data
  const data = await fetchMasterSection()
  cache = { data, expires: Date.now() + TTL_MS }
  return data
}
