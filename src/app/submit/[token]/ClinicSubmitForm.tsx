'use client'

import { useState, useRef } from 'react'
import { RESTORATION_TYPES } from '@/lib/types'

interface Props {
  clinicId: string
  clinicToken: string
}

export default function ClinicSubmitForm({ clinicId, clinicToken }: Props) {
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Parse tooth numbers (comma or space separated)
    const tooth_numbers = form.tooth_numbers_raw
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)

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

    const res = await fetch('/api/submit', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Submission failed. Please try again.')
    } else {
      setSubmitted(true)
      setCaseNumber(data.caseNumber)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Submitted!</h2>
        <p className="text-gray-500 text-sm">
          Case reference: <strong className="font-mono">#{caseNumber}</strong>
        </p>
        <p className="text-gray-400 text-sm mt-2">
          The lab will review your case and may contact you if clarifications are needed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Patient Reference <span className="text-red-500">*</span>
        </label>
        <input
          name="patient_ref"
          value={form.patient_ref}
          onChange={handleChange}
          required
          placeholder="e.g. PT-2024-001 (no full patient name)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Use a patient code or initials, not a full name.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tooth Numbers (FDI) <span className="text-red-500">*</span>
        </label>
        <input
          name="tooth_numbers_raw"
          value={form.tooth_numbers_raw}
          onChange={handleChange}
          required
          placeholder="e.g. 11, 12, 21"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">Comma or space separated. FDI notation (11–48).</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Restoration Type <span className="text-red-500">*</span>
        </label>
        <select
          name="restoration_type"
          value={form.restoration_type}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select type…</option>
          {RESTORATION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shade
        </label>
        <input
          name="shade"
          value={form.shade}
          onChange={handleChange}
          placeholder="e.g. A2, B1 (required for ceramic/veneer)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deadline <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
          required
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any special instructions, allergies, occlusion notes…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Files <span className="text-red-500">*</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          {files.length > 0 ? (
            <div>
              <p className="text-sm text-gray-700 font-medium">{files.length} file(s) selected</p>
              <ul className="text-xs text-gray-500 mt-1">
                {files.map((f) => <li key={f.name}>{f.name}</li>)}
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">Click to upload photos, STL files, or prescription PDF</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, STL, PDF — max 20MB each</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.stl"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Submitting case…' : 'Submit Case to Lab'}
      </button>
    </form>
  )
}
