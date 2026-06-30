'use client'

import { useState } from 'react'
import { StylePack } from './StylePackGallery'
import { StylePackPreview } from './StylePackPreview'

interface Props {
  portfolioId: string
  onClose: () => void
  onGenerated: (pack: StylePack) => void
}

type Mode = 'mood' | 'color' | 'assets'

const MOOD_OPTIONS = [
  { id: 'minimal', label: 'Minimal', emoji: '🤍' },
  { id: 'bold', label: 'Bold', emoji: '⚡' },
  { id: 'luxury', label: 'Luxury', emoji: '✨' },
  { id: 'warm', label: 'Warm', emoji: '🔥' },
  { id: 'cold', label: 'Cold', emoji: '❄️' },
  { id: 'organic', label: 'Organic', emoji: '🌿' },
  { id: 'futuristic', label: 'Futuristic', emoji: '🚀' },
  { id: 'classic', label: 'Classic', emoji: '🏛️' },
]

export function StylePackGenerator({ portfolioId, onClose, onGenerated }: Props) {
  const [mode, setMode] = useState<Mode>('mood')
  const [moodValue, setMoodValue] = useState<string>('minimal')
  const [colorValue, setColorValue] = useState<string>('#3366cc')
  const [assetsValue, setAssetsValue] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [generatedPack, setGeneratedPack] = useState<StylePack | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getValue = () => {
    if (mode === 'mood') return moodValue
    if (mode === 'color') return colorValue
    return assetsValue
  }

  const handleGenerate = async () => {
    const value = getValue()
    if (!value.trim()) {
      setError('Please provide a value')
      return
    }

    setGenerating(true)
    setError(null)
    setGeneratedPack(null)

    try {
      const API_URL = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? '/backend-proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app'))
      const token = localStorage.getItem('auth_token')

      const res = await fetch(
        `${API_URL}/api/portfolios/${portfolioId}/style-packs/generate?mode=${mode}&value=${encodeURIComponent(value)}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      )

      if (res.ok) {
        const data = await res.json()
        const generated = data.generated_pack
        // Add temp ID for client display
        generated.id = `generated-${Date.now()}`
        setGeneratedPack(generated)
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Generation failed' }))
        setError(errorData.detail || 'Failed to generate pack')
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleApply = () => {
    if (generatedPack) {
      onGenerated(generatedPack)
      onClose()
    }
  }

  if (generatedPack) {
    return (
      <StylePackPreview
        pack={generatedPack}
        onClose={() => setGeneratedPack(null)}
        onApply={handleApply}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">✨ Generate Design Pack with AI</h2>
            <p className="text-sm text-stone-light mt-1">Let AI create a custom design system for your portfolio</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-subtle transition text-stone-light"
            disabled={generating}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 py-4 border-b border-border-light">
          <label className="block text-sm font-semibold text-charcoal mb-3">Generate From</label>
          <div className="grid grid-cols-3 gap-2">
            {(['mood', 'color', 'assets'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={generating}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm capitalize transition ${
                  mode === m
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-border-light text-stone hover:border-stone-light'
                }`}
              >
                {m === 'mood' && '🎨'} {m === 'color' && '🎯'} {m === 'assets' && '🖼️'} {m}
              </button>
            ))}
          </div>
        </div>

        {/* Mode-specific Input */}
        <div className="px-6 py-4">
          {mode === 'mood' && (
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-3">Choose a mood</label>
              <div className="grid grid-cols-4 gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMoodValue(m.id)}
                    disabled={generating}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      moodValue === m.id
                        ? 'border-primary bg-blue-50'
                        : 'border-border-light hover:border-stone-light'
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.emoji}</div>
                    <div className="text-xs font-medium text-charcoal capitalize">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'color' && (
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-3">Pick a base color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) => setColorValue(e.target.value)}
                  disabled={generating}
                  className="w-20 h-20 rounded-lg border-2 border-border-light cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={colorValue}
                    onChange={(e) => setColorValue(e.target.value)}
                    disabled={generating}
                    placeholder="#000000"
                    className="w-full px-3 py-2 border border-border-light rounded-lg font-mono text-sm"
                  />
                  <p className="text-xs text-stone-light mt-2">AI will generate complementary colors, typography, and spacing</p>
                </div>
              </div>
            </div>
          )}

          {mode === 'assets' && (
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-3">Describe your project</label>
              <textarea
                value={assetsValue}
                onChange={(e) => setAssetsValue(e.target.value)}
                disabled={generating}
                placeholder="e.g., A modern museum with concrete and glass exteriors, exposed steel structure, minimalist interior..."
                rows={4}
                className="w-full px-3 py-2 border border-border-light rounded-lg text-sm resize-none"
              />
              <p className="text-xs text-stone-light mt-2">AI will create a design system that complements your project</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-stone hover:bg-bg-subtle transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !getValue().trim()}
            className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <span className="animate-spin">⟳</span>
                Generating...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate Pack
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
