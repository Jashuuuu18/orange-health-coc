'use client'

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase/client'

export class AuthActionError extends Error {}

async function establishServerSession(
  user: User,
  isNewSignup: boolean,
  signupEmployeeId?: string
): Promise<{ role: 'admin' | 'employee'; employeeId: string | null }> {
  const idToken = await user.getIdToken()
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, signupEmployeeId }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // Only delete the Firebase Auth account if we just created it in this
    // same flow and the server rejected it — never delete on a sign-in
    // failure, since that would destroy a legitimate existing account.
    if (isNewSignup) {
      await user.delete().catch(() => signOut(firebaseAuth))
    } else {
      await signOut(firebaseAuth)
    }
    throw new AuthActionError(body.error ?? 'Sign-in failed')
  }

  return res.json()
}

function friendlyFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    default:
      return (err as Error)?.message ?? 'Something went wrong. Please try again.'
  }
}

export async function adminSignIn(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return await establishServerSession(cred.user, false)
  } catch (err) {
    if (err instanceof AuthActionError) throw err
    throw new AuthActionError(friendlyFirebaseError(err))
  }
}

export async function adminSignUp(email: string, password: string) {
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    return await establishServerSession(cred.user, true)
  } catch (err) {
    if (err instanceof AuthActionError) throw err
    throw new AuthActionError(friendlyFirebaseError(err))
  }
}

export async function employeeSignIn(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return await establishServerSession(cred.user, false)
  } catch (err) {
    if (err instanceof AuthActionError) throw err
    throw new AuthActionError(friendlyFirebaseError(err))
  }
}

export async function employeeSignUp(email: string, password: string, employeeId: string) {
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    return await establishServerSession(cred.user, true, employeeId)
  } catch (err) {
    if (err instanceof AuthActionError) throw err
    throw new AuthActionError(friendlyFirebaseError(err))
  }
}

export async function signOutUser() {
  await fetch('/api/auth/logout', { method: 'POST' })
  await signOut(firebaseAuth).catch(() => {})
}
