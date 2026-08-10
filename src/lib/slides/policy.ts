import { getPresentation } from './client'
import { extractTableSections, type SlideTableSection } from './parse'

const TTL_MS = 60_000
let cache: { data: SlideTableSection[]; expires: number } | null = null

export async function getPenaltyPointTables(): Promise<SlideTableSection[]> {
  if (cache && cache.expires > Date.now()) return cache.data
  const presentation = await getPresentation()
  const data = extractTableSections(presentation)
  cache = { data, expires: Date.now() + TTL_MS }
  return data
}
