import { requireAdmin } from '@/lib/auth/session'
import { AppShell } from '@/components/layout/AppShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <AppShell role="admin" displayName={user.email}>
      {children}
    </AppShell>
  )
}
