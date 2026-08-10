import { getMasterViolations } from '@/lib/sheets/master'
import { PolicyTable } from '@/components/coc/PolicyTable'

export default async function CodeOfConductPage() {
  const violations = await getMasterViolations()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Code of Conduct</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every violation, its penalty points, and policy details — sourced live from the Master
          policy sheet.
        </p>
      </div>
      <PolicyTable violations={violations} />
    </div>
  )
}
