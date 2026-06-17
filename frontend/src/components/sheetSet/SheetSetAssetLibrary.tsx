import React, { useState } from 'react'
import { DrawingType, ArchScale } from './sheetSetTypes'

export interface ProjectAsset {
  id: string
  url: string
  name: string
  type: DrawingType
  originalScale?: ArchScale
}

interface SheetSetAssetLibraryProps {
  assets: ProjectAsset[]
  onDragStart: (asset: ProjectAsset) => void
}

export function SheetSetAssetLibrary({ assets, onDragStart }: SheetSetAssetLibraryProps) {
  const [collapsed, setCollapsed] = useState(true)

  const drawings = assets.filter(a => ['plan', 'section', 'elevation', 'detail'].includes(a.type))
  const visuals = assets.filter(a => ['render'].includes(a.type))
  const process = assets.filter(a => ['diagram', 'analysis', 'sketch'].includes(a.type))

  if (collapsed) {
    return (
      <div className="w-10 bg-white border-r border-gray-200 flex flex-col items-center pt-3 shrink-0">
        <button onClick={() => setCollapsed(false)} title="Open project assets"
          className="text-lg hover:scale-110 transition" >📁</button>
        <span className="mt-2 text-[9px] text-gray-400 font-semibold tracking-wide" style={{ writingMode: 'vertical-rl' }}>
          ASSETS
        </span>
      </div>
    )
  }

  const renderGroup = (title: string, groupAssets: ProjectAsset[], icon: string) => {
    if (groupAssets.length === 0) return null
    return (
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span>{icon}</span> {title} ({groupAssets.length})
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {groupAssets.map(asset => (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(asset))
                onDragStart(asset)
              }}
              className="group relative aspect-square bg-gray-50 border border-gray-200 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:border-[#D4AF37]"
            >
              <img src={asset.url} alt={asset.name} className="w-full h-full object-contain p-2" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-1 translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-[9px] text-white font-medium truncate">{asset.name}</p>
                {asset.originalScale && (
                  <p className="text-[8px] text-gray-300">{asset.originalScale}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-[230px] shrink-0 flex flex-col bg-white border-r border-gray-200">
      <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between bg-[#FBE7A1]/10">
        <span className="text-xs font-bold text-[#9C7416]">📁 Project Assets</span>
        <button onClick={() => setCollapsed(true)} className="text-gray-400 text-xs hover:text-gray-600" title="Collapse">◀</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {assets.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-10 px-4">
            <p className="text-2xl mb-2">📥</p>
            Drop images onto the canvas to add them to your project library.
          </div>
        ) : (
          <>
            {renderGroup('Drawings', drawings, '📐')}
            {renderGroup('Visuals', visuals, '🖼️')}
            {renderGroup('Process', process, '💡')}
          </>
        )}
      </div>
    </div>
  )
}
