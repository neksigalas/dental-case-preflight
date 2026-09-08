import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_COLORS, type CaseStatus } from '@/lib/types'

interface SearchParams {
  status?: string
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lab } = await supabase
    .from('labs')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  let query = supabase
    .from('cases')
    .select('*, clinics(name)')
    .eq('lab_id', lab!.id)
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: cases } = await query

  const statuses = Object.keys(STATUS_LABELS) as CaseStatus[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Cases</h1>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Link
          href="/cases"
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !params.status
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/cases?status=${s}`}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              params.status === s
                ? 'bg-blue-600 text-white'
                : `${STATUS_COLORS[s]} border border-transparent hover:opacity-80`
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {!cases || cases.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400 text-sm">
            No cases {params.status ? `with status "${STATUS_LABELS[params.status as CaseStatus]}"` : 'yet'}.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      #{c.case_number}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{c.patient_ref}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.clinics?.name} · {c.restoration_type}
                    {c.deadline && ` · Due ${new Date(c.deadline).toLocaleDateString()}`}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[c.status as CaseStatus]}`}
                >
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
