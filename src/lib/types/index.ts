// Dental Case Preflight — Core Types

export type SubscriptionStatus = 'trial' | 'active' | 'inactive' | 'cancelled'

export type CaseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'QA_REVIEW'
  | 'NEEDS_CLARIFICATION'
  | 'PRODUCTION_READY'
  | 'CLOSED'

export type UploadedBy = 'clinic' | 'lab'
export type EventActor = 'clinic' | 'lab' | 'system'

// ─── Database Row Types ────────────────────────────────────────────────────────

export interface Lab {
  id: string
  name: string
  owner_id: string
  whop_license_key: string | null
  subscription_status: SubscriptionStatus
  created_at: string
}

export interface Clinic {
  id: string
  lab_id: string
  name: string
  contact_email: string | null
  submission_token: string
  active: boolean
  created_at: string
}

export interface Case {
  id: string
  lab_id: string
  clinic_id: string
  case_number: string
  patient_ref: string
  tooth_numbers: string[]
  restoration_type: string
  shade: string
  deadline: string | null
  notes: string
  status: CaseStatus
  qa_result: QAResult | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface CaseFile {
  id: string
  case_id: string
  file_name: string
  file_type: string
  storage_path: string
  file_size_bytes: number | null
  uploaded_by: UploadedBy
  created_at: string
}

export interface CaseEvent {
  id: string
  case_id: string
  event_type: string
  actor: EventActor
  actor_label: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface ClarificationThread {
  id: string
  case_id: string
  question: string
  asked_by: string
  asked_at: string
  answer: string | null
  answered_at: string | null
  resolved: boolean
}

// ─── QA Engine Types ───────────────────────────────────────────────────────────

export type QAIssueSeverity = 'error' | 'warning'

export interface QAIssue {
  ruleId: string
  passed: boolean
  message: string
  severity: QAIssueSeverity
}

export interface QAResult {
  passed: boolean
  issues: QAIssue[]
  runAt: string
}

// ─── Clinic Submission Form ────────────────────────────────────────────────────

export interface CaseSubmissionData {
  patient_ref: string
  tooth_numbers: string[]
  restoration_type: string
  shade: string
  deadline: string
  notes: string
}

// ─── Case with relations ───────────────────────────────────────────────────────

export interface CaseWithRelations extends Case {
  clinics?: Clinic
  case_files?: CaseFile[]
  case_events?: CaseEvent[]
  clarification_threads?: ClarificationThread[]
}

// ─── Valid Status Transitions ──────────────────────────────────────────────────

export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['QA_REVIEW'],
  QA_REVIEW: ['NEEDS_CLARIFICATION', 'PRODUCTION_READY'],
  NEEDS_CLARIFICATION: ['QA_REVIEW'],
  PRODUCTION_READY: ['CLOSED'],
  CLOSED: [],
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  QA_REVIEW: 'QA Review',
  NEEDS_CLARIFICATION: 'Needs Clarification',
  PRODUCTION_READY: '✓ Production Ready',
  CLOSED: 'Closed',
}

export const STATUS_COLORS: Record<CaseStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  QA_REVIEW: 'bg-yellow-100 text-yellow-700',
  NEEDS_CLARIFICATION: 'bg-orange-100 text-orange-700',
  PRODUCTION_READY: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}

// ─── Restoration Types ─────────────────────────────────────────────────────────

export const RESTORATION_TYPES = [
  'Full-Ceramic Crown',
  'PFM Crown',
  'All-Metal Crown',
  'Veneer',
  'Inlay / Onlay',
  'Bridge',
  'Implant Crown',
  'Denture',
  'Removable Partial Denture',
  'Night Guard',
  'Other',
] as const

export type RestorationType = (typeof RESTORATION_TYPES)[number]

// Restoration types that require shade
export const SHADE_REQUIRED_TYPES: string[] = [
  'Full-Ceramic Crown',
  'Veneer',
  'Bridge',
  'Implant Crown',
  'PFM Crown',
]
