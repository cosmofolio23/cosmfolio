'use client'

import React from 'react'
import { LayoutDefinition } from '@/types/portfolio'
import { getLayoutPreview } from '@/lib/presetImages'

interface LayoutPreviewCardProps {
  layout: LayoutDefinition
  isSelected: boolean
  onSelect: (layoutId: string) => void
}

export function LayoutPreviewCard({ layout, isSelected, onSelect }: LayoutPreviewCardProps) {
  const preview = getLayoutPreview(layout.id)

  return (
    <button
      onClick={() => onSelect(layout.id)}
      className={`w-full overflow-hidden rounded-lg transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg scale-105'
          : 'hover:shadow-md'
      }`}
    >
      {/* Preview Image */}
      <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
        {preview && (
          <img
            src={preview}
            alt={layout.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Layout Info */}
      <div className="p-4 bg-white">
        <h4 className="font-bold mb-1">{layout.name}</h4>
        <p className="text-xs text-gray-600 mb-3">{layout.description}</p>

        {/* Layout Stats */}
        <div className="flex gap-2 flex-wrap mb-3">
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {layout.minAssets}-{layout.maxAssets} assets
          </span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {layout.gridConfig.columns}×{layout.gridConfig.rows} grid
          </span>
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          {layout.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Asset Types */}
        {layout.requiredAssetTypes.length > 0 && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-600">
            <strong>Assets:</strong> {layout.requiredAssetTypes.join(', ')}
          </div>
        )}
      </div>
    </button>
  )
}
