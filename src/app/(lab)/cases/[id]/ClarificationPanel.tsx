'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClarificationThread, CaseStatus } from '@/lib/types'

interface Props {
  caseId: string
  threads: ClarificationThread[]
  status: CaseStatus
}

export default function ClarificationPanel({ caseId, threads, status }: Props) {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canAsk = status === 'NEEDS_CLARIFICATION' || status === 'QA_REVIEW'

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setError('')
    setLoading(true)

    const res = await fetch(`/api/cases/${caseId}/clarifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to add question.')
    } else {
      setQuestion('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">
        Clarifications ({threads.length})
      </h2>

      {threads.length === 0 && !canAsk && (
        <p className="text-sm text-gray-400">No clarifications needed.</p>
      )}

      {threads.map((t) => (
        <div key={t.id} className="mb-4 last:mb-0">
          <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800">
            <span className="font-medium">Lab: </span>{t.question}
            <span className="text-xs text-orange-400 ml-2">
              {new Date(t.asked_at).toLocaleDateString()}
            </span>
          </div>
          {t.answer ? (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 mt-1 ml-4">
              <span className="font-medium">Clinic: </span>{t.answer}
              <span className={`text-xs ml-2 ${t.resolved ? 'text-green-600' : 'text-blue-400'}`}>
                {t.resolved ? '✓ Resolved' : new Date(t.answered_at!).toLocaleDateString()}
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-1 ml-4 italic">Awaiting clinic response…</p>
          )}
        </div>
      ))}

      {canAsk && (
        <form onSubmit={askQuestion} className="mt-4 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask the clinic a question…"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '…' : 'Ask'}
          </button>
        </form>
      )}
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  )
}
