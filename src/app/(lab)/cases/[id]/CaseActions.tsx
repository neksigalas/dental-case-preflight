'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CaseStatus } from '@/lib/types'
import { VALID_TRANSITIONS, STATUS_LABELS } from '@/lib/types'

interface Props {
  caseId: string
  status: CaseStatus
}

const ACTION_LABELS: Partial<Record<CaseStatus, string>> = {
  NEEDS_CLARIFICATION: 'Request Clarification',
  PRODUCTION_READY: '✓ Mark Production Ready',
  CLOSED: 'Close Case',
}

export default function CaseActions({ caseId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const nextStatuses = VALID_TRANSITIONS[status]
  if (nextStatuses.length === 0) return null

  async function transition(toStatus: CaseStatus) {
    setError('')
    setLoading(toStatus)
    const res = await fetch(`/api/cases/${caseId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toStatus }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Transition failed.')
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      {nextStatuses.map((toStatus) => (
        <button
          key={toStatus}
          onClick={() => transition(toStatus)}
          disabled={loading !== null}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            toStatus === 'PRODUCTION_READY'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : toStatus === 'NEEDS_CLARIFICATION'
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {loading === toStatus ? 'Working…' : (ACTION_LABELS[toStatus] ?? STATUS_LABELS[toStatus])}
        </button>
      ))}
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
