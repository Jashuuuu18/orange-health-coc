import { NextResponse } from 'next/server'
import { employeeIdExists } from '@/lib/sheets/coc-points'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const employeeId =
    typeof (body as { employeeId?: unknown })?.employeeId === 'string'
      ? (body as { employeeId: string }).employeeId.trim()
      : ''

  if (!employeeId || employeeId.length > 64) {
    return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
  }

  const { exists, employeeName } = await employeeIdExists(employeeId)
  return NextResponse.json({ valid: exists, employeeName })
}
