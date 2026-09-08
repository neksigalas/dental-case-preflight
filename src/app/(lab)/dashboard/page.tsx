import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_COLORS, type CaseStatus } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lab } = await supabase
    .from('labs')
    .select('*')
    .eq('owner_id', user!.id)
    .single()

  // Case counts by status
  const { data: cases } = await supabase
    .from('cases')
    .select('id, status, created_at')
    .eq('lab_id', lab!.id)
    .order('created_at', { ascending: false })

  const counts: Record<string, number> = {}
  for (const c of (cases ?? [])) {
    counts[c.status] = (counts[c.status] ?? 0) + 1
  }

  const urgentStatuses: CaseStatus[] = ['QA_REVIEW', 'NEEDS_CLARIFICATION']
  const urgentCount = urgentStatuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lab?.subscription_status === 'trial' && '🟡 Trial period — '}
            {cases?.length ?? 0} total cases
          </p>
        </div>
        <Link
          href="/clinics"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Clinic
        </Link>
      </div>

      {/* Urgent Banner */}
      {urgentCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <span className="text-orange-700 text-sm font-medium">
            ⚠️ {urgentCount} case{urgentCount > 1 ? 's' : ''} need your attention
          </span>
          <Link href="/cases" className="text-orange-700 text-sm underline">
            View cases →
          </Link>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {(Object.keys(STATUS_LABELS) as CaseStatus[]).map((status) => (
          <Link
            key={status}
            href={`/cases?status=${status}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
          >
            <div className="text-2xl font-bold text-gray-900">{counts[status] ?? 0}</div>
            <div className={`text-xs mt-1 px-1.5 py-0.5 rounded-full inline-block ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Cases */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Cases</h2>
          <Link href="/cases" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        {!cases || cases.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">
            No cases yet.{' '}
            <Link href="/clinics" className="text-blue-600 hover:underline">
              Add a clinic to get started.
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cases.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700 font-mono">#{c.id.slice(0, 8)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status as CaseStatus]}`}>
                  {STATUS_LABELS[c.status as CaseStatus]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
