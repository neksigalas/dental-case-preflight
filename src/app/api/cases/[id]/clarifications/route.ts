import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { question } = await req.json() as { question: string }

  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: lab } = await supabase
    .from('labs')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!lab) return NextResponse.json({ error: 'Lab not found' }, { status: 404 })

  // Verify case belongs to lab
  const { data: c } = await supabase
    .from('cases')
    .select('id')
    .eq('id', id)
    .eq('lab_id', lab.id)
    .single()

  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

  const service = createServiceClient()

  // Insert clarification thread
  const { error } = await service.from('clarification_threads').insert({
    case_id: id,
    question: question.trim(),
    asked_by: 'lab',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log event
  await service.from('case_events').insert({
    case_id: id,
    event_type: 'CLARIFICATION_REQUESTED',
    actor: 'lab',
    actor_label: 'Lab',
    payload: { question: question.trim() },
  })

  return NextResponse.json({ ok: true })
}
