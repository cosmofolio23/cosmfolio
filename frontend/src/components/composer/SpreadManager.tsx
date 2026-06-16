'use client'

import React, { useState } from 'react'
import type { Page, DesignTokens } from './types'
import type { PageSize } from './publishingTypes'
import PageComposer from './PageComposer'

interface Props {
  pages: Page[]
  tokens: DesignTokens
  pageSize: PageSize
  onClose: () => void
  onReorder: (newPages: Page[]) => void
  onSelect: (idx: number) => void
  onDuplicate: (idx: number) => void
  onDelete: (idx: number) => void
}

export function SpreadManager({ pages, tokens, pageSize, onClose, onReorder, onSelect, onDuplicate, onDelete }: Props) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    const img = new Image(); img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
    e.dataTransfer.setDragImage(img, 0, 0)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === targetIdx) return
    const updated = [...pages]
    const [moved] = updated.splice(draggedIdx, 1)
    updated.splice(targetIdx, 0, moved)
    onReorder(updated)
    setDraggedIdx(null)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-sm flex flex-col p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-8 text-white max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-3xl font-bold mb-1">Spread Manager</h2>
          <p className="text-gray-400 text-sm">Drag thumbnails to reorder your portfolio. Click a page to edit it.</p>
        </div>
        <button onClick={onClose} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
          Close Manager
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {pages.map((page, idx) => {
            return (
              <div 
                key={page.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => setDraggedIdx(null)}
                className={`group relative flex flex-col items-center transition-all duration-200 ${draggedIdx === idx ? 'opacity-30 scale-95' : 'hover:scale-105'}`}
              >
                {/* Visual Thumbnail */}
                <div 
                  className="w-full bg-white rounded shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing border-2 border-transparent group-hover:border-blue-500 relative"
                  style={{ aspectRatio: `${pageSize.width}/${pageSize.height}` }}
                  onClick={() => { onSelect(idx); onClose() }}
                >
                  <div className="absolute top-0 left-0 pointer-events-none" style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: '500%', height: '500%' }}>
                    <PageComposer 
                      page={page} 
                      tokens={tokens} 
                      pageSize={pageSize} 
                      onChange={() => {}} 
                      editableFree={false} 
                      overflowVisible={false} 
                      grid={undefined} 
                    />
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                      Edit Page
                    </span>
                  </div>
                </div>

                {/* Page Label & Actions */}
                <div className="mt-3 flex items-center justify-between w-full">
                  <span className="text-gray-400 font-semibold text-xs px-2 py-1 bg-black/40 rounded shadow-inner">
                    Page {idx + 1}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button onClick={() => onDuplicate(idx)} className="p-1.5 hover:bg-white/20 rounded text-white text-xs" title="Duplicate">📑</button>
                    <button onClick={() => onDelete(idx)} className="p-1.5 hover:bg-red-500/50 rounded text-red-300 text-xs" title="Delete">🗑️</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
