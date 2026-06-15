/**
 * Master Page Editor — design fixed elements (headers, footers, logos, page numbers)
 *
 * UI for creating/editing MasterPage definitions.
 * Master elements appear on every page using that master.
 */

import React, { useState } from 'react'
import type { MasterPage, MasterElement } from './publishingTypes'

interface MasterPageEditorProps {
  master: MasterPage
  onUpdate: (master: MasterPage) => void
  onDelete?: () => void
}

export function MasterPageEditor({ master, onUpdate, onDelete }: MasterPageEditorProps) {
  const [editingElement, setEditingElement] = useState<string | null>(null)
  const [showAddElement, setShowAddElement] = useState(false)

  const addElement = (type: MasterElement['type']) => {
    const newElem: MasterElement = {
      id: `master-${Date.now()}`,
      type,
      position: 'top-left',
      text: type === 'text' ? 'Master Text' : undefined,
      textTemplate: type === 'text' ? '${pageNumber}' : undefined,
      fontSize: type === 'text' ? 12 : undefined,
      fontFamily: type === 'text' ? 'Inter' : undefined,
      color: type === 'text' ? '#000' : undefined,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: master.elements.length,
    }
    onUpdate({ ...master, elements: [...master.elements, newElem] })
    setShowAddElement(false)
  }

  const updateElement = (id: string, updates: Partial<MasterElement>) => {
    onUpdate({
      ...master,
      elements: master.elements.map(e => (e.id === id ? { ...e, ...updates } : e)),
    })
  }

  const deleteElement = (id: string) => {
    onUpdate({ ...master, elements: master.elements.filter(e => e.id !== id) })
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{master.name}</h3>
          {master.description && <p className="text-xs text-gray-500">{master.description}</p>}
        </div>
        {onDelete && (
          <button onClick={onDelete} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
            Delete
          </button>
        )}
      </div>

      {/* Margins */}
      <div className="grid grid-cols-4 gap-2">
        {(['marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const).map(key => (
          <div key={key}>
            <label className="text-[10px] uppercase text-gray-500">{key.replace('margin', '')}</label>
            <input
              type="number"
              value={master[key] || 0}
              onChange={e => onUpdate({ ...master, [key]: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded text-xs"
              placeholder="mm"
            />
          </div>
        ))}
      </div>

      {/* Elements List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700">Master Elements ({master.elements.length})</h4>
        {master.elements.map(elem => (
          <div
            key={elem.id}
            className="p-2 bg-white border rounded cursor-pointer hover:border-blue-400"
            onClick={() => setEditingElement(editingElement === elem.id ? null : elem.id)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{elem.type}</span>
              <button
                onClick={e => {
                  e.stopPropagation()
                  deleteElement(elem.id)
                }}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                ✕
              </button>
            </div>

            {editingElement === elem.id && (
              <div className="mt-2 space-y-2 border-t pt-2">
                {elem.type === 'text' && (
                  <>
                    <input
                      type="text"
                      value={elem.text || ''}
                      onChange={e => updateElement(elem.id, { text: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-xs"
                      placeholder="Text content"
                    />
                    <input
                      type="text"
                      value={elem.textTemplate || ''}
                      onChange={e => updateElement(elem.id, { textTemplate: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-xs"
                      placeholder="Template: ${pageNumber} ${projectTitle}"
                    />
                    <select
                      value={elem.fontSize || 12}
                      onChange={e => updateElement(elem.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border rounded text-xs"
                    >
                      {[8, 10, 12, 14, 16, 18, 20, 24].map(s => (
                        <option key={s} value={s}>
                          {s}px
                        </option>
                      ))}
                    </select>
                    <input
                      type="color"
                      value={elem.color || '#000000'}
                      onChange={e => updateElement(elem.id, { color: e.target.value })}
                      className="w-full h-8 border rounded"
                    />
                  </>
                )}

                {elem.type === 'image' && (
                  <>
                    <label className="text-[10px] uppercase text-gray-500">Image URL</label>
                    <input
                      type="text"
                      value={elem.imageUrl || ''}
                      onChange={e => updateElement(elem.id, { imageUrl: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-xs"
                      placeholder="https://... or paste a URL"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-gray-500">Width</label>
                        <input
                          type="number"
                          value={elem.width || 40}
                          onChange={e => updateElement(elem.id, { width: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="px"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-gray-500">Height</label>
                        <input
                          type="number"
                          value={elem.height || 40}
                          onChange={e => updateElement(elem.id, { height: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs"
                          placeholder="px"
                        />
                      </div>
                    </div>
                  </>
                )}

                {elem.type === 'line' && (
                  <>
                    <label className="text-[10px] uppercase text-gray-500">Line Color</label>
                    <input
                      type="color"
                      value={elem.color || '#000000'}
                      onChange={e => updateElement(elem.id, { color: e.target.value })}
                      className="w-full h-8 border rounded"
                    />
                    <label className="text-[10px] uppercase text-gray-500">Stroke Width (px)</label>
                    <input
                      type="number"
                      value={elem.strokeWidth || 1}
                      onChange={e => updateElement(elem.id, { strokeWidth: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border rounded text-xs"
                      min="1"
                      max="20"
                    />
                  </>
                )}

                {elem.type === 'watermark' && (
                  <>
                    <label className="text-[10px] uppercase text-gray-500">Watermark Text</label>
                    <input
                      type="text"
                      value={elem.text || 'DRAFT'}
                      onChange={e => updateElement(elem.id, { text: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-xs"
                      placeholder="e.g. DRAFT, CONFIDENTIAL"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-gray-500">Font Size</label>
                        <input
                          type="number"
                          value={elem.fontSize || 48}
                          onChange={e => updateElement(elem.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-gray-500">Opacity</label>
                        <input
                          type="number"
                          value={Math.round((elem.opacity || 0.12) * 100)}
                          onChange={e => updateElement(elem.id, { opacity: parseInt(e.target.value) / 100 })}
                          className="w-full px-2 py-1 border rounded text-xs"
                          min="1"
                          max="100"
                        />
                      </div>
                    </div>
                    <label className="text-[10px] uppercase text-gray-500">Color</label>
                    <input
                      type="color"
                      value={elem.color || '#000000'}
                      onChange={e => updateElement(elem.id, { color: e.target.value })}
                      className="w-full h-8 border rounded"
                    />
                  </>
                )}

                <select
                  value={elem.position}
                  onChange={e => updateElement(elem.id, { position: e.target.value as MasterElement['position'] })}
                  className="w-full px-2 py-1 border rounded text-xs"
                >
                  {['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={elem.locked}
                    onChange={e => updateElement(elem.id, { locked: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-xs">Lock position</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Element */}
      {showAddElement ? (
        <div className="grid grid-cols-3 gap-1">
          {(['text', 'image', 'line', 'watermark'] as const).map(type => (
            <button
              key={type}
              onClick={() => addElement(type)}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
            >
              + {type}
            </button>
          ))}
          <button
            onClick={() => setShowAddElement(false)}
            className="col-span-3 px-2 py-1 border rounded text-xs text-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddElement(true)}
          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          + Add Master Element
        </button>
      )}
    </div>
  )
}
