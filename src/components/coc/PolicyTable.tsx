'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useClientTable } from '@/lib/hooks/useClientTable'
import type { MasterViolation } from '@/lib/types'

function pointsTone(points: number): 'red' | 'brand' | 'ink' {
  if (points >= 5) return 'red'
  if (points >= 2) return 'brand'
  return 'ink'
}

export function PolicyTable({ violations }: { violations: MasterViolation[] }) {
  const table = useClientTable({
    data: violations,
    searchFields: ['violation', 'description'],
    initialSort: { field: 'points', direction: 'desc' },
    pageSize: 50,
  })

  return (
    <Card className="p-0">
      <div className="border-b border-ink-100 p-4">
        <Input
          placeholder="Search violations…"
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3 font-medium">Violation</th>
              <th className="px-4 py-3 font-medium">Penalty Points</th>
              <th className="px-4 py-3 font-medium">Description / Policy</th>
            </tr>
          </thead>
          <tbody>
            {table.pageData.map((v) => (
              <tr key={v.rowNumber} className="border-b border-ink-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">{v.violation}</td>
                <td className="px-4 py-3">
                  <Badge tone={pointsTone(v.points)}>{v.points} pts</Badge>
                </td>
                <td className="px-4 py-3 text-ink-600">{v.description || '—'}</td>
              </tr>
            ))}
            {table.pageData.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-400">
                  No violations match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
