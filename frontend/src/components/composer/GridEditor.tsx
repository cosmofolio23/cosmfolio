/**
 * Grid Editor — professional grid controls (column/modular/baseline/golden-ratio)
 */

import React from 'react'
import type { GridSettings } from './publishingTypes'

interface GridEditorProps {
  grid: GridSettings
  onUpdate: (grid: GridSettings) => void
}

export function GridEditor({ grid, onUpdate }: GridEditorProps) {
  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-semibold text-gray-900">Grid System</h3>

      <div className="flex gap-2">
        <button onClick={() => onUpdate({ ...grid, enabled: !grid.enabled })} className={`flex-1 px-3 py-2 rounded text-xs font-medium ${grid.enabled ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600'}`}>
          {grid.enabled ? '✓ Grid ON' : 'Grid OFF'}
        </button>
        <button onClick={() => onUpdate({ ...grid, snapEnabled: !grid.snapEnabled })} className={`flex-1 px-3 py-2 rounded text-xs font-medium ${grid.snapEnabled ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600'}`}>
          {grid.snapEnabled ? '✓ Snap ON' : 'Snap OFF'}
        </button>
      </div>

      <select value={grid.type} onChange={e => onUpdate({ ...grid, type: e.target.value as any })} className="w-full px-2 py-2 border rounded text-xs">
        <option value="column">Column Grid</option>
        <option value="modular">Modular Grid</option>
        <option value="baseline">Baseline Grid</option>
        <option value="golden-ratio">Golden Ratio</option>
        <option value="architectural">Architectural</option>
        <option value="custom">Custom</option>
      </select>

      {grid.type === 'column' && (
        <div className="space-y-2">
          <label className="text-[10px] uppercase text-gray-500">Columns: {grid.columns || 12}</label>
          <input type="range" min="2" max="16" value={grid.columns || 12} onChange={e => onUpdate({ ...grid, columns: parseInt(e.target.value) })} className="w-full" />
          <label className="text-[10px] uppercase text-gray-500">Gutter: {grid.columnGutter || 20}px</label>
          <input type="range" min="4" max="40" value={grid.columnGutter || 20} onChange={e => onUpdate({ ...grid, columnGutter: parseInt(e.target.value) })} className="w-full" />
        </div>
      )}

      {grid.type === 'modular' && (
        <div>
          <label className="text-[10px] uppercase text-gray-500">Module Size: {grid.moduleSize || 20}px</label>
          <input type="range" min="10" max="50" value={grid.moduleSize || 20} onChange={e => onUpdate({ ...grid, moduleSize: parseInt(e.target.value) })} className="w-full" />
        </div>
      )}

      {grid.type === 'baseline' && (
        <div>
          <label className="text-[10px] uppercase text-gray-500">Baseline: {grid.baselineHeight || 16}px</label>
          <input type="range" min="8" max="32" value={grid.baselineHeight || 16} onChange={e => onUpdate({ ...grid, baselineHeight: parseInt(e.target.value) })} className="w-full" />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[10px] uppercase text-gray-500">Grid Color</label>
        <input type="color" value={grid.gridColor || '#cccccc'} onChange={e => onUpdate({ ...grid, gridColor: e.target.value })} className="w-full h-6 border rounded" />
      </div>

      <div>
        <label className="text-[10px] uppercase text-gray-500">Grid Opacity: {(grid.gridOpacity || 0.2).toFixed(2)}</label>
        <input type="range" min="0.05" max="0.5" step="0.05" value={grid.gridOpacity || 0.2} onChange={e => onUpdate({ ...grid, gridOpacity: parseFloat(e.target.value) })} className="w-full" />
      </div>
    </div>
  )
}
