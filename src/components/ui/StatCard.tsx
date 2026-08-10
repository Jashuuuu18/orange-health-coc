import { Card } from './Card'

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
      <span className="text-2xl font-semibold text-ink-900">{value}</span>
      {sub && <span className="text-xs text-ink-500">{sub}</span>}
    </Card>
  )
}
