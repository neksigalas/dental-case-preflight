// Public case submission API (no auth — uses clinic submission token)
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runQA } from '@/lib/qa-engine/rules'
import type { CaseSubmissionData } from '@/lib/types'

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const clinicId = formData.get('clinicId') as string
  const clinicToken = formData.get('clinicToken') as string
  const patient_ref = formData.get('patient_ref') as string
  const tooth_numbers = JSON.parse(formData.get('tooth_numbers') as string) as string[]
  const restoration_type = formData.get('restoration_type') as string
  const shade = (formData.get('shade') as string) ?? ''
  const deadline = formData.get('deadline') as string
  const notes = (formData.get('notes') as string) ?? ''
  const files = formData.getAll('files') as File[]

  // Validate token
  const service = createServiceClient()
  const { data: clinic } = await service
    .from('clinics')
    .select('id, lab_id')
    .eq('id', clinicId)
    .eq('submission_token', clinicToken)
    .eq('active', true)
    .single()

  if (!clinic) {
    return NextResponse.json({ error: 'Invalid submission link.' }, { status: 403 })
  }

  // Generate case number
  const { data: seqRow } = await service
    .rpc('nextval', { sequence_name: 'case_number_seq' })
    .single()
  const caseNumber = String(seqRow ?? Date.now()).padStart(6, '0')

  // Build submission data
  const submissionData: CaseSubmissionData = {
    patient_ref,
    tooth_numbers,
    restoration_type,
    shade,
    deadline,
    notes,
  }

  // Upload files first to count them
  const uploadedPaths: { file_name: string; file_type: string; storage_path: string; file_size_bytes: number }[] = []

  for (const file of files) {
    if (!file.name || file.size === 0) continue
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `cases/${clinic.lab_id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await service.storage
      .from('case-files')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (!uploadError) {
      uploadedPaths.push({
        file_name: file.name,
        file_type: file.type,
        storage_path: path,
        file_size_bytes: file.size,
      })
    }
  }

  // Run QA engine
  const qaResult = runQA(submissionData, uploadedPaths.length)

  // Insert case
  const { data: newCase, error: caseError } = await service
    .from('cases')
    .insert({
      lab_id: clinic.lab_id,
      clinic_id: clinicId,
      case_number: caseNumber,
      patient_ref,
      tooth_numbers,
      restoration_type,
      shade,
      deadline: deadline || null,
      notes,
      status: 'QA_REVIEW',
      qa_result: qaResult,
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (caseError || !newCase) {
    return NextResponse.json({ error: 'Failed to create case.' }, { status: 500 })
  }

  // Insert files
  if (uploadedPaths.length > 0) {
    await service.from('case_files').insert(
      uploadedPaths.map((f) => ({
        case_id: newCase.id,
        ...f,
        uploaded_by: 'clinic',
      }))
    )
  }

  // Log events
  await service.from('case_events').insert([
    {
      case_id: newCase.id,
      event_type: 'CASE_SUBMITTED',
      actor: 'clinic',
      actor_label: 'Clinic',
      payload: { tooth_numbers, restoration_type },
    },
    {
      case_id: newCase.id,
      event_type: 'QA_RUN',
      actor: 'system',
      actor_label: 'System',
      payload: { passed: qaResult.passed, issue_count: qaResult.issues.filter((i) => !i.passed).length },
    },
  ])

  return NextResponse.json({ ok: true, caseNumber })
}
