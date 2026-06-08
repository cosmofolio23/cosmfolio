/**
 * Sheet Set Canvas
 *
 * Center editor rendering individual sheet with elements
 * Handles element selection, positioning, and drawing display
 */

import React, { useRef, useState } from 'react'
import { Grip, Trash2, Copy } from 'lucide-react'
import type { Sheet, SheetElement, SheetSet } from './sheetSetTypes'
import { SHEET_SIZES, mmToPx } from './sheetSetTypes'
import { generateScaleLabel } from './drawingScaleEngine'

interface SheetSetCanvasProps {
  sheet: Sheet
  sheetSet: SheetSet
  selectedElementId: string | null
  onSelectElement: (id: string) => void
  onUpdateElement: (id: string, update: Partial<SheetElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  gridEnabled: boolean
  snapEnabled: boolean
}

export function SheetSetCanvas({
  sheet,
  sheetSet,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  zoom,
  onZoomChange,
  gridEnabled,
  snapEnabled,
}: SheetSetCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const pageSize = SHEET_SIZES[sheetSet.sheetSize as keyof typeof SHEET_SIZES]
  const isPortrait = sheetSet.orientation === 'portrait'
  const sheetWidth = isPortrait ? pageSize.width : pageSize.height
  const sheetHeight = isPortrait ? pageSize.height : pageSize.width
  const sheetWidthPx = mmToPx(sheetWidth) * (zoom / 100)
  const sheetHeightPx = mmToPx(sheetHeight) * (zoom / 100)

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.button !== 0) return
    setDraggingId(elementId)
    setDragStart({ x: e.clientX, y: e.clientY })
    onSelectElement(elementId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return

    const element = sheet.elements.find(el => el.id === draggingId)
    if (!element || element.locked) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(100, element.x + (deltaX / sheetWidthPx) * 100))
    const newY = Math.max(0, Math.min(100, element.y + (deltaY / sheetHeightPx) * 100))

    onUpdateElement(element.id, { x: newX, y: newY })
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setDraggingId(null)
  }

  return (
    <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2">
        <button
          onClick={() => onZoomChange(Math.max(50, zoom - 10))}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
        >
          −
        </button>
        <input
          type="number"
          value={zoom}
          onChange={e => onZoomChange(Math.min(200, Math.max(50, parseInt(e.target.value))))}
          className="w-16 px-2 py-1 text-sm border rounded text-center"
        />
        <span className="text-sm text-gray-600">%</span>
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
        >
          +
        </button>

        <div className="border-l border-gray-300 mx-2 h-5" />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={gridEnabled} readOnly className="w-4 h-4" />
          Grid
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={snapEnabled} readOnly className="w-4 h-4" />
          Snap
        </label>

        <div className="flex-1" />

        <span className="text-xs text-gray-500">
          {sheet.elements.length} elements
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto flex items-center justify-center p-8"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Sheet */}
        <div
          className="relative bg-white shadow-2xl"
          style={{
            width: `${sheetWidthPx}px`,
            height: `${sheetHeightPx}px`,
            backgroundImage: gridEnabled
              ? `linear-gradient(90deg, #f0f0f0 1px, transparent 1px), linear-gradient(#f0f0f0 1px, transparent 1px)`
              : undefined,
            backgroundSize: gridEnabled ? '20px 20px' : undefined,
          }}
        >
          {/* Master Elements (Background) */}
          {sheet.background && (
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundColor: sheet.background.color,
                backgroundImage: sheet.background.image ? `url(${sheet.background.image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 1,
              }}
            />
          )}

          {/* Elements */}
          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            {sheet.elements.map(element => (
              <div
                key={element.id}
                onMouseDown={e => handleElementMouseDown(e, element.id)}
                className={`absolute transition-all ${element.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
                  selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.w}%`,
                  height: `${element.h}%`,
                  zIndex: element.z,
                  opacity: element.opacity ?? 1,
                }}
                title={element.drawing?.drawingName || element.content}
              >
                {/* Drawing */}
                {element.kind === 'drawing' && element.drawing && (
                  <div className="w-full h-full relative group">
                    <img
                      src={element.drawing.url}
                      alt={element.drawing.drawingName}
                      className="w-full h-full object-contain"
                      style={{
                        filter: element.drawing.vector ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                      }}
                    />
                    {/* Scale Label */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition">
                      {generateScaleLabel(element.drawing)}
                    </div>
                  </div>
                )}

                {/* Text */}
                {element.kind === 'text' && (
                  <div
                    className="w-full h-full flex items-center justify-center p-2 overflow-hidden"
                    style={{
                      fontSize: `${element.fontSize || 12}px`,
                      fontFamily: element.fontFamily || 'Inter',
                      color: element.color || '#000',
                      backgroundColor: element.bgColor,
                    }}
                  >
                    {element.content}
                  </div>
                )}

                {/* Image */}
                {element.kind === 'image' && element.src && (
                  <img src={element.src} alt="element" className="w-full h-full object-cover" />
                )}

                {/* Diagram/Render (visual placeholder) */}
                {(element.kind === 'diagram' || element.kind === 'image') && !element.src && (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs">
                    {element.kind}
                  </div>
                )}

                {/* Selection Handle */}
                {selectedElementId === element.id && !element.locked && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition">
                    <Grip size={14} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sheet Info (Footer) */}
          <div className="absolute bottom-4 left-4 right-4 text-xs text-gray-600 pointer-events-none flex justify-between">
            <div>
              {sheetSet.projectName} — Sheet {sheet.sheetNumber}: {sheet.sheetName}
            </div>
            <div>
              {sheetSet.studentName && `${sheetSet.studentName} • `}
              {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>

      {/* Element Inspector (when selected) */}
      {selectedElementId && sheet.elements.find(e => e.id === selectedElementId) && (
        <div className="bg-gray-50 border-t border-gray-200 p-3 flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {sheet.elements.find(e => e.id === selectedElementId)?.kind}
          </span>

          <div className="flex-1" />

          <button
            onClick={() => onDuplicateElement(selectedElementId)}
            className="px-2 py-1 text-sm border rounded hover:bg-white flex items-center gap-1"
          >
            <Copy size={14} /> Duplicate
          </button>

          <button
            onClick={() => {
              onDeleteElement(selectedElementId)
              onSelectElement('')
            }}
            className="px-2 py-1 text-sm border rounded hover:bg-red-50 text-red-600 flex items-center gap-1"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  )
}
