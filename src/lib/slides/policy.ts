import { getPresentation } from './client'
import { extractTableSections, type SlideTableSection } from './parse'
import { STATIC_TABLE_SECTIONS } from '@/lib/policy/static-tables'

const TTL_MS = 60_000
let cache: { data: SlideTableSection[]; expires: number } | null = null

export async function getPenaltyPointTables(): Promise<SlideTableSection[]> {
  if (cache && cache.expires > Date.now()) return cache.data
  const presentation = await getPresentation()
  const liveTables = extractTableSections(presentation)
  const data = [...STATIC_TABLE_SECTIONS, ...liveTables]
  cache = { data, expires: Date.now() + TTL_MS }
  return data
}
