'use client'

import { useState, useRef } from 'react'
import { RESTORATION_TYPES, SHADE_REQUIRED_TYPES } from '@/lib/types'
import { runQA } from '@/lib/qa-engine/rules'

// Which wizard step owns each QA rule, so a failing rule stops the clinic on the
// step where it can be fixed. The same rules run again on the server.
const RULE_STEP: Record<string, Step> = {
  RULE_001: 1, RULE_002: 1, RULE_003: 2, RULE_004: 2, RULE_005: 2, RULE_006: 3,
}

interface Props {
  clinicId: string
  clinicToken: string
}

type Step = 1 | 2 | 3

const STEPS = [
  { n: 1, label: 'Patient' },
  { n: 2, label: 'Restoration' },
  { n: 3, label: 'Files & Submit' },
]

export default function ClinicSubmitForm({ clinicId, clinicToken }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState({
    patient_ref: '',
    tooth_numbers_raw: '',
    restoration_type: '',
    shade: '',
    deadline: '',
    notes: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [caseNumber, setCaseNumber] = useState('')
  const [openIssues, setOpenIssues] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      /\.(jpg|jpeg|png|pdf|stl)$/i.test(f.name)
    )
    if (dropped.length) setFiles(prev => [...prev, ...dropped])
  }

  function toothNumbers(): string[] {
    return form.tooth_numbers_raw.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean)
  }

  // The preflight itself: the clinic sees what the lab would reject before sending.
  function validateStep(s: Step): string | null {
    const qa = runQA({ ...form, tooth_numbers: toothNumbers() }, files.length)
    const failed = qa.issues.find(
      (i) => !i.passed && i.severity === 'error' && RULE_STEP[i.ruleId] === s
    )
    return failed ? failed.message : null
  }

  function nextStep() {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep((prev) => (prev + 1) as Step)
  }

  function prevStep() {
    setError('')
    setStep((prev) => (prev - 1) as Step)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateStep(3)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')

    const tooth_numbers = toothNumbers()

    const formData = new FormData()
    formData.append('clinicId', clinicId)
    formData.append('clinicToken', clinicToken)
    formData.append('patient_ref', form.patient_ref)
    formData.append('tooth_numbers', JSON.stringify(tooth_numbers))
    formData.append('restoration_type', form.restoration_type)
    formData.append('shade', form.shade)
    formData.append('deadline', form.deadline)
    formData.append('notes', form.notes)
    files.forEach((f) => formData.append('files', f))

    const res = await fetch('/api/submit', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Submission failed. Please try again.')
    } else {
      setSubmitted(true)
      setCaseNumber(data.caseNumber)
      setOpenIssues(data.qaIssues ?? [])
    }
    setLoading(false)
  }

  // ── Success screen ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="text-center py-10 animate-scale-in">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
            <path d="M6 14l5 5L22 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Case Submitted!</h2>
        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mb-4">
          <span className="text-xs text-slate-500">Case reference</span>
          <span className="font-mono font-bold text-slate-900">#{caseNumber}</span>
        </div>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          The lab will review your case. If anything is missing, they&apos;ll contact you directly.
        </p>
        {openIssues.length === 0 ? (
          <div className="mt-6 p-4 rounded-xl text-left max-w-xs mx-auto"
            style={{ background: '#F0FDF4', border: '1px solid #D1FAE5' }}>
            <p className="text-xs text-emerald-700 font-medium mb-1">✓ QA checks passed</p>
            <p className="text-xs text-emerald-600">Your submission was checked for completeness. The lab received a complete brief.</p>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl text-left max-w-xs mx-auto"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-xs text-amber-800 font-medium mb-1">The lab may contact you about:</p>
            <ul className="text-xs text-amber-700 list-disc pl-4 space-y-0.5">
              {openIssues.map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // ── Step indicator ────────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step > s.n
                ? 'bg-blue-600 text-white'
                : step === s.n
                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {step > s.n
                ? <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : s.n}
            </div>
            <span className={`text-xs mt-1 font-medium ${step === s.n ? 'text-blue-700' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 mx-2 mb-4 transition-colors ${step > s.n ? 'bg-blue-400' : 'bg-slate-200'}`}/>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <StepIndicator />

      {/* ── Step 1: Patient info ───────────────────────────────────── */}
      {step === 1 && (
        <div className="animate-fade-in-up space-y-5">
          <div className="text-center mb-6">
            <div className="text-2xl mb-2">👤</div>
            <h3 className="font-semibold text-slate-900">Patient Information</h3>
            <p className="text-sm text-slate-400 mt-1">Use a code or initials — no full names needed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Patient Reference <span className="text-red-500">*</span>
            </label>
            <input
              name="patient_ref"
              value={form.patient_ref}
              onChange={handleChange}
              required
              placeholder="e.g. PT-2024-001 or JS"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <svg width="11" height="11" fill="none" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="4.5" stroke="#94A3B8" strokeWidth="1"/><path d="M5.5 4v2.5M5.5 8h.01" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round"/></svg>
              Use a patient code or initials, not a full name (GDPR).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tooth Numbers (FDI) <span className="text-red-500">*</span>
            </label>
            <input
              name="tooth_numbers_raw"
              value={form.tooth_numbers_raw}
              onChange={handleChange}
              required
              placeholder="e.g. 11, 12, 21"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <svg width="11" height="11" fill="none" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="4.5" stroke="#94A3B8" strokeWidth="1"/><path d="M5.5 4v2.5M5.5 8h.01" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round"/></svg>
              FDI notation (11–48). Comma or space separated.
            </p>
            {/* FDI quick guide */}
            <div className="mt-2 grid grid-cols-4 gap-1 text-xs text-center text-slate-400">
              {[['18-11','UR'],['21-28','UL'],['48-41','LR'],['31-38','LL']].map(([range, quad]) => (
                <div key={quad} className="bg-slate-50 rounded-lg py-1.5 px-1">
                  <div className="font-mono text-slate-600">{range}</div>
                  <div>{quad}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Restoration details ────────────────────────────── */}
      {step === 2 && (
        <div className="animate-fade-in-up space-y-5">
          <div className="text-center mb-6">
            <div className="text-2xl mb-2">🦷</div>
            <h3 className="font-semibold text-slate-900">Restoration Details</h3>
            <p className="text-sm text-slate-400 mt-1">Specify what needs to be made and when.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Restoration Type <span className="text-red-500">*</span>
            </label>
            <select
              name="restoration_type"
              value={form.restoration_type}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select type…</option>
              {RESTORATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Shade
              {SHADE_REQUIRED_TYPES.includes(form.restoration_type) && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              name="shade"
              value={form.shade}
              onChange={handleChange}
              placeholder="e.g. A2, B1, OM1"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {['A1','A2','A3','B1','B2','C2'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, shade: s }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    form.shade === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {s}
                </button>
              ))}
              <span className="text-xs text-slate-400 self-center">Vita</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Special instructions, occlusion notes, allergies, bite info…"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Step 3: Files ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="animate-fade-in-up space-y-5">
          <div className="text-center mb-6">
            <div className="text-2xl mb-2">📎</div>
            <h3 className="font-semibold text-slate-900">Attach Files</h3>
            <p className="text-sm text-slate-400 mt-1">Photos, STL files, or the prescription PDF.</p>
          </div>

          {/* Summary of what was filled */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Case Summary</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-400">Patient:</span> <span className="font-medium text-slate-700">{form.patient_ref}</span></div>
              <div><span className="text-slate-400">Teeth:</span> <span className="font-medium text-slate-700">{form.tooth_numbers_raw}</span></div>
              <div><span className="text-slate-400">Type:</span> <span className="font-medium text-slate-700">{form.restoration_type}</span></div>
              {form.shade && <div><span className="text-slate-400">Shade:</span> <span className="font-medium text-slate-700">{form.shade}</span></div>}
              <div><span className="text-slate-400">Deadline:</span> <span className="font-medium text-slate-700">{form.deadline ? new Date(form.deadline).toLocaleDateString() : '—'}</span></div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl px-4 py-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : files.length > 0
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {files.length > 0 ? (
              <div>
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm font-semibold text-slate-700">{files.length} file{files.length > 1 ? 's' : ''} ready</p>
                <ul className="text-xs text-slate-500 mt-2 space-y-0.5">
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center justify-center gap-1.5">
                      <span>📄</span>
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span className="text-slate-400">({Math.round(f.size / 1024)}KB)</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 mt-3 hover:underline">Click to add more files</p>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-3">☁️</div>
                <p className="text-sm font-medium text-slate-700">Drop files here or click to upload</p>
                <p className="text-xs text-slate-400 mt-1">Photos, STL, PDF · Max 20MB each</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.stl"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-scale-in">
          <svg width="15" height="15" fill="none" viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="6.5" stroke="#DC2626" strokeWidth="1.3"/><path d="M7.5 4.5V8M7.5 10.5h.01" stroke="#DC2626" strokeWidth="1.3" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      {/* ── Navigation buttons ─────────────────────────────────────── */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            Continue →
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><span className="spinner"></span> Submitting…</> : '🚀 Submit Case to Lab'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-5 flex gap-1">
        {STEPS.map((s) => (
          <div key={s.n} className={`h-1 flex-1 rounded-full transition-all ${step >= s.n ? 'bg-blue-500' : 'bg-slate-200'}`} />
        ))}
      </div>
    </form>
  )
}
