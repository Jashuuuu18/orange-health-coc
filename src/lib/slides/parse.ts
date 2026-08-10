import type { slides_v1 } from 'googleapis'

export interface SlideTableSection {
  slideTitle: string
  headers: string[]
  rows: string[][]
  notes: string[]
}

function textFromElements(elements: slides_v1.Schema$TextElement[] | undefined): string {
  if (!elements) return ''
  return elements.map((el) => el.textRun?.content ?? '').join('')
}

function paragraphsFromShapeText(text: slides_v1.Schema$TextContent | undefined): string[] {
  const raw = textFromElements(text?.textElements)
  return raw
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)
}

function cellText(cell: slides_v1.Schema$TableCell | undefined): string {
  return textFromElements(cell?.text?.textElements)
    .replace(/\n+/g, ' ')
    .trim()
}

function isTitlePlaceholder(el: slides_v1.Schema$PageElement): boolean {
  return el.shape?.placeholder?.type === 'TITLE' || el.shape?.placeholder?.type === 'CENTERED_TITLE'
}

function elementTop(el: slides_v1.Schema$PageElement): number {
  return el.transform?.translateY ?? 0
}

/**
 * Extracts every table on every slide, paired with that slide's title (best
 * guess: the TITLE placeholder, else the topmost text shape) and any other
 * text on the slide as freeform "notes" (e.g. disciplinary threshold bullets
 * that sit next to the table but aren't part of it). Slides with no table
 * are skipped — this feeds a page that's specifically a violation -> points
 * lookup, not a full policy-document renderer.
 */
export function extractTableSections(
  presentation: slides_v1.Schema$Presentation
): SlideTableSection[] {
  const sections: SlideTableSection[] = []

  for (const slide of presentation.slides ?? []) {
    const elements = (slide.pageElements ?? []).slice().sort((a, b) => elementTop(a) - elementTop(b))
    const tableElements = elements.filter((el) => el.table)
    if (tableElements.length === 0) continue

    const titleEl = elements.find(isTitlePlaceholder)
    const titleText = titleEl
      ? paragraphsFromShapeText(titleEl.shape?.text).join(' ')
      : paragraphsFromShapeText(elements.find((el) => el.shape?.text)?.shape?.text).join(' ')

    const noteTexts = elements
      .filter((el) => el.shape?.text && el !== titleEl)
      .flatMap((el) => paragraphsFromShapeText(el.shape?.text))

    for (const tableEl of tableElements) {
      const table = tableEl.table!
      const gridRows = (table.tableRows ?? []).map((row) =>
        (row.tableCells ?? []).map(cellText)
      )
      if (gridRows.length === 0) continue

      const [headers, ...rows] = gridRows
      sections.push({
        slideTitle: titleText || 'Untitled section',
        headers,
        rows: rows.filter((r) => r.some((c) => c !== '')),
        notes: noteTexts,
      })
    }
  }

  return sections
}
