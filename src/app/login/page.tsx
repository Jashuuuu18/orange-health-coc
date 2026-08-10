import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export default function LoginChooserPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">
            OH
          </span>
          <h1 className="text-xl font-semibold text-ink-900">Code of Conduct Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to continue</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/login/admin">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Operations / Admin</p>
                  <p className="text-sm text-ink-500">Manage and review all employee records</p>
                </div>
                <span className="text-brand-500">&rarr;</span>
              </div>
            </Card>
          </Link>

          <Link href="/login/employee">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">Employee / Emedic</p>
                  <p className="text-sm text-ink-500">View your own COC record</p>
                </div>
                <span className="text-brand-500">&rarr;</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
