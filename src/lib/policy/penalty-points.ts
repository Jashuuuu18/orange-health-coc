// Manually entered from the "D. Penalty Point System" section of the Master
// policy sheet (screenshot, 2026-08-10). The sheet has more rows than shown
// here — replace this with a live read from the Master tab once
// GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY_PATH is configured (see README).
export interface PenaltyPointRow {
  violation: string
  detail?: string
  points: number
  penalty: string
}

export const PENALTY_POINT_ROWS: PenaltyPointRow[] = [
  {
    violation: 'Unplanned Leaves',
    detail: 'All unplanned leaves will result in loss of pay. Unpaid leaves beyond 2/month are not allowed.',
    points: 15,
    penalty: 'Full Day LOP',
  },
  {
    violation: 'Fatal Errors',
    detail: 'Customer negligence or carelessness',
    points: 5,
    penalty: 'As per COC',
  },
  {
    violation: 'Under work',
    detail: '<7.5 Active hours out of 8.5 Hr shift',
    points: 5,
    penalty: 'Half Day LOP',
  },
]

export const DISCIPLINARY_THRESHOLDS = [
  { points: 50, action: 'HR to issue a BIP warning (Behavior Improvement Plan)' },
  { points: 70, action: 'Termination of employment' },
]

export const DISCIPLINARY_NOTE =
  'Fatal Errors refer to any avoidable, intentional, or careless act that causes customer dissatisfaction, misinformation, or escalations. These will be reviewed on a case-to-case basis by the Manager/HR jointly or as highlighted by the VOC team.'

export const PENALTY_TABLE_INCOMPLETE = true
