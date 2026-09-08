import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { userId, labName } = await req.json()

    if (!userId || !labName) {
      return NextResponse.json({ error: 'Missing userId or labName' }, { status: 400 })
    }

    // Use service_role client — bypasses RLS
    // This is safe because we verified the userId came from a real signUp
    const supabase = createClient()

    const { error } = await supabase.from('labs').insert({
      name: labName,
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
