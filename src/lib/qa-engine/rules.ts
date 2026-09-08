// Dental Case Preflight — QA Engine (Deterministic Rules)
// No AI. Pure rule-based validation.

import type { CaseSubmissionData, QAIssue, QAResult } from '@/lib/types'
import { SHADE_REQUIRED_TYPES } from '@/lib/types'

// Valid FDI tooth notation: 11-18, 21-28, 31-38, 41-48
const FDI_PATTERN = /^([1-4][1-8])$/

function isValidFDI(tooth: string): boolean {
  return FDI_PATTERN.test(tooth.trim())
}

function isFutureDate(dateStr: string): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

// ─── Rules ────────────────────────────────────────────────────────────────────

function checkPatientRef(data: CaseSubmissionData): QAIssue {
  const passed = Boolean(data.patient_ref?.trim())
  return {
    ruleId: 'RULE_001',
    passed,
    message: passed ? 'Patient reference is present.' : 'Patient reference is required.',
    severity: 'error',
  }
}

function checkToothNumbers(data: CaseSubmissionData): QAIssue {
  const hasAtLeastOne = data.tooth_numbers?.length > 0
  const allValid = data.tooth_numbers?.every(isValidFDI)
  const passed = hasAtLeastOne && allValid

  let message = 'Tooth numbers are valid (FDI notation).'
  if (!hasAtLeastOne) message = 'At least one tooth number is required.'
  else if (!allValid) {
    const invalid = data.tooth_numbers.filter((t) => !isValidFDI(t))
    message = `Invalid tooth numbers: ${invalid.join(', ')}. Use FDI notation (11–48).`
  }

  return { ruleId: 'RULE_002', passed, message, severity: 'error' }
}

function checkRestorationType(data: CaseSubmissionData): QAIssue {
  const passed = Boolean(data.restoration_type?.trim())
  return {
    ruleId: 'RULE_003',
    passed,
    message: passed ? 'Restoration type is specified.' : 'Restoration type is required.',
    severity: 'error',
  }
}

function checkShade(data: CaseSubmissionData): QAIssue {
  const requiresShade = SHADE_REQUIRED_TYPES.includes(data.restoration_type)
  if (!requiresShade) {
    return {
      ruleId: 'RULE_004',
      passed: true,
      message: 'Shade not required for this restoration type.',
      severity: 'warning',
    }
  }

  const passed = Boolean(data.shade?.trim())
  return {
    ruleId: 'RULE_004',
    passed,
    message: passed
      ? 'Shade is specified.'
      : `Shade is required for ${data.restoration_type}.`,
    severity: 'error',
  }
}

function checkDeadline(data: CaseSubmissionData): QAIssue {
  if (!data.deadline) {
    return {
      ruleId: 'RULE_005',
      passed: false,
      message: 'Deadline is required.',
      severity: 'error',
    }
  }
  const passed = isFutureDate(data.deadline)
  return {
    ruleId: 'RULE_005',
    passed,
    message: passed ? 'Deadline is a valid future date.' : 'Deadline must be a future date.',
    severity: 'error',
  }
}

function checkFiles(fileCount: number): QAIssue {
  const passed = fileCount > 0
  return {
    ruleId: 'RULE_006',
    passed,
    message: passed
      ? `${fileCount} file(s) attached.`
      : 'At least one file (photo or prescription) must be attached.',
    severity: 'error',
  }
}

// ─── Main QA Runner ────────────────────────────────────────────────────────────

export function runQA(data: CaseSubmissionData, fileCount: number): QAResult {
  const issues: QAIssue[] = [
    checkPatientRef(data),
    checkToothNumbers(data),
    checkRestorationType(data),
    checkShade(data),
    checkDeadline(data),
    checkFiles(fileCount),
  ]

  const passed = issues.every((issue) => issue.passed || issue.severity === 'warning')

  return {
    passed,
    issues,
    runAt: new Date().toISOString(),
  }
}

// ─── Error Summary ─────────────────────────────────────────────────────────────

export function getQAErrors(result: QAResult): QAIssue[] {
  return result.issues.filter((i) => !i.passed && i.severity === 'error')
}

export function getQAWarnings(result: QAResult): QAIssue[] {
  return result.issues.filter((i) => !i.passed && i.severity === 'warning')
}
