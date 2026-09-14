import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@/lib/supabase/service'
import { createClient as createSessionClient } from '@/lib/supabase/server'

// Creates the lab row for the user who has just signed up. The insert needs the
// service role (RLS), so the caller must prove who they are first: the userId in
// the body has to be the user of the session cookie that signUp just set.
// Before 14/9/2026 any userId was accepted, so anyone could attach a lab to an
// account that was not theirs.
export async function POST(req: NextRequest) {
  try {
    const { userId, labName } = await req.json()

    if (!userId || !labName || typeof labName !== 'string' || labName.length > 120) {
      return NextResponse.json({ error: 'Missing or invalid userId or labName' }, { status: 400 })
    }

    const session = await createSessionClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Not signed in as this user' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // One lab per owner: a repeated call must not create a second lab
    const { data: existing } = await supabase.from('labs').select('id').eq('owner_id', userId).maybeSingle()
    if (existing) return NextResponse.json({ success: true, existing: true })

    const { error } = await supabase.from('labs').insert({
      name: labName.trim(),
      owner_id: userId,
      subscription_status: 'trial',
    })

    if (error) {
      console.error('Lab insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Register lab error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
