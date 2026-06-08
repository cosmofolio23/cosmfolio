/**
 * AI Sheet Composer
 *
 * Architecture-smart assistant for sheet composition
 * 9 commands specifically for architectural drawings
 */

import React, { useState } from 'react'
import type { AISheetCommand } from './sheetSetTypes'

interface AISheetComposerProps {
  onCommand: (cmd: AISheetCommand) => void
  isProcessing?: boolean
}

const COMMANDS: Array<{ id: AISheetCommand; label: string; icon: string; description: string }> = [
  {
    id: 'compose-set',
    label: 'Compose Sheet Set',
    icon: '📋',
    description: 'Generate complete layout for entire set',
  },
  {
    id: 'improve-hierarchy',
    label: 'Improve Hierarchy',
    icon: '📊',
    description: 'Strengthen visual information priority',
  },
  {
    id: 'improve-white-space',
    label: 'Improve White Space',
    icon: '⬜',
    description: 'Better breathing room on sheet',
  },
  {
    id: 'make-jury-style',
    label: 'Make Jury Style',
    icon: '🎯',
    description: 'Professional, formal presentation',
  },
  {
    id: 'make-thesis-style',
    label: 'Make Thesis Style',
    icon: '📚',
    description: 'Academic, research-focused layout',
  },
  {
    id: 'make-competition-style',
    label: 'Make Competition Style',
    icon: '🏆',
    description: 'Bold, high-impact presentation',
  },
  {
    id: 'generate-similar',
    label: 'Generate Similar',
    icon: '🔄',
    description: 'Create alternative composition',
  },
  {
    id: 'fix-alignment',
    label: 'Fix Alignment',
    icon: '📏',
    description: 'Snap elements to grid',
  },
  {
    id: 'improve-presentation',
    label: 'Improve Presentation',
    icon: '✨',
    description: 'Overall composition refinement',
  },
]

export function AISheetComposer({ onCommand, isProcessing = false }: AISheetComposerProps) {
  const [selectedCmd, setSelectedCmd] = useState<AISheetCommand | null>(null)

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">🤖 AI Sheet Composer</h3>
        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded">Architecture Edition</span>
      </div>

      <p className="text-xs text-gray-600">Let AI optimize your sheet composition:</p>

      <div className="grid grid-cols-3 gap-1.5">
        {COMMANDS.map(cmd => (
          <button
            key={cmd.id}
            onClick={() => {
              setSelectedCmd(cmd.id)
              onCommand(cmd.id)
            }}
            disabled={isProcessing}
            title={cmd.description}
            className={`p-2 rounded text-left text-xs font-medium transition ${
              selectedCmd === cmd.id
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white border border-purple-200 text-gray-700 hover:border-purple-400'
            } disabled:opacity-50`}
          >
            <div className="font-semibold">{cmd.icon}</div>
            <div className="text-[9px] mt-1 leading-tight">{cmd.label}</div>
          </button>
        ))}
      </div>

      {isProcessing && (
        <div className="text-center py-2 text-xs text-purple-600">
          <span>🔄 AI is analyzing...</span>
        </div>
      )}

      <div className="text-[9px] text-gray-600 p-2 bg-white rounded border border-gray-200">
        <p className="font-semibold mb-1">💡 Architecture-Smart Commands:</p>
        <ul className="space-y-1 text-gray-600">
          <li>• <strong>Jury Style:</strong> Formal, professional — for internal reviews</li>
          <li>• <strong>Thesis Style:</strong> Academic, research-heavy — for submissions</li>
          <li>• <strong>Competition:</strong> Bold, memorable — maximum visual impact</li>
          <li>• <strong>Fix Alignment:</strong> Respects architectural grid conventions</li>
        </ul>
      </div>
    </div>
  )
}
