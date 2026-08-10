import { getPresentation } from './client'
import { extractTableSections, type SlideTableSection } from './parse'

const TTL_MS = 60_000
let cache: { data: SlideTableSection[]; expires: number } | null = null

export async function getPenaltyPointTables(): Promise<SlideTableSection[]> {
  if (cache && cache.expires > Date.now()) return cache.data
  const presentation = await getPresentation()
  const data = extractTableSections(presentation)
  cache = { data, expires: Date.now() + TTL_MS }

  // Temporary diagnostic: log what kind of content each slide actually has,
  // so we can tell image-only slides apart from real tables/text.
  const summary = (presentation.slides ?? []).map((slide, i) => {
    const kinds = (slide.pageElements ?? []).map((el) =>
      el.table ? 'table' : el.image ? 'image' : el.shape ? 'shape/text' : 'other'
    )
    return `slide ${i + 1}: [${kinds.join(', ')}]`
  })
  console.error('SLIDES DIAGNOSTIC:', summary.join(' | '))

  return data
}
