import { getPenaltyPointTables } from '@/lib/slides/policy'
import { PenaltyPointTables } from '@/components/coc/PenaltyPointTables'

export default async function PenaltyPointsPage() {
  const sections = await getPenaltyPointTables()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Penalty Points</h1>
        <p className="mt-1 text-sm text-ink-500">
          Look up how many points a violation carries — sourced live from the Code of Conduct
          policy deck. More tables will appear here automatically as they&apos;re added.
        </p>
      </div>
      <PenaltyPointTables sections={sections} />
    </div>
  )
}
