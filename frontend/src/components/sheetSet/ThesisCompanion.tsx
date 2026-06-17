import React, { useState } from 'react'
import type { Sheet } from './sheetSetTypes'

interface ThesisCompanionProps {
  sheets: Sheet[]
}

const MANDATORY_REQUIREMENTS = [
  { id: 'cover', label: 'Cover Sheet', type: 'cover' },
  { id: 'site', label: 'Site Analysis', type: 'site' },
  { id: 'concept', label: 'Concept / Process', type: 'concept' },
  { id: 'plans', label: 'Floor Plans', type: 'plans' },
  { id: 'sections', label: 'Sections', type: 'sections' },
  { id: 'elevations', label: 'Elevations', type: 'elevations' },
  { id: 'renders', label: '3D Views / Renders', type: 'renders' },
  { id: 'details', label: 'Technical Details', type: 'details' },
]

export function ThesisCompanion({ sheets }: ThesisCompanionProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Calculate fulfilled requirements based on sheet types present in the set
  const fulfilled = MANDATORY_REQUIREMENTS.filter(req => 
    sheets.some(s => s.sheetType === req.type)
  )

  const progress = Math.round((fulfilled.length / MANDATORY_REQUIREMENTS.length) * 100)
  const isComplete = progress === 100

  if (collapsed) {
    return (
      <div 
        className="absolute bottom-6 right-[400px] bg-white rounded-full shadow-lg border border-[#D4AF37] px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-3 z-50 transition-all"
        onClick={() => setCollapsed(false)}
      >
        <span className="text-xl">🎓</span>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thesis Companion</span>
          <span className="text-xs font-semibold text-[#9C7416]">{progress}% Complete</span>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-6 right-[400px] w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-md">🎓</span>
          <div>
            <h3 className="text-white text-sm font-bold">Thesis Companion</h3>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider">Jury Checklist</p>
          </div>
        </div>
        <button 
          onClick={() => setCollapsed(true)} 
          className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          title="Minimize Tracker"
        >
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-xs font-bold text-gray-700">Project Readiness</span>
          <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-[#D4AF37]'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-[#D4AF37] to-[#9C7416]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="p-2 max-h-64 overflow-y-auto">
        {MANDATORY_REQUIREMENTS.map(req => {
          const isFulfilled = fulfilled.some(f => f.id === req.id)
          return (
            <div 
              key={req.id} 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isFulfilled ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs shrink-0
                ${isFulfilled ? 'bg-green-500 border-green-600 text-white' : 'border-gray-300 text-transparent'}
              `}>
                ✓
              </div>
              <span className={`text-sm ${isFulfilled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {req.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {isComplete && (
        <div className="p-3 bg-green-50 border-t border-green-100 text-center">
          <p className="text-xs font-bold text-green-700">🎉 All mandatory sheets present!</p>
        </div>
      )}
    </div>
  )
}
