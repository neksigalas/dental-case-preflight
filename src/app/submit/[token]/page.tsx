import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import ClinicSubmitForm from './ClinicSubmitForm'

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const service = createServiceClient()

  const { data: clinic } = await service
    .from('clinics')
    .select('*, labs(name)')
    .eq('submission_token', token)
    .eq('active', true)
    .single()

  if (!clinic) notFound()

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          {/* Lab logo / identity */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path d="M15 5c0 6 3 10 7 12M15 5c0 6-3 10-7 12" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="15" cy="10" r="2.5" fill="#2563EB"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900">{clinic.labs?.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Case submission from <strong className="text-slate-600">{clinic.name}</strong>
          </p>

          {/* Info badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full mt-3">
            <svg width="10" height="10" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2 2 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Secure submission · QA checked automatically
          </div>
        </div>

        {/* Form card */}
        <div className="card p-6 sm:p-8 animate-fade-in-up">
          <ClinicSubmitForm clinicId={clinic.id} clinicToken={token} />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-slate-400">
            🔒 Your data is transmitted securely and stored in the EU.
          </p>
          <p className="text-xs text-slate-300">
            Powered by{' '}
            <a href="/" className="hover:text-slate-500 transition-colors">Dental Case Preflight</a>
          </p>
        </div>
      </div>
    </div>
  )
}
