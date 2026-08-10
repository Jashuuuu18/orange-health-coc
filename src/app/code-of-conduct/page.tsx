import Link from 'next/link'
import { getPenaltyPointTables } from '@/lib/slides/policy'
import { PenaltyPointTables } from '@/components/coc/PenaltyPointTables'

export default async function CodeOfConductPage() {
  const sections = await getPenaltyPointTables()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Code of Conduct</h1>
        <p className="mt-1 text-sm text-ink-500">
          Sourced live from the Code of Conduct policy deck. For a focused violation → points
          lookup, see the{' '}
          <Link href="/penalty-points" className="text-brand-600 hover:underline">
            Penalty Points
          </Link>{' '}
          page.
        </p>
      </div>
      <PenaltyPointTables sections={sections} />
    </div>
  )
}
