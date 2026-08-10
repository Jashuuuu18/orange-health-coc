import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { env } from '@/lib/env'

function getAdminApp(): App {
  const existing = getApps()
  if (existing.length > 0) return existing[0]!
  return initializeApp({
    credential: cert({
      projectId: env.firebaseAdmin.projectId(),
      clientEmail: env.firebaseAdmin.clientEmail(),
      privateKey: env.firebaseAdmin.privateKey(),
    }),
  })
}

export function adminAuth() {
  return getAuth(getAdminApp())
}

export function adminDb() {
  return getFirestore(getAdminApp())
}
