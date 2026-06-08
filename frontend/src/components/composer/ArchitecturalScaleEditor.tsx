/**
 * Architectural Scale Editor — drawing scales for technical drawings
 * (1:1 through 1:1000, with scale bar positioning & north arrows)
 */

import React from 'react'
import type { DrawingMetadata, ArchScale } from './publishingTypes'

interface ArchitecturalScaleEditorProps {
  metadata?: DrawingMetadata
  onUpdate: (metadata: DrawingMetadata) => void
}

const SCALES: ArchScale[] = ['1:1', '1:5', '1:10', '1:20', '1:50', '1:100', '1:200', '1:500', '1:1000']

export function ArchitecturalScaleEditor({ metadata, onUpdate }: ArchitecturalScaleEditorProps) {
  const current = metadata || {
    type: 'plan',
    name: 'Floor Plan',
    scale: '1:100',
    showScaleBar: true,
    northPoint: false,
    drawingNumber: '01',
    caption: '',
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-semibold text-gray-900">Drawing Scale & Info</h3>

      <div>
        <label className="text-[10px] uppercase text-gray-500">Drawing Type</label>
        <select value={current.type} onChange={e => onUpdate({ ...current, type: e.target.value as any })} className="w-full px-2 py-2 border rounded text-xs">
          <option value="plan">Plan</option>
          <option value="section">Section</option>
          <option value="elevation">Elevation</option>
          <option value="detail">Detail</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] uppercase text-gray-500">Drawing Name</label>
        <input type="text" value={current.name} onChange={e => onUpdate({ ...current, name: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" placeholder="e.g., Ground Floor Plan" />
      </div>

      <div>
        <label className="text-[10px] uppercase text-gray-500">Scale</label>
        <select value={current.scale} onChange={e => onUpdate({ ...current, scale: e.target.value as ArchScale })} className="w-full px-2 py-2 border rounded text-xs font-mono">
          {SCALES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[10px] uppercase text-gray-500">Drawing Number</label>
        <input type="text" value={current.drawingNumber || ''} onChange={e => onUpdate({ ...current, drawingNumber: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" placeholder="e.g., 01" />
      </div>

      <div>
        <label className="text-[10px] uppercase text-gray-500">Caption</label>
        <input type="text" value={current.caption || ''} onChange={e => onUpdate({ ...current, caption: e.target.value })} className="w-full px-2 py-1 border rounded text-xs" placeholder="Optional description" />
      </div>

      <div className="flex gap-2">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={current.showScaleBar || false} onChange={e => onUpdate({ ...current, showScaleBar: e.target.checked })} className="w-4 h-4" />
          <span>Show Scale Bar</span>
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={current.northPoint || false} onChange={e => onUpdate({ ...current, northPoint: e.target.checked })} className="w-4 h-4" />
          <span>North Point</span>
        </label>
      </div>
    </div>
  )
}
