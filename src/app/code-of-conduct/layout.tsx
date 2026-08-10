import { requireUser } from '@/lib/auth/session'
import { AppShell } from '@/components/layout/AppShell'

export default async function CodeOfConductLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <AppShell role={user.role} displayName={user.name ?? user.email}>
      {children}
    </AppShell>
  )
}
