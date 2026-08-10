import type { SlideTableSection } from '@/lib/slides/parse'

// Manually transcribed from screenshots sent by Ops, since building tables
// directly in the Slides deck has proven cumbersome. To update: send a
// screenshot of the new/changed table and update the entry below to match —
// no other code changes needed. Any *real* tables later added natively to
// the Slides deck (via Insert > Table) still show up automatically
// alongside these, merged in by getPenaltyPointTables().
export const STATIC_TABLE_SECTIONS: SlideTableSection[] = [
  {
    slideTitle: 'D. Penalty Point System',
    headers: ['Violation', 'Points', 'Penalty'],
    rows: [
      [
        'Unplanned Leaves\nAll unplanned leaves will result in loss of pay. Unpaid leaves beyond 2/month are not allowed.',
        '15',
        'Full Day LOP',
      ],
      ['Fatal Errors (Customer negligence or carelessness)', '5', 'As per COC'],
      ['Under work (<7.5 Active hours out of 8.5 Hr shift)', '5', 'Half Day LOP'],
    ],
    notes: [
      'Disciplinary Thresholds (per agent): At 50 points — HR to issue a BIP warning (Behavior Improvement Plan). At 70 points — Termination of employment.',
      'Note: Fatal Errors refer to any avoidable, intentional, or careless act that causes customer dissatisfaction, misinformation, or escalations. These will be reviewed on a case-to-case basis by the Manager/HR jointly or as highlighted by the VOC team.',
    ],
  },
]
