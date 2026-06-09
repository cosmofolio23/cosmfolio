/**
 * Library Completeness — "Project Health" for a submission target.
 *
 * Pick a target (Thesis / Competition / Studio) and see, at a glance, how ready
 * the project is: per-requirement bars + a plain-English "what's missing" list.
 * Drives the upload loop ("get the bar to 100%").
 */

import React, { useMemo, useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { LibraryAsset } from '@/lib/libraryApi'
import {
  readinessForAllTemplates,
  type ProjectReadiness,
} from '@/lib/libraryReadiness'

interface LibraryCompletenessProps {
  assets: LibraryAsset[]
}

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 60) return 'bg-amber-500'
  return 'bg-red-400'
}

export function LibraryCompleteness({ assets }: LibraryCompletenessProps) {
  const all = useMemo(() => readinessForAllTemplates(assets), [assets])
  const [targetId, setTargetId] = useState(all[0]?.templateId)

  const current: ProjectReadiness | undefined =
    all.find(r => r.templateId === targetId) || all[0]

  if (!current) return null

  return (
    <div className="space-y-4">
      {/* Target selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-700">Project Health</h2>
        <div className="flex gap-1">
          {all.map(r => (
            <button
              key={r.templateId}
              onClick={() => setTargetId(r.templateId)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                r.templateId === current.templateId
                  ? 'bg-accent-gold text-[#1A1A1A]'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-accent-gold'
              }`}
            >
              {r.templateName.replace(/ (Submission Package|Boards|Review Package)$/, '')}
            </button>
          ))}
        </div>
      </div>

      {/* Overall score */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <path d="M18 2.5a15.5 15.5 0 110 31 15.5 15.5 0 010-31" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <path
              d="M18 2.5a15.5 15.5 0 110 31 15.5 15.5 0 010-31"
              fill="none"
              stroke={current.overallPct >= 100 ? '#22c55e' : current.overallPct >= 60 ? '#f59e0b' : '#f87171'}
              strokeWidth="3"
              strokeDasharray={`${current.overallPct}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
            {current.overallPct}%
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {current.ready ? (
            <div className="flex items-center gap-1.5 text-green-700 font-medium text-sm">
              <CheckCircle2 size={16} /> Ready for {current.templateName}
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-amber-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Missing: {current.missingSummary.slice(0, 4).join(' · ')}
                {current.missingSummary.length > 4 ? '…' : ''}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Add assets to push the bar to 100% — then generate the full set in one click.
          </p>
        </div>
      </div>

      {/* Per-requirement bars */}
      <div className="space-y-2.5">
        {current.buckets.filter(b => b.need > 0).map(b => (
          <div key={b.bucket}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">{b.label}</span>
              <span className={`font-mono ${b.missing > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {b.have}/{b.need}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor(b.pct)}`}
                style={{ width: `${b.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
