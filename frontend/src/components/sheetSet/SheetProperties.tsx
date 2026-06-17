/**
 * Sheet Properties Panel
 *
 * Right sidebar for editing element properties and drawing metadata
 */

import React, { useState } from 'react'
import { ChevronDown, Upload } from 'lucide-react'
import type { Sheet, SheetElement, DrawingMetadata } from './sheetSetTypes'
import { SCALE_RATIOS } from './drawingScaleEngine'

interface SheetPropertiesProps {
  sheet: Sheet
  selectedElement: SheetElement | null
  onUpdateElement: (update: Partial<SheetElement>) => void
  onUploadDrawing: (element: SheetElement, file: File, metadata: Partial<DrawingMetadata>) => void
}

export function SheetProperties({
  sheet,
  selectedElement,
  onUpdateElement,
  onUploadDrawing,
}: SheetPropertiesProps) {
  const [uploadingElement, setUploadingElement] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['position', 'style']))

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections)
    if (newSections.has(section)) {
      newSections.delete(section)
    } else {
      newSections.add(section)
    }
    setExpandedSections(newSections)
  }

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col items-center justify-center text-gray-500">
        <p className="text-sm">Select an element to edit</p>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
        <h3 className="font-semibold text-gray-900 capitalize">{selectedElement.kind}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {selectedElement.content || selectedElement.drawing?.drawingName || 'Element'}
        </p>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={selectedElement.isMaster || false}
            onChange={e => {
              if (e.target.checked) {
                onUpdateElement({ isMaster: true, masterId: selectedElement.masterId || `master-${crypto.randomUUID()}` })
              } else {
                onUpdateElement({ isMaster: false, masterId: undefined })
              }
            }}
            className="w-4 h-4 text-blue-600 rounded border-gray-300"
          />
          Sync across all sheets (Master)
        </label>
        <p className="text-[10px] text-gray-500 mt-1 ml-6 leading-tight">
          When checked, changes to this element will automatically replicate to all sheets in the set.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Drawing Upload (if drawing element) */}
        {selectedElement.kind === 'drawing' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Drawing File</label>

            {selectedElement.drawing?.url ? (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-900 truncate">{selectedElement.drawing.drawingName}</p>
                <p className="text-xs text-blue-700 mt-1">{selectedElement.drawing.originalScale}</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300 text-center">
                <p className="text-xs text-gray-600">No drawing uploaded</p>
              </div>
            )}

            <input
              type="file"
              accept=".pdf,.svg,.png,.jpg,.jpeg"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  setUploadingElement(selectedElement.id)
                  // Mock metadata inference
                  const metadata: Partial<DrawingMetadata> = {
                    drawingName: file.name.split('.')[0],
                    vector: file.type === 'application/pdf' || file.type === 'image/svg+xml',
                  }
                  onUploadDrawing(selectedElement, file, metadata)
                  setUploadingElement(null)
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700"
            />
          </div>
        )}

        {/* Drawing Metadata */}
        {selectedElement.drawing && (
          <>
            <Section
              title="Drawing Info"
              id="drawing-info"
              expanded={expandedSections.has('drawing-info')}
              onToggle={toggleSection}
            >
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Drawing Name</span>
                  <input
                    type="text"
                    value={selectedElement.drawing.drawingName}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, drawingName: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Drawing Type</span>
                  <select
                    value={selectedElement.drawing.drawingType}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, drawingType: e.target.value as any },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    {['plan', 'section', 'elevation', 'detail', 'render', 'diagram'].map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Original Scale</span>
                  <select
                    value={selectedElement.drawing.originalScale}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, originalScale: e.target.value as any },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  >
                    {Object.keys(SCALE_RATIOS).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Sheet Scale</span>
                  <select
                    value={selectedElement.drawing.sheetScale}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, sheetScale: e.target.value as any },
                      })
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                  >
                    {Object.keys(SCALE_RATIOS).map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedElement.drawing.northPoint || false}
                    onChange={e =>
                      onUpdateElement({
                        drawing: { ...selectedElement.drawing!, northPoint: e.target.checked },
                      })
                    }
                    className="w-3 h-3"
                  />
                  <span className="text-gray-700">North Point</span>
                </label>
              </div>
            </Section>
          </>
        )}

        {/* Position & Size */}
        <Section
          title="Position & Size"
          id="position"
          expanded={expandedSections.has('position')}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">X (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={selectedElement.x}
                onChange={e => onUpdateElement({ x: parseFloat(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Y (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={selectedElement.y}
                onChange={e => onUpdateElement({ y: parseFloat(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Width (%)</span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={selectedElement.w}
                onChange={e => onUpdateElement({ w: parseFloat(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Height (%)</span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={selectedElement.h}
                onChange={e => onUpdateElement({ h: parseFloat(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>
          </div>
        </Section>

        {/* Style */}
        <Section
          title="Style"
          id="style"
          expanded={expandedSections.has('style')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Opacity (%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement.opacity ?? 1) * 100}
                onChange={e => onUpdateElement({ opacity: parseInt(e.target.value) / 100 })}
                className="w-full"
              />
              <span className="text-xs text-gray-500 mt-1">
                {Math.round((selectedElement.opacity ?? 1) * 100)}%
              </span>
            </label>

            {selectedElement.kind === 'text' && (
              <>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Font Size</span>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={selectedElement.fontSize || 12}
                    onChange={e => onUpdateElement({ fontSize: parseInt(e.target.value) })}
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Color</span>
                  <input
                    type="color"
                    value={selectedElement.color || '#000000'}
                    onChange={e => onUpdateElement({ color: e.target.value })}
                    className="w-full mt-1 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </label>
              </>
            )}
          </div>
        </Section>

        {/* Advanced */}
        <Section
          title="Advanced"
          id="advanced"
          expanded={expandedSections.has('advanced')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedElement.locked}
                onChange={e => onUpdateElement({ locked: e.target.checked })}
                className="w-3 h-3"
              />
              <span className="text-xs text-gray-700">Lock Position</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedElement.visible}
                onChange={e => onUpdateElement({ visible: e.target.checked })}
                className="w-3 h-3"
              />
              <span className="text-xs text-gray-700">Visible</span>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Z-Index</span>
              <input
                type="number"
                value={selectedElement.z}
                onChange={e => onUpdateElement({ z: parseInt(e.target.value) })}
                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>
          </div>
        </Section>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  id: string
  expanded: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}

function Section({ title, id, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDown size={16} className={`text-gray-500 transition ${expanded ? '' : '-rotate-90'}`} />
      </button>

      {expanded && <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">{children}</div>}
    </div>
  )
}
