function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Maps sheet header names (case/spacing-insensitive) to a field index using a
 * list of acceptable aliases per field, so the parser survives minor header
 * renames in the source sheet without a code change.
 */
export function buildColumnIndex<Field extends string>(
  headerRow: string[],
  aliases: Record<Field, string[]>,
  sheetLabel: string
): Record<Field, number> {
  const normalizedHeaders = headerRow.map(normalizeHeader)
  const result = {} as Record<Field, number>
  const missing: string[] = []

  for (const field of Object.keys(aliases) as Field[]) {
    const candidates = aliases[field].map(normalizeHeader)
    const index = normalizedHeaders.findIndex((h) => candidates.includes(h))
    if (index === -1) {
      missing.push(field)
    } else {
      result[field] = index
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `The "${sheetLabel}" sheet is missing expected column(s): ${missing.join(', ')}. ` +
        `Found headers: [${headerRow.join(', ')}]. Update the alias list in src/lib/sheets/parse.ts ` +
        `or the column mapping constants if the sheet's headers changed.`
    )
  }

  return result
}

const DATE_FORMATS: RegExp[] = [
  /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
  /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
]

// "7 - Aug - 26", "07-Aug-2026", "7 Aug 26" — day, textual month, 2-or-4-digit year.
const MONTH_NAME_FORMAT = /^(\d{1,2})\s*[-\s]\s*([A-Za-z]{3,})\s*[-\s]\s*(\d{2,4})$/
const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/** Best-effort parse of a sheet date cell into an ISO (YYYY-MM-DD) string. */
export function parseSheetDate(raw: string | number | undefined | null): string | null {
  if (raw === undefined || raw === null || raw === '') return null
  const str = String(raw).trim()

  if (DATE_FORMATS[0].test(str)) {
    const d = new Date(str)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }

  const dmy = str.match(DATE_FORMATS[1]) ?? str.match(DATE_FORMATS[2])
  if (dmy) {
    const [, a, b, year] = dmy
    // Assume DD/MM/YYYY (India-standard) since Ops enters dates locally.
    const day = a.padStart(2, '0')
    const month = b.padStart(2, '0')
    if (Number(day) <= 31 && Number(month) <= 12) {
      return `${year}-${month}-${day}`
    }
  }

  const named = str.match(MONTH_NAME_FORMAT)
  if (named) {
    const [, dayRaw, monthRaw, yearRaw] = named
    const month = MONTH_NAMES[monthRaw.slice(0, 3).toLowerCase()]
    if (month) {
      const day = dayRaw.padStart(2, '0')
      const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
      return `${year}-${month}-${day}`
    }
  }

  const fallback = new Date(str)
  if (!Number.isNaN(fallback.getTime())) return fallback.toISOString().slice(0, 10)

  return null
}

export function toNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const cleaned = raw.replace(/[^0-9.-]/g, '')
    const n = Number(cleaned)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

export function toText(raw: unknown): string {
  if (raw === undefined || raw === null) return ''
  return String(raw).trim()
}
