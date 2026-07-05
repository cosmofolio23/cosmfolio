/**
 * Sheet Set Navigator
 *
 * Left sidebar showing all sheets in the set
 * Click to select/edit, drag to reorder
 */

import React, { useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, Lock, LockOpen, ChevronLeft } from 'lucide-react'
import type { Sheet, SheetSet } from './sheetSetTypes'

interface SheetSetNavigatorProps {
  sheetSet: SheetSet
  selectedSheetId: string
  onSelectSheet: (id: string) => void
  onAddSheet: () => void
  onDeleteSheet: (id: string) => void
  onReorderSheets: (sheets: Sheet[]) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onCollapse?: () => void
}

export function SheetSetNavigator({
  sheetSet,
  selectedSheetId,
  onSelectSheet,
  onAddSheet,
  onDeleteSheet,
  onReorderSheets,
  onToggleVisibility,
  onToggleLock,
  onCollapse,
}: SheetSetNavigatorProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, sheetId: string) => {
    setDraggedId(sheetId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const draggedIdx = sheetSet.sheets.findIndex(s => s.id === draggedId)
    const targetIdx = sheetSet.sheets.findIndex(s => s.id === targetId)

    const newSheets = [...sheetSet.sheets]
    const [removed] = newSheets.splice(draggedIdx, 1)
    newSheets.splice(targetIdx, 0, removed)

    onReorderSheets(newSheets.map((s, i) => ({ ...s, order: i })))
    setDraggedId(null)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900 truncate">{sheetSet.projectName}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {sheetSet.sheets.length} sheets • {sheetSet.sheetSize} {sheetSet.orientation}
          </p>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition flex-shrink-0"
            title="Collapse navigator"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Sheet List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {sheetSet.sheets.map(sheet => (
            <div
              key={sheet.id}
              draggable
              onDragStart={e => handleDragStart(e, sheet.id)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, sheet.id)}
              className={`p-2 rounded-lg cursor-move transition group ${
                selectedSheetId === sheet.id
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
              }`}
            >
              {/* Sheet Title & Select */}
              <button
                onClick={() => onSelectSheet(sheet.id)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {sheet.sheetNumber}. {sheet.sheetName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{sheet.sheetType}</div>
                  </div>
                  <div className="text-xs font-mono text-gray-400">{sheet.elements.length}</div>
                </div>
              </button>

              {/* Controls (hover) */}
              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onToggleVisibility(sheet.id)
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600"
                  title={sheet.elements.every(e => e.visible) ? 'Hide' : 'Show'}
                >
                  {sheet.elements.every(e => e.visible) ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <button
                  onClick={e => {
                    e.stopPropagation()
                    onToggleLock(sheet.id)
                  }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600"
                  title="Lock"
                >
                  {sheet.elements.some(e => e.locked) ? <Lock size={14} /> : <LockOpen size={14} />}
                </button>

                <div className="flex-1" />

                <button
                  onClick={e => {
                    e.stopPropagation()
                    onDeleteSheet(sheet.id)
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-600"
                  title="Delete sheet"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Sheet Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onAddSheet}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <Plus size={18} /> Add Sheet
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Drawings:</span>
          <span className="font-mono">
            {sheetSet.sheets.reduce((sum, s) => sum + s.elements.filter(e => e.kind === 'drawing').length, 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Text Elements:</span>
          <span className="font-mono">
            {sheetSet.sheets.reduce((sum, s) => sum + s.elements.filter(e => e.kind === 'text').length, 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Total Elements:</span>
          <span className="font-mono">{sheetSet.sheets.reduce((sum, s) => sum + s.elements.length, 0)}</span>
        </div>
      </div>
    </div>
  )
}
