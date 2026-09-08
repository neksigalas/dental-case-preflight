-- Dental Case Preflight — Initial Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- LABS
-- ============================================================
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whop_license_key TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'inactive', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CLINICS
-- ============================================================
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_email TEXT,
  submission_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CASES
-- ============================================================
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE RESTRICT,
  case_number TEXT NOT NULL,
  patient_ref TEXT NOT NULL,          -- Patient code, NOT full name (GDPR)
  tooth_numbers TEXT[] NOT NULL DEFAULT '{}',
  restoration_type TEXT NOT NULL DEFAULT '',
  shade TEXT NOT NULL DEFAULT '',
  deadline DATE,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
      'DRAFT', 'SUBMITTED', 'QA_REVIEW',
      'NEEDS_CLARIFICATION', 'PRODUCTION_READY', 'CLOSED'
    )),
  qa_result JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate case number
CREATE SEQUENCE case_number_seq START 1000;

-- ============================================================
-- CASE FILES
-- ============================================================
CREATE TABLE case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('clinic', 'lab')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CASE EVENTS (immutable event log)
-- ============================================================
CREATE TABLE case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,                -- 'clinic' | 'lab' | 'system'
  actor_label TEXT,                   -- human readable
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- case_events is immutable — no UPDATE or DELETE
CREATE RULE case_events_no_update AS ON UPDATE TO case_events DO INSTEAD NOTHING;
CREATE RULE case_events_no_delete AS ON DELETE TO case_events DO INSTEAD NOTHING;

-- ============================================================
-- CLARIFICATION THREADS
-- ============================================================
CREATE TABLE clarification_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  asked_by TEXT NOT NULL DEFAULT 'lab',
  asked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answer TEXT,
  answered_at TIMESTAMPTZ,
  resolved BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_cases_lab_id ON cases(lab_id);
CREATE INDEX idx_cases_clinic_id ON cases(clinic_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_case_events_case_id ON case_events(case_id);
CREATE INDEX idx_case_files_case_id ON case_files(case_id);
CREATE INDEX idx_clinics_submission_token ON clinics(submission_token);
CREATE INDEX idx_clinics_lab_id ON clinics(lab_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarification_threads ENABLE ROW LEVEL SECURITY;

-- LABS: owner can read/write their own lab
CREATE POLICY labs_owner_all ON labs
  FOR ALL USING (owner_id = auth.uid());

-- CLINICS: lab owner can manage clinics in their lab
CREATE POLICY clinics_lab_owner_all ON clinics
  FOR ALL USING (
    lab_id IN (SELECT id FROM labs WHERE owner_id = auth.uid())
  );

-- CLINICS: public read by submission_token (for clinic submission page)
-- NOTE: this is handled via service_role in the API, not direct RLS
-- The /submit/[token] API verifies token server-side

-- CASES: lab owner can manage all cases in their lab
CREATE POLICY cases_lab_owner_all ON cases
  FOR ALL USING (
    lab_id IN (SELECT id FROM labs WHERE owner_id = auth.uid())
  );

-- CASE_FILES: same as cases
CREATE POLICY case_files_via_cases ON case_files
  FOR ALL USING (
    case_id IN (
      SELECT id FROM cases
      WHERE lab_id IN (SELECT id FROM labs WHERE owner_id = auth.uid())
    )
  );

-- CASE_EVENTS: lab owner can read, system/service role can insert
CREATE POLICY case_events_lab_read ON case_events
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases
      WHERE lab_id IN (SELECT id FROM labs WHERE owner_id = auth.uid())
    )
  );

-- CLARIFICATION_THREADS: lab owner manages
CREATE POLICY clarifications_lab_owner_all ON clarification_threads
  FOR ALL USING (
    case_id IN (
      SELECT id FROM cases
      WHERE lab_id IN (SELECT id FROM labs WHERE owner_id = auth.uid())
    )
  );
