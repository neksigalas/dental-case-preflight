import { createClient } from '@/lib/supabase/server'
import type { Lab } from '@/lib/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lab } = await supabase
    .from('labs')
    .select('*')
    .eq('owner_id', user!.id)
    .single() as { data: Lab | null }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Lab Name</label>
          <p className="text-sm text-gray-900">{lab?.name}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Account Email</label>
          <p className="text-sm text-gray-900">{user?.email}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Subscription</label>
          <span className={`text-xs px-2 py-0.5 rounded-full inline-block ${
            lab?.subscription_status === 'active'
              ? 'bg-green-100 text-green-700'
              : lab?.subscription_status === 'trial'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {lab?.subscription_status ?? 'Unknown'}
          </span>
        </div>
        {lab?.subscription_status === 'trial' && (
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">Upgrade to unlock unlimited cases</p>
            <p className="text-xs text-blue-600 mb-3">
              Subscribe via WHOP to activate your lab plan.
            </p>
            <a
              href="https://whop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Upgrade →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
