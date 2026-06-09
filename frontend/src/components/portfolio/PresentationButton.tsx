/**
 * Presentation Mode button — generate and launch a full-screen slideshow.
 * Students can present their work immediately, with or without speaker notes.
 */

import React, { useState } from 'react'
import { Play, Loader2, Settings2 } from 'lucide-react'
import type { Portfolio } from '@/lib/api'
import { generateHTMLPresentation } from '@/lib/presentationExport'

interface PresentationButtonProps {
  portfolio: Portfolio
  pages: any[] // from the editor's current page list
  tokens?: any // design tokens (colors, fonts)
}

export function PresentationButton({ portfolio, pages, tokens }: PresentationButtonProps) {
  const [launching, setLaunching] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [duration, setDuration] = useState(5000)

  const launch = async () => {
    setLaunching(true)
    try {
      // Convert pages to slides (simple version: render each page as SVG/HTML)
      const slides = pages.map((p, i) => ({
        pageNum: i + 1,
        content: `<div style="font-size: 48px; font-weight: bold;">${p.title || `Page ${i + 1}`}</div>`,
        title: p.title || `Page ${i + 1}`,
        notes: p.notes || '',
      }))

      const html = generateHTMLPresentation(
        slides,
        portfolio,
        { format: 'html', autoplay, autoplayDuration: duration, includeNotes: true, transitionType: 'fade' },
        tokens
      )

      // Open in new window
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (e) {
      alert('Failed to generate presentation')
    } finally {
      setLaunching(false)
      setShowConfig(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={launch}
        disabled={launching || pages.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
        title="Launch full-screen presentation"
      >
        {launching ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
        Present
      </button>

      {/* Settings toggle */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="ml-1 p-2 text-gray-600 hover:bg-gray-100 rounded transition"
        title="Presentation settings"
      >
        <Settings2 size={18} />
      </button>

      {/* Config panel */}
      {showConfig && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Presentation Settings</h3>

          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={e => setAutoplay(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Autoplay slides</span>
          </label>

          {autoplay && (
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600">Slide duration (seconds)</label>
              <input
                type="number"
                min="2"
                max="30"
                step="1"
                value={duration / 1000}
                onChange={e => setDuration(parseInt(e.target.value) * 1000)}
                className="w-full mt-1 px-2 py-1 border rounded text-sm"
              />
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1 mb-3 p-2 bg-gray-50 rounded">
            <p>💡 <strong>Tips:</strong></p>
            <p>• Press ← → or Space to navigate</p>
            <p>• Press N to show speaker notes</p>
            <p>• Press ? for help</p>
          </div>

          <button
            onClick={launch}
            disabled={launching}
            className="w-full px-3 py-2 bg-purple-600 text-white rounded font-medium text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            {launching ? 'Launching…' : 'Start Presentation'}
          </button>
        </div>
      )}
    </div>
  )
}
