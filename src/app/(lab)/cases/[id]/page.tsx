import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS, type CaseStatus, type QAResult } from '@/lib/types'
import CaseActions from './CaseActions'
import ClarificationPanel from './ClarificationPanel'

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lab } = await supabase
    .from('labs')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const { data: c } = await supabase
    .from('cases')
    .select('*, clinics(name, contact_email), case_files(*), case_events(*), clarification_threads(*)')
    .eq('id', id)
    .eq('lab_id', lab!.id)
    .single()

  if (!c) notFound()

  const qaResult = c.qa_result as QAResult | null
  const status = c.status as CaseStatus

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 font-mono">#{c.case_number}</h1>
            <span className={`text-sm px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {c.clinics?.name} · Patient ref: {c.patient_ref}
          </p>
        </div>
        <CaseActions caseId={id} status={status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Case Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Case Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500 font-medium">Restoration</dt>
                <dd className="text-gray-900 mt-0.5">{c.restoration_type || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium">Shade</dt>
                <dd className="text-gray-900 mt-0.5">{c.shade || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium">Tooth Numbers</dt>
                <dd className="text-gray-900 mt-0.5">
                  {c.tooth_numbers?.length > 0 ? c.tooth_numbers.join(', ') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 font-medium">Deadline</dt>
                <dd className="text-gray-900 mt-0.5">
                  {c.deadline ? new Date(c.deadline).toLocaleDateString() : '—'}
                </dd>
              </div>
              {c.notes && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500 font-medium">Notes</dt>
                  <dd className="text-gray-900 mt-0.5 whitespace-pre-wrap">{c.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Files */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Files ({c.case_files?.length ?? 0})
            </h2>
            {!c.case_files || c.case_files.length === 0 ? (
              <p className="text-sm text-gray-400">No files attached.</p>
            ) : (
              <ul className="space-y-2">
                {c.case_files.map((f: { id: string; file_name: string; file_type: string; file_size_bytes: number | null }) => (
                  <li key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-gray-400">📎</span>
                    <span className="truncate">{f.file_name}</span>
                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                      {f.file_size_bytes ? `${Math.round(f.file_size_bytes / 1024)}KB` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* QA Result */}
          {qaResult && (
            <div className={`rounded-xl border p-5 ${qaResult.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                QA Result — {qaResult.passed ? '✓ Passed' : '✗ Issues Found'}
              </h2>
              <ul className="space-y-2">
                {qaResult.issues.map((issue) => (
                  <li key={issue.ruleId} className="flex items-start gap-2 text-sm">
                    <span>{issue.passed ? '✓' : issue.severity === 'error' ? '✗' : '⚠'}</span>
                    <span className={issue.passed ? 'text-gray-600' : issue.severity === 'error' ? 'text-red-700' : 'text-yellow-700'}>
                      {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clarifications */}
          <ClarificationPanel
            caseId={id}
            threads={c.clarification_threads ?? []}
            status={status}
          />
        </div>

        {/* Right: Event Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h2>
            {!c.case_events || c.case_events.length === 0 ? (
              <p className="text-sm text-gray-400">No events yet.</p>
            ) : (
              <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                {[...c.case_events].reverse().map((ev: { id: string; event_type: string; actor_label: string | null; actor: string; created_at: string; payload: Record<string, unknown> }) => (
                  <li key={ev.id} className="ml-4">
                    <div className="absolute -left-1.5 w-3 h-3 bg-blue-200 rounded-full border-2 border-white" />
                    <p className="text-xs font-medium text-gray-900">{ev.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">
                      {ev.actor_label ?? ev.actor} · {new Date(ev.created_at).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
