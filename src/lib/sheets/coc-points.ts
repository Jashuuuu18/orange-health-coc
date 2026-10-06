import { env } from '@/lib/env'
import type { CocRecord, DashboardSummary, EmployeeSummary } from '@/lib/types'
import { getSheetValues, listSheetTabs } from './client'
import { buildColumnIndex, parseSheetDate, toNumber, toText } from './parse'

type Field = 'employeeId' | 'employeeName' | 'role' | 'date' | 'violation' | 'points' | 'remarks'

const ALIASES: Record<Field, string[]> = {
  employeeId: ['employeeid', 'empid', 'id', 'agentid', 'emedicid'],
  employeeName: ['employeename', 'name', 'agentname', 'emedicname'],
  role: ['role', 'designation', 'position', 'agentrole'],
  date: ['date', 'violationdate', 'dateofviolation', 'incidentdate'],
  violation: ['violation', 'violationname', 'cocviolation', 'reason', 'violationtype'],
  points: ['points', 'penaltypoints', 'pointsdeducted', 'score', 'cocpoints'],
  remarks: ['remarks', 'remark', 'comment', 'comments', 'notes'],
}

const TTL_MS = 15_000
let cache: { data: CocRecord[]; expires: number } | null = null

async function fetchCocRecords(): Promise<CocRecord[]> {
  const rows = await getSheetValues(env.sheets.cocPointsTab())

  // Temporary diagnostic: what exactly did this live read return?
  const tabs = await listSheetTabs().catch((e) => [`tab list failed: ${e.message}`])
  console.error(
    `COC DIAGNOSTIC fetchedAt=${new Date().toISOString()} reading tab="${env.sheets.cocPointsTab()}" ` +
      `rows(incl header)=${rows.length} lastRow=${JSON.stringify(rows[rows.length - 1]?.slice(0, 4))} ` +
      `workbookTabs=${JSON.stringify(tabs)}`
  )

  if (rows.length === 0) return []

  const [headerRow, ...dataRows] = rows
  const col = buildColumnIndex(headerRow, ALIASES, 'COC-Points')

  return dataRows
    .filter((row) => row.some((cell) => toText(cell) !== ''))
    .map((row, i) => {
      const dateRaw = toText(row[col.date])
      return {
        rowNumber: i + 2,
        employeeId: toText(row[col.employeeId]),
        employeeName: toText(row[col.employeeName]),
        role: toText(row[col.role]),
        date: parseSheetDate(dateRaw),
        dateRaw,
        violation: toText(row[col.violation]),
        points: toNumber(row[col.points]),
        remarks: toText(row[col.remarks]),
      }
    })
    .filter((r) => r.employeeId !== '')
}

export async function getCocRecords(): Promise<CocRecord[]> {
  if (cache && cache.expires > Date.now()) return cache.data
  const data = await fetchCocRecords()
  cache = { data, expires: Date.now() + TTL_MS }
  return data
}

export async function getCocRecordsForEmployee(employeeId: string): Promise<CocRecord[]> {
  const all = await getCocRecords()
  const normalized = employeeId.trim().toLowerCase()
  return all.filter((r) => r.employeeId.trim().toLowerCase() === normalized)
}

export async function employeeIdExists(
  employeeId: string
): Promise<{ exists: boolean; employeeName: string | null }> {
  const records = await getCocRecordsForEmployee(employeeId)
  if (records.length === 0) return { exists: false, employeeName: null }
  return { exists: true, employeeName: records[0].employeeName }
}

export function summarizeByEmployee(records: CocRecord[]): EmployeeSummary[] {
  const map = new Map<string, EmployeeSummary>()
  for (const r of records) {
    const key = r.employeeId.trim().toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.totalPoints += r.points
      existing.totalViolations += 1
      if (r.date && (!existing.lastViolationDate || r.date > existing.lastViolationDate)) {
        existing.lastViolationDate = r.date
      }
    } else {
      map.set(key, {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        role: r.role,
        totalPoints: r.points,
        totalViolations: 1,
        lastViolationDate: r.date,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints)
}

export function buildDashboardSummary(records: CocRecord[]): DashboardSummary {
  const employees = summarizeByEmployee(records)
  const totalPoints = records.reduce((sum, r) => sum + r.points, 0)

  const violationCounts = new Map<string, number>()
  for (const r of records) {
    if (!r.violation) continue
    violationCounts.set(r.violation, (violationCounts.get(r.violation) ?? 0) + 1)
  }
  let mostCommonViolation: DashboardSummary['mostCommonViolation'] = null
  for (const [violation, count] of violationCounts) {
    if (!mostCommonViolation || count > mostCommonViolation.count) {
      mostCommonViolation = { violation, count }
    }
  }

  const recentViolations = [...records]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 8)

  return {
    totalEmployees: employees.length,
    totalViolations: records.length,
    totalPoints,
    highestPointsHolder: employees[0] ?? null,
    mostCommonViolation,
    recentViolations,
  }
}
