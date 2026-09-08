import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LabNav from '@/components/ui/LabNav'

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch lab
  const { data: lab } = await supabase
    .from('labs')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!lab) redirect('/register')

  return (
    <div className="min-h-screen bg-gray-50">
      <LabNav labName={lab.name} userEmail={user.email ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
