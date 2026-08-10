import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { SlideTableSection } from '@/lib/slides/parse'

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().trim())
  return normalized.findIndex((h) => candidates.includes(h))
}

function pointsTone(raw: string): 'red' | 'brand' | 'ink' {
  const n = Number(raw.replace(/[^0-9.-]/g, ''))
  if (Number.isNaN(n)) return 'ink'
  if (n >= 10) return 'red'
  if (n >= 1) return 'brand'
  return 'ink'
}

export function PolicyTableSections({
  sections,
  emptyMessage = "No tables found yet. Once your team adds one, it'll show up here automatically.",
}: {
  sections: SlideTableSection[]
  emptyMessage?: string
}) {
  if (sections.length === 0) {
    return (
      <Card>
        <p className="text-sm text-ink-500">{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section, i) => {
        const pointsCol = findColumn(section.headers, ['points', 'penalty points', 'point'])
        return (
          <Card key={`${section.slideTitle}-${i}`} className="p-0">
            <div className="border-b border-ink-100 p-4">
              <h2 className="font-semibold text-ink-900">{section.slideTitle}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                    {section.headers.map((h, hi) => (
                      <th key={hi} className="px-4 py-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-ink-50 last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-3 text-ink-700">
                          {ci === pointsCol ? (
                            <Badge tone={pointsTone(cell)}>{cell}</Badge>
                          ) : (
                            cell || '—'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {section.notes.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-ink-100 p-4 text-xs text-ink-500">
                {section.notes.map((note, ni) => (
                  <p key={ni}>{note}</p>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
