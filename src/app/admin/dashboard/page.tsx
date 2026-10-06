import { getCocRecords, buildDashboardSummary, summarizeByEmployee } from '@/lib/sheets/coc-points'
import { AdminDashboardClient } from '@/components/dashboard/AdminDashboardClient'

export default async function AdminDashboardPage() {
  const records = await getCocRecords()
  const summary = buildDashboardSummary(records)
  const employeeSummaries = summarizeByEmployee(records)

  // Temporary diagnostic (aggregates only, no employee data).
  console.error(
    `ADMIN PAGE RENDER at=${new Date().toISOString()} violations=${summary.totalViolations} ` +
      `points=${summary.totalPoints} employees=${summary.totalEmployees} ` +
      `latestDate=${records.map((r) => r.date ?? '').sort().pop()}`
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          Live view of the COC-Points tracker, updated by Operations.
        </p>
      </div>
      <AdminDashboardClient
        records={records}
        summary={summary}
        employeeSummaries={employeeSummaries}
      />
    </div>
  )
}
