'use client'

import React, { useState } from 'react'
import { OverlayConfig } from '@/types/portfolio'
import { getOverlayPreview } from '@/lib/presetImages'

interface OverlayManagerProps {
  overlays: OverlayConfig[]
  onAdd: (overlay: OverlayConfig) => void
  onUpdate: (overlay: OverlayConfig) => void
  onRemove: (overlayId: string) => void
}

export function OverlayManager({ overlays, onAdd, onUpdate, onRemove }: OverlayManagerProps) {
  const [showAdd, setShowAdd] = useState(false)
  const overlayTypes: OverlayConfig['type'][] = ['color', 'gradient', 'pattern', 'text', 'vignette', 'blur']

  const handleAddOverlay = (type: OverlayConfig['type']) => {
    const newOverlay: OverlayConfig = {
      id: `overlay-${Date.now()}`,
      type,
      enabled: true,
      settings: getDefaultSettings(type),
    }
    onAdd(newOverlay)
    setShowAdd(false)
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-4">Page Overlays</h3>

      {overlays.map((overlay) => (
        <OverlayItem
          key={overlay.id}
          overlay={overlay}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}

      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Add Overlay
        </button>
      )}

      {showAdd && (
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h4 className="font-bold mb-3">Select Overlay Type</h4>
          <div className="grid grid-cols-2 gap-2">
            {overlayTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleAddOverlay(type)}
                className="p-3 border rounded hover:bg-blue-50 text-left"
              >
                <div className="text-sm font-bold capitalize">{type}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(false)}
            className="mt-3 w-full py-2 px-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function OverlayItem({ overlay, onUpdate, onRemove }: { overlay: OverlayConfig; onUpdate: (o: OverlayConfig) => void; onRemove: (id: string) => void }) {
  return (
    <div className="p-3 border rounded bg-white mb-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold capitalize">{overlay.type}</h4>
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={overlay.enabled}
              onChange={(e) => onUpdate({ ...overlay, enabled: e.target.checked })}
            />
            <span className="text-sm">Enable</span>
          </label>
          <button
            onClick={() => onRemove(overlay.id)}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

function getDefaultSettings(type: OverlayConfig['type']): OverlayConfig['settings'] {
  switch (type) {
    case 'color':
      return { color: '#000000', opacity: 0.3 }
    case 'gradient':
      return { gradientFrom: '#000000', gradientTo: '#FFFFFF', opacity: 0.3 }
    case 'pattern':
      return { patternType: 'dots', opacity: 0.1 }
    case 'text':
      return { text: 'OVERLAY', fontSize: '72px', textColor: '#000000', opacity: 0.15 }
    case 'vignette':
      return { opacity: 0.4 }
    case 'blur':
      return { blurAmount: 8, opacity: 0.2, color: '#FFFFFF' }
    default:
      return { opacity: 0.3 }
  }
}
