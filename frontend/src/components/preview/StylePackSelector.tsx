'use client'

import React, { useState } from 'react'
import { STYLE_PACKS } from '@/lib/stylePackDefinitions'
import { getStylePackPreview } from '@/lib/presetImages'

interface StylePackSelectorProps {
  selectedStyleId: string
  onSelect: (styleId: string) => void
}

export function StylePackSelector({ selectedStyleId, onSelect }: StylePackSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-6">Select Your Style Pack</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STYLE_PACKS.map((pack) => {
          const preview = getStylePackPreview(pack.id)
          const isSelected = selectedStyleId === pack.id

          return (
            <button
              key={pack.id}
              onClick={() => onSelect(pack.id)}
              className={`overflow-hidden rounded-lg transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                  : 'hover:shadow-md'
              }`}
            >
              {/* Preview Image */}
              <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                {preview?.sampleRender && (
                  <img
                    src={preview.sampleRender}
                    alt={pack.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Style Info */}
              <div
                className="p-4"
                style={{
                  backgroundColor: pack.colors.background,
                  color: pack.colors.text.primary,
                }}
              >
                <h4 className="font-bold text-lg mb-1">{pack.name}</h4>
                <p className="text-sm opacity-75">{pack.description}</p>

                {/* Color Palette Preview */}
                <div className="flex gap-2 mt-3">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: pack.colors.background }}
                    title="Background"
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: pack.colors.text.primary }}
                    title="Primary Text"
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: pack.colors.accent.primary }}
                    title="Accent"
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: pack.colors.border }}
                    title="Border"
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
