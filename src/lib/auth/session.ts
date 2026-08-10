import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { UserProfile, UserRole } from '@/lib/types'

export const SESSION_COOKIE_NAME = 'coc_session'
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

export async function createSessionCookieValue(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS })
}

/** Reads and verifies the session cookie, returning the full user profile (role + employeeId) from Firestore. Never trusts any client-supplied role/employeeId. Cached per-request so layout + page can both call it for free. */
export const getSessionUser = cache(async (): Promise<UserProfile | null> => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true)
    const doc = await adminDb().collection('users').doc(decoded.uid).get()
    if (!doc.exists) return null
    const data = doc.data() as {
      email: string
      role: UserRole
      employeeId: string | null
      name: string | null
    }
    return {
      uid: decoded.uid,
      email: data.email,
      role: data.role,
      employeeId: data.employeeId ?? null,
      name: data.name ?? null,
    }
  } catch {
    return null
  }
})

export async function requireUser(): Promise<UserProfile> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/login/admin')
  return user
}

export async function requireEmployee(): Promise<UserProfile> {
  const user = await requireUser()
  if (user.role !== 'employee') redirect('/login/employee')
  return user
}
