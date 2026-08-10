'use client'

import { useMemo, useState } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { toCsv, downloadCsv } from '@/lib/csv'
import type { CocRecord, DashboardSummary, EmployeeSummary } from '@/lib/types'

const PAGE_SIZE = 12

type SortDir = 'asc' | 'desc'

function useUnique(records: CocRecord[], field: keyof CocRecord): string[] {
  return useMemo(() => {
    const set = new Set<string>()
    for (const r of records) {
      const v = String(r[field] ?? '').trim()
      if (v) set.add(v)
    }
    return Array.from(set).sort()
  }, [records, field])
}

export function AdminDashboardClient({
  records,
  summary,
  employeeSummaries,
}: {
  records: CocRecord[]
  summary: DashboardSummary
  employeeSummaries: EmployeeSummary[]
}) {
  const [tab, setTab] = useState<'violations' | 'employees'>('violations')

  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [violation, setViolation] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortField, setSortField] = useState<keyof CocRecord>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const roles = useUnique(records, 'role')
  const violations = useUnique(records, 'violation')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter((r) => {
      if (q) {
        const hay = `${r.employeeId} ${r.employeeName}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (role && r.role !== role) return false
      if (violation && r.violation !== violation) return false
      if (dateFrom && (!r.date || r.date < dateFrom)) return false
      if (dateTo && (!r.date || r.date > dateTo)) return false
      return true
    })
  }, [records, search, role, violation, dateFrom, dateTo])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      let cmp: number
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const pageData = sorted.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  function toggleSort(field: keyof CocRecord) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  function resetFilters() {
    setSearch('')
    setRole('')
    setViolation('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  function exportViolations() {
    const csv = toCsv(sorted, [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'role', label: 'Role' },
      { key: 'date', label: 'Date' },
      { key: 'violation', label: 'Violation' },
      { key: 'points', label: 'Points' },
      { key: 'remarks', label: 'Remarks' },
    ])
    downloadCsv('coc-violations.csv', csv)
  }

  function exportEmployees() {
    const csv = toCsv(employeeSummaries, [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'role', label: 'Role' },
      { key: 'totalPoints', label: 'Total Points' },
      { key: 'totalViolations', label: 'Total Violations' },
      { key: 'lastViolationDate', label: 'Last Violation Date' },
    ])
    downloadCsv('coc-employee-totals.csv', csv)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Employees" value={summary.totalEmployees} />
        <StatCard label="Total Violations" value={summary.totalViolations} />
        <StatCard label="Total Points" value={summary.totalPoints} />
        <StatCard
          label="Highest Points"
          value={summary.highestPointsHolder?.totalPoints ?? 0}
          sub={summary.highestPointsHolder?.employeeName ?? '—'}
        />
        <StatCard
          label="Most Common Violation"
          value={summary.mostCommonViolation?.count ?? 0}
          sub={summary.mostCommonViolation?.violation ?? '—'}
        />
        <StatCard label="Recent Violations" value={summary.recentViolations.length} sub="Last 8 entries" />
      </div>

      <Card className="p-0">
        <div className="flex flex-col gap-4 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
            <button
              onClick={() => setTab('violations')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'violations' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
              }`}
            >
              All Violations
            </button>
            <button
              onClick={() => setTab('employees')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'employees' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
              }`}
            >
              By Employee
            </button>
          </div>
          <Button
            variant="secondary"
            onClick={tab === 'violations' ? exportViolations : exportEmployees}
            className="w-full sm:w-auto"
          >
            Export CSV
          </Button>
        </div>

        {tab === 'violations' && (
          <>
            <div className="grid grid-cols-1 gap-3 border-b border-ink-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                placeholder="Search Employee ID or Name"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
              <Select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              <Select
                value={violation}
                onChange={(e) => {
                  setViolation(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Violations</option>
                {violations.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            {(search || role || violation || dateFrom || dateTo) && (
              <div className="flex items-center justify-between px-4 pt-3 text-xs text-ink-500">
                <span>{sorted.length} matching record(s)</span>
                <button onClick={resetFilters} className="font-medium text-brand-600">
                  Clear filters
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                    {(
                      [
                        ['employeeId', 'Employee ID'],
                        ['employeeName', 'Name'],
                        ['role', 'Role'],
                        ['date', 'Date'],
                        ['violation', 'Violation'],
                        ['points', 'Points'],
                        ['remarks', 'Remarks'],
                      ] as [keyof CocRecord, string][]
                    ).map(([field, label]) => (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        className="cursor-pointer select-none px-4 py-3 font-medium hover:text-ink-800"
                      >
                        {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((r) => (
                    <tr key={r.rowNumber} className="border-b border-ink-50 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">{r.employeeId}</td>
                      <td className="px-4 py-3 text-ink-900">{r.employeeName}</td>
                      <td className="px-4 py-3 text-ink-600">{r.role}</td>
                      <td className="px-4 py-3 text-ink-600">{r.date ?? r.dateRaw}</td>
                      <td className="px-4 py-3 text-ink-600">{r.violation}</td>
                      <td className="px-4 py-3">
                        <Badge tone={r.points >= 5 ? 'red' : 'brand'}>{r.points}</Badge>
                      </td>
                      <td className="max-w-[16rem] truncate px-4 py-3 text-ink-500">
                        {r.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                  {pageData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-400">
                        No violations match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4">
              <Pagination page={clampedPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}

        {tab === 'employees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Total Points</th>
                  <th className="px-4 py-3 font-medium">Violations</th>
                  <th className="px-4 py-3 font-medium">Last Violation</th>
                </tr>
              </thead>
              <tbody>
                {employeeSummaries.map((e) => (
                  <tr key={e.employeeId} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-ink-700">{e.employeeId}</td>
                    <td className="px-4 py-3 text-ink-900">{e.employeeName}</td>
                    <td className="px-4 py-3 text-ink-600">{e.role}</td>
                    <td className="px-4 py-3">
                      <Badge tone={e.totalPoints >= 10 ? 'red' : 'brand'}>{e.totalPoints}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{e.totalViolations}</td>
                    <td className="px-4 py-3 text-ink-600">{e.lastViolationDate ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
