import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  PENALTY_POINT_ROWS,
  DISCIPLINARY_THRESHOLDS,
  DISCIPLINARY_NOTE,
  PENALTY_TABLE_INCOMPLETE,
} from '@/lib/policy/penalty-points'

export function PenaltyPointSystem() {
  return (
    <Card className="p-0">
      <div className="border-b border-ink-100 p-4">
        <h2 className="font-semibold text-ink-900">D. Penalty Point System</h2>
        <p className="mt-1 text-sm text-ink-500">
          To reinforce a culture of discipline and ownership, Orange Health follows a
          structured system of penalties based on adherence to shift schedules and work
          conduct.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3 font-medium">Violation</th>
              <th className="px-4 py-3 font-medium">Points</th>
              <th className="px-4 py-3 font-medium">Penalty</th>
            </tr>
          </thead>
          <tbody>
            {PENALTY_POINT_ROWS.map((row) => (
              <tr key={row.violation} className="border-b border-ink-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{row.violation}</p>
                  {row.detail && <p className="mt-0.5 text-xs text-ink-500">{row.detail}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.points >= 10 ? 'red' : 'brand'}>{row.points} pts</Badge>
                </td>
                <td className="px-4 py-3 text-ink-600">{row.penalty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-ink-100 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
          Disciplinary Thresholds (per agent)
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-700">
          {DISCIPLINARY_THRESHOLDS.map((t) => (
            <li key={t.points}>
              <span className="font-semibold text-red-600">At {t.points} points</span>:{' '}
              {t.action}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-500">{DISCIPLINARY_NOTE}</p>
      </div>

      {PENALTY_TABLE_INCOMPLETE && (
        <div className="border-t border-ink-100 bg-brand-50 px-4 py-2.5 text-xs text-brand-700">
          Manually entered from a screenshot for now — some rows may be missing. This will be
          replaced with a live read from the Master sheet once Sheets API access is connected.
        </div>
      )}
    </Card>
  )
}
