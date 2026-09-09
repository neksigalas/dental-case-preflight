import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  // Logged-in users go straight to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#EFF6FF"/>
              <path d="M9 8c0-1.1.9-2 2-2h6a2 2 0 0 1 2 2v3c0 4-2 7-5 8-3-1-5-4-5-8V8z" fill="#2563EB" opacity=".2"/>
              <path d="M14 8c0 4 2 7 5 8M14 8c0 4-2 7-5 8" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="14" cy="12" r="2" fill="#2563EB"/>
            </svg>
            <span className="font-semibold text-slate-900 text-sm">Dental Case Preflight</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* gradient bg */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #F8FAFC 100%)'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20" style={{
          background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)',
          transform: 'translate(30%, -30%)'
        }} />

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Zero setup · 14-day free trial
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight animate-fade-in-up">
            Stop Case Remakes<br/>
            <span className="gradient-text">Before They Start</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 animate-fade-in-up delay-100">
            Dental labs lose 4–8% of cases to remakes from incomplete info.
            Preflight catches every missing detail <strong className="text-slate-700">before you touch the bench.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up delay-200">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:-translate-y-0.5">
              Start free — 14 days
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-semibold border border-slate-200 hover:border-blue-300 transition-colors">
              Sign in to your lab
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 animate-fade-in delay-400">
            {[
              { n: '4–8%', label: 'avg remake rate reduced' },
              { n: '3h', label: 'saved per week on calls' },
              { n: '100%', label: 'digital audit trail' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{s.n}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How it works</h2>
          <p className="text-slate-500">Three steps. No installation. Ready in minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: (
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                  <rect width="32" height="32" rx="10" fill="#EFF6FF"/>
                  <path d="M10 16h12M16 10v12" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              title: 'Add your clinics',
              desc: 'Register each clinic that sends you cases. Each gets a unique secure submission link — no account needed on their side.',
            },
            {
              step: '02',
              icon: (
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                  <rect width="32" height="32" rx="10" fill="#EFF6FF"/>
                  <path d="M10 12h12M10 16h8M10 20h6" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="24" cy="22" r="4" fill="#059669" stroke="white" strokeWidth="1.5"/>
                  <path d="M22.5 22l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'Clinic submits the case',
              desc: 'Dentist fills a structured form — patient ref, tooth numbers, restoration type, shade, deadline, files. Automatic QA checks run instantly.',
            },
            {
              step: '03',
              icon: (
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                  <rect width="32" height="32" rx="10" fill="#EFF6FF"/>
                  <path d="M16 10l4 4-8 8-4-4 8-8z" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 14l2-2a2 2 0 0 0-2.8-2.8L17 11" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ),
              title: 'You get a clean brief',
              desc: 'Only cases that pass preflight reach your bench. Missing info triggers a clarification request to the clinic automatically.',
            },
          ].map((item, i) => (
            <div key={i} className="card p-6 animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start gap-4">
                {item.icon}
                <div>
                  <div className="text-xs font-bold text-blue-400 mb-1">STEP {item.step}</div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section style={{ background: '#F1F5F9' }} className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Everything your lab needs</h2>
            <p className="text-slate-500">Built specifically for labs with 1–10 technicians.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: '🔍', title: 'Auto QA', desc: '6 preflight rules run on every submission' },
              { icon: '📋', title: 'Case log', desc: 'Full audit trail, every event recorded' },
              { icon: '💬', title: 'Clarifications', desc: 'Built-in thread, no email back-and-forth' },
              { icon: '📎', title: 'File uploads', desc: 'STL, photos, PDFs — attached to the case' },
              { icon: '🔗', title: 'Submit links', desc: 'Clinics submit without an account' },
              { icon: '📊', title: 'Dashboard', desc: 'Live status of all active cases' },
            ].map((f) => (
              <div key={f.title} className="card p-4 text-center hover:border-blue-200 transition-colors">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-xs font-semibold text-slate-900 mb-1">{f.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="rounded-2xl text-center p-12" style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)'
        }}>
          <h2 className="text-2xl font-bold text-white mb-3">Start your free trial today</h2>
          <p className="text-blue-200 mb-8 text-sm">No credit card. 14 days free. Cancel any time.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
            Create free lab account
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <p className="text-blue-300 text-xs mt-4">After trial: €29/month or €249/year</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Dental Case Preflight</span>
          </div>
          <div className="text-slate-400 text-xs">
            © {new Date().getFullYear()} · Built for dental laboratory professionals
          </div>
        </div>
      </footer>
    </div>
  )
}
