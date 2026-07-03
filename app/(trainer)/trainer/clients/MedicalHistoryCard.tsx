'use client'

import { useState } from 'react'
import type { MedicalHistory } from '@/types'

const PAR_Q_LABELS: Record<string, string> = {
  heart_condition_or_bp: 'Heart condition or high blood pressure',
  chest_pain: 'Chest pain at rest or during activity',
  dizziness_or_consciousness: 'Dizziness, balance loss, or loss of consciousness (12 months)',
  chronic_condition: 'Chronic medical condition',
  prescribed_medication: 'Currently on prescribed medication',
  bone_or_joint_problem: 'Bone, joint, or muscle problem',
}

const DETAIL_FIELDS: Record<string, keyof MedicalHistory> = {
  chronic_condition: 'chronic_condition_details',
  prescribed_medication: 'medication_details',
  bone_or_joint_problem: 'bone_or_joint_details',
}

export function MedicalHistoryCard({ clientId, history }: { clientId: string; history: MedicalHistory | null }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reviewed, setReviewed] = useState(history?.trainer_reviewed ?? false)
  const [reviewedAt, setReviewedAt] = useState(history?.trainer_reviewed_at ?? null)

  if (!history) {
    return (
      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
        <p className="text-xs text-slate-400">Medical history intake not yet completed.</p>
      </div>
    )
  }

  const flaggedItems = Object.entries(PAR_Q_LABELS).filter(
    ([key]) => history[key as keyof MedicalHistory]
  )

  const isExpired = history.valid_until ? new Date(history.valid_until) < new Date() : false

  async function handleMarkReviewed() {
    setLoading(true)
    const res = await fetch('/api/clients/medical-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId }),
    })
    setLoading(false)
    if (res.ok) {
      setReviewed(true)
      setReviewedAt(new Date().toISOString())
    }
  }

  const statusColor = isExpired
    ? 'bg-red-900/20 border-red-800/40'
    : history.needs_medical_clearance
    ? reviewed
      ? 'bg-emerald-900/20 border-emerald-800/40'
      : 'bg-yellow-900/20 border-yellow-800/40'
    : 'bg-slate-800 border-slate-700'

  const statusText = isExpired
    ? 'Medical clearance expired — re-screening required'
    : history.needs_medical_clearance
    ? reviewed
      ? 'Medical clearance reviewed'
      : 'Needs medical review'
    : 'Medical history: no concerns flagged'

  const statusTextColor = isExpired
    ? 'text-red-400'
    : history.needs_medical_clearance
    ? reviewed ? 'text-emerald-400' : 'text-yellow-400'
    : 'text-slate-400'

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-colors ${statusColor}`}
      >
        <p className={`text-xs font-medium ${statusTextColor}`}>{statusText}</p>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300">
          {flaggedItems.length > 0 ? (
            <div>
              <p className="font-medium text-slate-200 mb-1">PAR-Q flags:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {flaggedItems.map(([key, label]) => {
                  const detailField = DETAIL_FIELDS[key]
                  const detail = detailField ? history[detailField] : null
                  return (
                    <li key={key}>
                      {label}
                      {detail && <span className="text-slate-400"> — {detail}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p className="text-slate-400">No PAR-Q risk factors reported.</p>
          )}

          {history.previous_injuries_surgeries && (
            <p><span className="font-medium text-slate-200">Previous injuries/surgeries:</span> {history.previous_injuries_surgeries}</p>
          )}
          {history.current_pain_areas && (
            <p><span className="font-medium text-slate-200">Current pain areas:</span> {history.current_pain_areas}</p>
          )}
          {history.allergies && (
            <p><span className="font-medium text-slate-200">Allergies:</span> {history.allergies}</p>
          )}
          {history.additional_notes && (
            <p><span className="font-medium text-slate-200">Additional notes:</span> {history.additional_notes}</p>
          )}

          {history.needs_medical_clearance && !reviewed && (
            <button
              type="button"
              onClick={handleMarkReviewed}
              disabled={loading}
              className="mt-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-colors px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Mark as reviewed'}
            </button>
          )}
          {reviewed && (
            <p className="text-emerald-400/80 text-[11px] mt-1">
              Reviewed {reviewedAt ? new Date(reviewedAt).toLocaleDateString('en-GB') : ''}
            </p>
          )}

          {history.valid_until && (
            <p className={`text-[11px] mt-1 ${isExpired ? 'text-red-400' : 'text-slate-500'}`}>
              {isExpired ? 'Clearance expired' : 'Valid until'} {new Date(history.valid_until).toLocaleDateString('en-GB')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
