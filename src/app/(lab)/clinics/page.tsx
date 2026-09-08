import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AddClinicForm from './AddClinicForm'

export default async function ClinicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lab } = await supabase
    .from('labs')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  const { data: clinics } = await supabase
    .from('clinics')
    .select('*')
    .eq('lab_id', lab!.id)
    .order('created_at', { ascending: false })

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dental-case-preflight.vercel.app'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clinics</h1>
      </div>

      {/* Add Clinic Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Add a New Clinic</h2>
        <AddClinicForm labId={lab!.id} />
      </div>

      {/* Clinic List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Your Clinics ({clinics?.length ?? 0})
          </h2>
        </div>
        {!clinics || clinics.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">
            No clinics yet. Add one above.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="px-4 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{clinic.name}</p>
                    {clinic.contact_email && (
                      <p className="text-xs text-gray-500 mt-0.5">{clinic.contact_email}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${clinic.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {clinic.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Submission link (share with clinic):</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-blue-700 break-all flex-1">
                      {origin}/submit/{clinic.submission_token}
                    </code>
                    <Link
                      href={`/submit/${clinic.submission_token}`}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Preview →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
