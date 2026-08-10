import { env } from '@/lib/env'
import { getSheetValues } from './client'
import { toText } from './parse'
import type { SlideTableSection } from '@/lib/slides/parse'

// The Master tab isn't one flat table — it's two side-by-side tables in the
// same header row, e.g.:
//   SN | CT SOP Violation | Type of Issue | Penalty | (blank) | SN | Behavioural Violation | Type of Issue | Penalty
// Each block is parsed independently and rendered as its own section.
interface Block {
  title: string
  violationHeaderAliases: string[]
}

const BLOCKS: Block[] = [
  { title: 'CT SOP Violations', violationHeaderAliases: ['ct sop violation'] },
  { title: 'Behavioural Violations', violationHeaderAliases: ['behavioural violation', 'behavioral violation'] },
]

function findBlockStart(headerRow: string[], aliases: string[]): number | null {
  const normalized = headerRow.map((h) => h.toLowerCase().trim())
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias)
    if (idx !== -1) return idx - 1 >= 0 ? idx - 1 : idx // back up to the SN column if present
  }
  return null
}

const TTL_MS = 60_000
let cache: { data: SlideTableSection[]; expires: number } | null = null

async function fetchMasterSections(): Promise<SlideTableSection[]> {
  const rows = await getSheetValues(env.sheets.masterTab())
  if (rows.length === 0) return []

  const [headerRow, ...dataRows] = rows
  const sections: SlideTableSection[] = []

  for (const block of BLOCKS) {
    const start = findBlockStart(headerRow, block.violationHeaderAliases)
    if (start === null) continue

    // Columns within this block: SN, Violation, Type of Issue, Penalty
    const [, violationCol, typeCol, penaltyCol] = [start, start + 1, start + 2, start + 3]
    const blockRows = dataRows
      .map((row) => [toText(row[violationCol]), toText(row[typeCol]), toText(row[penaltyCol])])
      .filter((r) => r[0] !== '')

    if (blockRows.length > 0) {
      sections.push({
        slideTitle: block.title,
        headers: ['Violation', 'Type of Issue', 'Penalty'],
        rows: blockRows,
        notes: [],
      })
    }
  }

  return sections
}

export async function getMasterSections(): Promise<SlideTableSection[]> {
  if (cache && cache.expires > Date.now()) return cache.data
  const data = await fetchMasterSections()
  cache = { data, expires: Date.now() + TTL_MS }
  return data
}
