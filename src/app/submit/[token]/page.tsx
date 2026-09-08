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

  // Look up clinic by submission token
  const { data: clinic } = await service
    .from('clinics')
    .select('*, labs(name)')
    .eq('submission_token', token)
    .eq('active', true)
    .single()

  if (!clinic) notFound()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🦷</div>
          <h1 className="text-xl font-bold text-gray-900">{clinic.labs?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Submit a case from <strong>{clinic.name}</strong>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ClinicSubmitForm clinicId={clinic.id} clinicToken={token} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Dental Case Preflight · Your case data is sent securely.
        </p>
      </div>
    </div>
  )
}
