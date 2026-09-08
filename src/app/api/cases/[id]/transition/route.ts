import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { VALID_TRANSITIONS, type CaseStatus } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { toStatus } = await req.json() as { toStatus: CaseStatus }

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: lab } = await supabase
    .from('labs')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!lab) return NextResponse.json({ error: 'Lab not found' }, { status: 404 })

  // Fetch case
  const { data: c } = await supabase
    .from('cases')
    .select('id, status, lab_id')
    .eq('id', id)
    .eq('lab_id', lab.id)
    .single()

  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  // Validate transition
  const currentStatus = c.status as CaseStatus
  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed.includes(toStatus)) {
    return NextResponse.json(
      { error: `Invalid transition: ${currentStatus} → ${toStatus}` },
      { status: 400 }
    )
  }

  // Apply transition using service client (bypasses RLS for event insert)
  const service = createServiceClient()

  const { error: updateError } = await service
    .from('cases')
    .update({ status: toStatus, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Write immutable event
  await service.from('case_events').insert({
    case_id: id,
    event_type: `STATUS_CHANGED_TO_${toStatus}`,
    actor: 'lab',
    actor_label: 'Lab',
    payload: { from: currentStatus, to: toStatus },
  })

  return NextResponse.json({ ok: true })
}
