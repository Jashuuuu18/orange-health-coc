'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOutUser } from '@/lib/auth/client-actions'
import type { UserRole } from '@/lib/types'

interface NavLink {
  href: string
  label: string
}

function linksForRole(role: UserRole): NavLink[] {
  const base: NavLink[] =
    role === 'admin'
      ? [{ href: '/admin/dashboard', label: 'Dashboard' }]
      : [{ href: '/employee/dashboard', label: 'My Dashboard' }]
  return [
    ...base,
    { href: '/code-of-conduct', label: 'Code of Conduct' },
    { href: '/penalty-points', label: 'Penalty Points' },
  ]
}

export function AppShell({
  role,
  displayName,
  children,
}: {
  role: UserRole
  displayName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = linksForRole(role)

  async function handleSignOut() {
    await signOutUser()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
              OH
            </span>
            <span className="text-sm font-semibold text-ink-900 sm:text-base">
              Code of Conduct Dashboard
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="ml-3 flex items-center gap-3 border-l border-ink-200 pl-3">
              <span className="max-w-[10rem] truncate text-sm text-ink-500">{displayName}</span>
              <button
                onClick={handleSignOut}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
              >
                Sign out
              </button>
            </div>
          </nav>

          <button
            className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-ink-200 px-4 py-2 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname.startsWith(link.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-1 flex items-center justify-between border-t border-ink-100 px-3 py-2.5">
              <span className="truncate text-sm text-ink-500">{displayName}</span>
              <button onClick={handleSignOut} className="text-sm font-medium text-brand-600">
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
