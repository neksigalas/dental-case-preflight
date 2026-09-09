'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LabNavProps {
  labName: string
  userEmail: string
}

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    href: '/cases',
    label: 'Cases',
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <rect x="1.5" y="1.5" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4 5h7M4 7.5h7M4 10h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/clinics',
    label: 'Clinics',
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <path d="M7.5 1.5C5 1.5 3 3.5 3 6c0 3.5 4.5 7.5 4.5 7.5S12 9.5 12 6c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="7.5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.1 3.1l.7.7M11.2 11.2l.7.7M11.2 3.1l-.7.7M3.1 11.2l.7.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function LabNav({ labName, userEmail }: LabNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="13" cy="13" r="13" fill="#EFF6FF"/>
              <path d="M13 7c0 3.5 1.5 6 4 7M13 7c0 3.5-1.5 6-4 7" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="13" cy="11" r="1.8" fill="#2563EB"/>
            </svg>
            <span className="font-semibold text-slate-900 text-sm hidden sm:block">{labName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                {(userEmail[0] || '?').toUpperCase()}
              </div>
              <span className="text-xs text-slate-400 max-w-32 truncate">{userEmail}</span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                <path d="M8 2h1.5A1.5 1.5 0 0 1 11 3.5v5A1.5 1.5 0 0 1 9.5 10H8M5 8l3-3-3-3M8 5.5H1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                {menuOpen
                  ? <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  : <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                }
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 animate-fade-in">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
          <div className="border-t border-slate-100 mt-2 pt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{userEmail}</span>
            <button onClick={handleSignOut} className="text-xs text-red-500 hover:text-red-700">
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
