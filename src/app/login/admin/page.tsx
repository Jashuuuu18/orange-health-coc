'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { adminSignIn, adminSignUp, resetPassword, AuthActionError } from '@/lib/auth/client-actions'

export default function AdminLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await adminSignIn(email, password)
      } else {
        await adminSignUp(email, password)
      }
      router.push('/admin/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof AuthActionError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email above first, then click "Forgot password?"')
      return
    }
    setResetting(true)
    try {
      await resetPassword(email.trim())
      setResetSent(true)
    } catch (err) {
      setError(err instanceof AuthActionError ? err.message : 'Something went wrong.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-6 inline-block text-sm text-ink-500 hover:text-ink-700">
          &larr; Back
        </Link>
        <Card>
          <h1 className="mb-1 text-lg font-semibold text-ink-900">Admin sign in</h1>
          <p className="mb-6 text-sm text-ink-500">Operations team access</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setResetSent(false)
                }}
                placeholder="you@orangehealth.in"
              />
              {mode === 'signup' && (
                <p className="mt-1.5 text-xs text-ink-400">Must be an @orangehealth.in email.</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Password</Label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetting}
                    className="mb-1.5 text-xs text-ink-500 hover:text-brand-600"
                  >
                    {resetting ? 'Sending…' : 'Forgot password?'}
                  </button>
                )}
              </div>
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

            {resetSent && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                If an account exists for that email, a password reset link has been sent.
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create admin account'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
              setError(null)
              setResetSent(false)
            }}
            className="mt-4 w-full text-center text-xs text-ink-500 hover:text-brand-600"
          >
            {mode === 'signin'
              ? "First time? Create an admin account (email must be pre-authorized)"
              : 'Already have an account? Sign in'}
          </button>
        </Card>
      </div>
    </div>
  )
}
