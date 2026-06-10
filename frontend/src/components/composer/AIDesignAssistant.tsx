/**
 * AI Design Assistant — Architecture Publishing Edition
 *
 * Available commands:
 * - Improve This Page
 * - Make More Minimal / More Premium
 * - Improve White Space / Hierarchy
 * - Make Competition Style / Thesis Style
 * - Generate Background
 * - Suggest Color Palette / Font Pairing
 * - Recompose Page Layout
 * - AI Improve Text
 */

import React, { useState } from 'react'

type AICommand = 'improve-page' | 'minimize' | 'premium' | 'white-space' | 'hierarchy' | 'competition' | 'thesis' | 'generate-bg' | 'colors' | 'fonts' | 'recompose' | 'improve-text'

interface AIDesignAssistantProps {
  onCommand?: (cmd: AICommand) => void
  isProcessing?: boolean
}

const COMMANDS: Array<{ id: AICommand; label: string; icon: string; description: string }> = [
  { id: 'improve-page', label: 'Improve This Page', icon: '✨', description: 'AI suggestions for hierarchy and balance' },
  { id: 'minimize', label: 'Make Minimal', icon: '➖', description: 'Reduce visual complexity' },
  { id: 'premium', label: 'Make Premium', icon: '⬆️', description: 'Enhance sophistication' },
  { id: 'white-space', label: 'Improve White Space', icon: '⬜', description: 'Better breathing room' },
  { id: 'hierarchy', label: 'Improve Hierarchy', icon: '📊', description: 'Strengthen information priority' },
  { id: 'competition', label: 'Competition Style', icon: '🎯', description: 'Bold, graphic treatment' },
  { id: 'thesis', label: 'Thesis Style', icon: '📖', description: 'Academic, refined' },
  { id: 'generate-bg', label: 'Generate Background', icon: '🎨', description: 'Create parametric background' },
  { id: 'colors', label: 'Suggest Colors', icon: '🎭', description: 'Complementary palette' },
  { id: 'fonts', label: 'Suggest Fonts', icon: '🔤', description: 'Pairing recommendations' },
  { id: 'recompose', label: 'Recompose Layout', icon: '🔄', description: 'Alternative arrangement' },
  { id: 'improve-text', label: 'Improve Text', icon: '✍️', description: 'AI writing suggestions' },
]

export function AIDesignAssistant({ onCommand, isProcessing = false }: AIDesignAssistantProps) {
  const [selectedCmd, setSelectedCmd] = useState<AICommand | null>(null)

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-[#FBE7A1]/30 to-[#D4AF37]/10 rounded-lg border-2 border-[#D4AF37]/40">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">🤖 AI Design Assistant</h3>
        <span className="text-[10px] bg-[#FBE7A1]/50 text-[#9C7416] px-2 py-1 rounded">Architecture Edition</span>
      </div>

      <p className="text-xs text-gray-600">Let AI improve your portfolio design:</p>

      <div className="grid grid-cols-2 gap-1.5">
        {COMMANDS.map(cmd => (
          <button
            key={cmd.id}
            onClick={() => {
              setSelectedCmd(cmd.id)
              onCommand?.(cmd.id)
            }}
            disabled={isProcessing}
            title={cmd.description}
            className={`p-2 rounded text-left text-xs font-medium transition ${
              selectedCmd === cmd.id
                ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                : 'bg-white border border-[#D4AF37]/30 text-gray-700 hover:border-[#D4AF37]/70'
            } disabled:opacity-50`}
          >
            <div>{cmd.icon} {cmd.label}</div>
            <div className="text-[8px] opacity-70 mt-0.5">{cmd.description}</div>
          </button>
        ))}
      </div>

      {isProcessing && (
        <div className="text-center py-2 text-xs text-[#9C7416]">
          <span>🔄 AI is thinking...</span>
        </div>
      )}

      <div className="text-[9px] text-gray-500 p-2 bg-white rounded border border-gray-200">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>Commands are smart for architecture: Competition style creates bold presentation boards, Thesis style produces academic refinement, and Improve Hierarchy respects architectural conventions.</p>
      </div>
    </div>
  )
}
