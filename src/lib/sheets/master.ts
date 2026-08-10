import { env } from '@/lib/env'
import type { MasterViolation } from '@/lib/types'
import { getSheetValues } from './client'
import { buildColumnIndex, toNumber, toText } from './parse'

type Field = 'violation' | 'points' | 'description'

const ALIASES: Record<Field, string[]> = {
  violation: ['violationname', 'violation', 'name', 'cocviolation'],
  points: ['penaltypoints', 'points', 'penalty', 'pointvalue'],
  description: ['description', 'details', 'policy', 'policydetails', 'info', 'notes'],
}

const TTL_MS = 60_000
let cache: { data: MasterViolation[]; expires: number } | null = null

async function fetchMasterViolations(): Promise<MasterViolation[]> {
  const rows = await getSheetValues(env.sheets.masterTab())
  if (rows.length === 0) return []

  const [headerRow, ...dataRows] = rows
  const col = buildColumnIndex(headerRow, ALIASES, 'Master')

  return dataRows
    .filter((row) => row.some((cell) => toText(cell) !== ''))
    .map((row, i) => ({
      rowNumber: i + 2,
      violation: toText(row[col.violation]),
      points: toNumber(row[col.points]),
      description: toText(row[col.description]),
    }))
    .filter((r) => r.violation !== '')
}

export async function getMasterViolations(): Promise<MasterViolation[]> {
  if (cache && cache.expires > Date.now()) return cache.data
  const data = await fetchMasterViolations()
  cache = { data, expires: Date.now() + TTL_MS }
  return data
}
