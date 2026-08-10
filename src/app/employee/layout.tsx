import { requireEmployee } from '@/lib/auth/session'
import { AppShell } from '@/components/layout/AppShell'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEmployee()
  return (
    <AppShell role="employee" displayName={user.name ?? user.email}>
      {children}
    </AppShell>
  )
}
