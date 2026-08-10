'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { useClientTable } from '@/lib/hooks/useClientTable'
import type { CocRecord } from '@/lib/types'

export function EmployeeDashboardClient({
  employeeName,
  employeeId,
  role,
  records,
}: {
  employeeName: string
  employeeId: string
  role: string
  records: CocRecord[]
}) {
  const totalPoints = records.reduce((sum, r) => sum + r.points, 0)

  const table = useClientTable({
    data: records,
    searchFields: ['violation', 'remarks'],
    initialSort: { field: 'date', direction: 'desc' },
    pageSize: 10,
  })

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Agent Name</p>
            <p className="mt-1 font-medium text-ink-900">{employeeName || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
              Employee ID
            </p>
            <p className="mt-1 font-mono text-sm text-ink-900">{employeeId}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Role</p>
            <p className="mt-1 font-medium text-ink-900">{role || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
              Current Total Points
            </p>
            <p className="mt-1">
              <Badge tone={totalPoints >= 10 ? 'red' : 'brand'}>{totalPoints} pts</Badge>
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-ink-100 pt-4 text-sm text-ink-500">
          Total Violations: <span className="font-medium text-ink-800">{records.length}</span>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-ink-100 p-4">
          <Input
            placeholder="Search your violations…"
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                {(
                  [
                    ['date', 'Date'],
                    ['violation', 'Violation'],
                    ['points', 'Points'],
                    ['remarks', 'Remarks'],
                  ] as [keyof CocRecord, string][]
                ).map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => table.toggleSort(field)}
                    className="cursor-pointer select-none px-4 py-3 font-medium hover:text-ink-800"
                  >
                    {label}{' '}
                    {table.sort?.field === field ? (table.sort.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.pageData.map((r) => (
                <tr key={r.rowNumber} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 text-ink-600">{r.date ?? r.dateRaw}</td>
                  <td className="px-4 py-3 text-ink-900">{r.violation}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.points >= 5 ? 'red' : 'brand'}>{r.points}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{r.remarks || '—'}</td>
                </tr>
              ))}
              {table.pageData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-400">
                    No violations on record. Keep it up!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4">
          <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
        </div>
      </Card>
    </div>
  )
}
