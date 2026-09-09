import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_COLORS, type CaseStatus } from '@/lib/types'

const STATUS_ICONS: Record<CaseStatus, string> = {
  DRAFT: '📝',
  SUBMITTED: '📥',
  QA_REVIEW: '🔍',
  NEEDS_CLARIFICATION: '💬',
  PRODUCTION_READY: '✅',
  CLOSED: '📦',
}

const STATUS_DESC: Partial<Record<CaseStatus, string>> = {
  QA_REVIEW: 'Needs your review',
  NEEDS_CLARIFICATION: 'Waiting for clinic',
  PRODUCTION_READY: 'Ready for bench',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lab } = await supabase
    .from('labs')
    .select('*')
    .eq('owner_id', user!.id)
    .single()

  const { data: cases } = await supabase
    .from('cases')
    .select('id, status, created_at, case_number, patient_ref, restoration_type, deadline')
    .eq('lab_id', lab!.id)
    .order('created_at', { ascending: false })

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('lab_id', lab!.id)

  const counts: Record<string, number> = {}
  for (const c of (cases ?? [])) {
    counts[c.status] = (counts[c.status] ?? 0) + 1
  }

  const urgentStatuses: CaseStatus[] = ['QA_REVIEW', 'NEEDS_CLARIFICATION']
  const urgentCases = (cases ?? []).filter(c => urgentStatuses.includes(c.status as CaseStatus))

  const isNew = !cases || cases.length === 0
  const hasNoClinics = !clinics || clinics.length === 0

  return (
    <div className="animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {lab?.name || 'Dashboard'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {lab?.subscription_status === 'trial'
              ? '🟡 Trial period active'
              : lab?.subscription_status === 'active'
              ? '🟢 Subscription active'
              : '⚪ No active subscription'}
            {cases && cases.length > 0 ? ` · ${cases.length} total cases` : ''}
          </p>
        </div>
        <Link
          href="/clinics"
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-700 transition-all hover:shadow-md font-medium"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 13 13">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add Clinic
        </Link>
      </div>

      {/* ── Getting started guide (empty state) ─────────────────── */}
      {isNew && (
        <div className="card mb-6 overflow-hidden animate-scale-in">
          <div className="px-6 py-4 border-b border-slate-100" style={{
            background: 'linear-gradient(90deg, #EFF6FF 0%, #F0F9FF 100%)'
          }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">👋</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Welcome to Dental Case Preflight!</h2>
                <p className="text-xs text-slate-500 mt-0.5">Follow these 3 steps to receive your first case.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {[
              {
                step: 1,
                icon: '🏥',
                done: !hasNoClinics,
                title: 'Add a clinic',
                desc: 'Register the dental clinics that send you work. Each clinic gets a unique link.',
                action: { href: '/clinics', label: 'Add first clinic →' },
              },
              {
                step: 2,
                icon: '🔗',
                done: false,
                title: 'Share the submission link',
                desc: 'Copy the clinic\'s link and send it to the dentist. No account needed on their side.',
                action: null,
              },
              {
                step: 3,
                icon: '📋',
                done: false,
                title: 'Receive & review cases',
                desc: 'Cases appear here automatically. QA checks run instantly — you\'ll know if info is missing.',
                action: null,
              },
            ].map((item) => (
              <div key={item.step} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    item.done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.done ? '✓' : item.step}
                  </div>
                  <span className="text-lg">{item.icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                {item.action && (
                  <Link href={item.action.href} className="text-xs text-blue-600 hover:underline font-medium">
                    {item.action.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Urgent banner ────────────────────────────────────────── */}
      {urgentCases.length > 0 && (
        <div className="mb-6 animate-scale-in" style={{ animation: 'scaleIn 0.3s ease' }}>
          <div className="rounded-xl border border-orange-200 overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #FFF7ED 0%, #FFFBEB 100%)' }}>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="animate-pulse-ring w-2 h-2 bg-orange-500 rounded-full block"></span>
                <span className="text-sm font-semibold text-orange-800">
                  {urgentCases.length} case{urgentCases.length > 1 ? 's' : ''} need attention
                </span>
              </div>
              <Link href="/cases?status=QA_REVIEW" className="text-xs text-orange-700 font-medium hover:underline">
                Review now →
              </Link>
            </div>
            <div className="border-t border-orange-100 divide-y divide-orange-50">
              {urgentCases.slice(0, 3).map((c) => (
                <Link key={c.id} href={`/cases/${c.id}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-orange-600">#{c.case_number}</span>
                    <span className="text-xs text-orange-500">{c.patient_ref}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status as CaseStatus]}`}>
                    {STATUS_LABELS[c.status as CaseStatus]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Status cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {(Object.keys(STATUS_LABELS) as CaseStatus[]).map((status, i) => {
          const count = counts[status] ?? 0
          const isUrgent = urgentStatuses.includes(status) && count > 0
          return (
            <Link
              key={status}
              href={`/cases?status=${status}`}
              className={`card p-4 hover:border-blue-300 transition-all hover:-translate-y-0.5 hover:shadow-sm animate-fade-in-up ${
                isUrgent ? 'border-orange-200' : ''
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{STATUS_ICONS[status]}</span>
                {isUrgent && <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse-ring"></span>}
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{count}</div>
              <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </div>
              {STATUS_DESC[status] && (
                <div className="text-xs text-slate-400 mt-1">{STATUS_DESC[status]}</div>
              )}
            </Link>
          )
        })}
      </div>

      {/* ── Recent Cases ─────────────────────────────────────────── */}
      <div className="card animate-fade-in-up delay-300">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent Cases</h2>
          <Link href="/cases" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        {!cases || cases.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-medium text-slate-500">No cases yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add a clinic and share their submission link to start receiving cases.
            </p>
            <Link href="/clinics" className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 hover:underline font-medium">
              Add your first clinic →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {cases.slice(0, 8).map((c, i) => {
              const isUrgent = urgentStatuses.includes(c.status as CaseStatus)
              const isOverdue = c.deadline && new Date(c.deadline) < new Date()
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50 animate-fade-in`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 font-mono">#{c.case_number}</span>
                      {c.patient_ref && <span className="text-xs text-slate-400 truncate">{c.patient_ref}</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      {c.restoration_type && <span>{c.restoration_type}</span>}
                      {isOverdue && c.deadline && (
                        <span className="text-red-500 font-medium">⚠ Overdue</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUrgent && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[c.status as CaseStatus]}`}>
                      {STATUS_LABELS[c.status as CaseStatus]}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
