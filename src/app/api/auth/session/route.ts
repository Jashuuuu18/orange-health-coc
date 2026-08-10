import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from '@/lib/auth/session'
import { employeeIdExists } from '@/lib/sheets/coc-points'
import { env } from '@/lib/env'
import type { UserRole } from '@/lib/types'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const idToken =
    typeof (body as { idToken?: unknown })?.idToken === 'string'
      ? (body as { idToken: string }).idToken
      : ''
  const signupEmployeeId =
    typeof (body as { signupEmployeeId?: unknown })?.signupEmployeeId === 'string'
      ? (body as { signupEmployeeId: string }).signupEmployeeId.trim()
      : null

  if (!idToken) {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
  }

  let decoded: { uid: string; email?: string }
  try {
    decoded = await adminAuth().verifyIdToken(idToken)
  } catch (err) {
    console.error('verifyIdToken failed:', err)
    return NextResponse.json({ error: 'Invalid or expired credentials' }, { status: 401 })
  }

  const email = decoded.email ?? ''
  const userDocRef = adminDb().collection('users').doc(decoded.uid)
  const existingDoc = await userDocRef.get()

  const allowedDomain = env.allowedEmailDomain()
  const emailDomain = email.split('@')[1]?.toLowerCase() ?? ''
  const isNewAccount = !existingDoc.exists
  if (isNewAccount && emailDomain !== allowedDomain) {
    return NextResponse.json(
      { error: `Sign-up is restricted to @${allowedDomain} email addresses.` },
      { status: 403 }
    )
  }

  let role: UserRole
  let employeeId: string | null = null

  if (existingDoc.exists) {
    const data = existingDoc.data() as { role: UserRole; employeeId: string | null }
    role = data.role
    employeeId = data.employeeId ?? null
  } else if (signupEmployeeId) {
    // First-time employee sign-up. There's no employee roster sheet, so an
    // ID with zero rows in COC-Points can't be told apart from a made-up
    // one — accept it either way and treat it as a zero-points employee.
    // If they do have a record, grab their name from it for a nicer profile.
    const { employeeName } = await employeeIdExists(signupEmployeeId)
    role = 'employee'
    employeeId = signupEmployeeId
    await userDocRef.set({
      email,
      role,
      employeeId,
      name: employeeName,
      createdAt: new Date().toISOString(),
    })
  } else if (env.adminAllowlist().includes(email.toLowerCase())) {
    role = 'admin'
    await userDocRef.set({
      email,
      role,
      employeeId: null,
      name: email,
      createdAt: new Date().toISOString(),
    })
  } else {
    return NextResponse.json(
      {
        error:
          'This account is not set up. Employees must sign up with their Employee ID; Admin accounts must be on the allowlist.',
      },
      { status: 403 }
    )
  }

  const sessionCookieValue = await createSessionCookieValue(idToken)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  })

  return NextResponse.json({ role, employeeId })
}
