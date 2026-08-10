'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { employeeSignIn, employeeSignUp, AuthActionError } from '@/lib/auth/client-actions'

export default function EmployeeLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [checked, setChecked] = useState<{ name: string | null; hasRecord: boolean } | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function verifyEmployeeId() {
    setVerifyError(null)
    setChecked(null)
    if (!employeeId.trim()) return
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/verify-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeId.trim() }),
      })
      const body = await res.json()
      setChecked({ name: body.employeeName ?? null, hasRecord: Boolean(body.hasRecord) })
    } catch {
      setVerifyError('Could not check Employee ID. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await employeeSignIn(email, password)
      } else {
        if (!checked) {
          setError('Please check your Employee ID first.')
          setLoading(false)
          return
        }
        await employeeSignUp(email, password, employeeId.trim())
      }
      router.push('/employee/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof AuthActionError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setChecked(null)
    setVerifyError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-6 inline-block text-sm text-ink-500 hover:text-ink-700">
          &larr; Back
        </Link>
        <Card>
          <h1 className="mb-1 text-lg font-semibold text-ink-900">
            {mode === 'signin' ? 'Employee sign in' : 'Create your account'}
          </h1>
          <p className="mb-6 text-sm text-ink-500">
            {mode === 'signin' ? 'View your own COC record' : "You'll only ever see your own record"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <div>
                <Label>Employee ID</Label>
                <div className="flex gap-2">
                  <Input
                    required
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value)
                      setChecked(null)
                      setVerifyError(null)
                    }}
                    placeholder="e.g. OH1234"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={verifyEmployeeId}
                    disabled={verifying || !employeeId.trim()}
                  >
                    {verifying ? '…' : 'Check'}
                  </Button>
                </div>
                {checked && checked.hasRecord && (
                  <div className="mt-2">
                    <Badge tone="green">Found: {checked.name}</Badge>
                  </div>
                )}
                {checked && !checked.hasRecord && (
                  <div className="mt-2">
                    <Badge tone="brand">No violations on record yet — 0 points. You&apos;re good to go!</Badge>
                  </div>
                )}
                {verifyError && <p className="mt-2 text-xs text-red-600">{verifyError}</p>}
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@orangehealth.in"
              />
              {mode === 'signup' && (
                <p className="mt-1.5 text-xs text-ink-400">Must be an @orangehealth.in email.</p>
              )}
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || (mode === 'signup' && !checked)}
              className="mt-1 w-full"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="mt-4 w-full text-center text-xs text-ink-500 hover:text-brand-600"
          >
            {mode === 'signin'
              ? "First time here? Create your account"
              : 'Already have an account? Sign in'}
          </button>
        </Card>
      </div>
    </div>
  )
}
