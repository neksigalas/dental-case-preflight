'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [labName, setLabName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { lab_name: labName } },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Registration failed.')
      setLoading(false)
      return
    }

    const labRes = await fetch('/api/auth/register-lab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authData.user.id, labName }),
    })

    if (!labRes.ok) {
      const body = await labRes.json().catch(() => ({}))
      setError(body.error ?? 'Account created but lab setup failed. Please contact support.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between w-96 shrink-0 p-10"
        style={{ background: 'linear-gradient(160deg, #1E40AF 0%, #2563EB 60%, #0EA5E9 100%)' }}>
        <div>
          <div className="flex items-center gap-2 mb-12">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="rgba(255,255,255,0.2)"/>
              <path d="M14 8c0 4 2 7 5 8M14 8c0 4-2 7-5 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="14" cy="12" r="2" fill="white"/>
            </svg>
            <span className="text-white font-semibold text-sm">Dental Case Preflight</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 mb-6">
            <div className="text-3xl font-bold text-white mb-1">14 days</div>
            <div className="text-blue-200 text-sm">completely free trial</div>
            <div className="text-blue-300 text-xs mt-1">No credit card required</div>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">
            After your trial: <strong className="text-white">€29/month</strong> or <strong className="text-white">€249/year</strong>.
            Cancel any time from your settings.
          </p>
        </div>

        <div className="space-y-3">
          {[
            '5-minute setup, no IT needed',
            'Clinics submit without an account',
            'Your data stays in the EU (Supabase EU)',
          ].map((text) => (
            <div key={text} className="flex items-center gap-3 text-sm text-blue-100">
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">

          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3">
              <circle cx="20" cy="20" r="20" fill="#EFF6FF"/>
              <path d="M20 12c0 5.5 2.5 9.5 6.5 11M20 12c0 5.5-2.5 9.5-6.5 11" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="20" cy="17" r="2.5" fill="#2563EB"/>
            </svg>
            <h1 className="text-xl font-bold text-slate-900">Dental Case Preflight</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Create your lab</h2>
            <p className="text-slate-500 text-sm mt-1">Free for 14 days — no card needed</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Lab name</label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                required
                placeholder="Athens Dental Lab"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <p className="text-xs text-slate-400 mt-1">This is shown to clinics when they submit cases.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="lab@example.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-scale-in">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5"/><path d="M8 5v3M8 11h.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><span className="spinner"></span> Creating account…</> : 'Create lab account — free'}
            </button>

            <p className="text-xs text-slate-400 text-center">
              By registering you agree to our terms. No spam, ever.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>

          <p className="text-center mt-4">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
