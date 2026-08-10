import Link from 'next/link'
import { getMasterSection } from '@/lib/sheets/master'
import { PolicyTableSections } from '@/components/coc/PolicyTableSections'

export default async function CodeOfConductPage() {
  const section = await getMasterSection()
  const sections = section.rows.length > 0 ? [section] : []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Code of Conduct</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every violation, its penalty points, and policy details — sourced live from the Master
          sheet. For a focused violation → points lookup, see the{' '}
          <Link href="/penalty-points" className="text-brand-600 hover:underline">
            Penalty Points
          </Link>{' '}
          page.
        </p>
      </div>
      <PolicyTableSections
        sections={sections}
        emptyMessage="No violations found in the Master sheet yet."
      />
    </div>
  )
}
