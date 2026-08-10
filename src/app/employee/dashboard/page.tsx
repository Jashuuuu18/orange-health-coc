import { requireEmployee } from '@/lib/auth/session'
import { getCocRecordsForEmployee } from '@/lib/sheets/coc-points'
import { EmployeeDashboardClient } from '@/components/dashboard/EmployeeDashboardClient'

export default async function EmployeeDashboardPage() {
  const user = await requireEmployee()
  const records = user.employeeId ? await getCocRecordsForEmployee(user.employeeId) : []
  const latest = records[0]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">My Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Your Code of Conduct record, updated live.</p>
      </div>
      <EmployeeDashboardClient
        employeeName={latest?.employeeName ?? user.name ?? ''}
        employeeId={user.employeeId ?? ''}
        role={latest?.role ?? ''}
        records={records}
      />
    </div>
  )
}
