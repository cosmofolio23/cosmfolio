'use client'

import React, { useState } from 'react'
import type { ArchScale, SheetElement } from '../sheetSetTypes'

interface BlownUpDetailToolProps {
  sourceElement: SheetElement
  onCreateDetail: (detailElement: Partial<SheetElement>) => void
  onClose: () => void
}

/**
 * Blown-Up Detail Tool Component
 * Select a region of a plan/section $\rightarrow$ scale it up (e.g. 1:20 detail from 1:100 plan)
 * $\rightarrow$ auto-generates callout tag, detail title, and new scale bar.
 */
export const BlownUpDetailTool: React.FC<BlownUpDetailToolProps> = ({
  sourceElement,
  onCreateDetail,
  onClose,
}) => {
  const sourceScale: ArchScale = sourceElement.drawing?.sheetScale || '1:100'
  const [targetScale, setTargetScale] = useState<ArchScale>('1:20')
  const [detailLabel, setDetailLabel] = useState('DETAIL A')
  const [shape, setShape] = useState<'circle' | 'rect' | 'cloud'>('circle')

  const handleGenerate = () => {
    const detailElement: Partial<SheetElement> = {
      kind: 'drawing',
      x: Math.min(80, (sourceElement.x || 10) + (sourceElement.w || 30) + 4),
      y: sourceElement.y || 10,
      w: (sourceElement.w || 30) * 1.2,
      h: (sourceElement.h || 30) * 1.2,
      z: (sourceElement.z || 10) + 1,
      maskShape: shape === 'circle' ? 'circle' : 'rect',
      drawing: {
        drawingName: detailLabel,
        drawingType: 'detail',
        originalScale: sourceScale,
        sheetScale: targetScale,
        url: sourceElement.src || sourceElement.drawing?.url || '',
        scaleLabel: `${detailLabel} (Scale ${targetScale})`,
      },
      annotationType: 'detail-callout',
      annotationLabels: {
        primary: 'A',
        secondary: '01',
        extra: `Scale ${targetScale}`,
      },
      scalebarLengthMeters: targetScale === '1:20' ? 2 : 5,
    }

    onCreateDetail(detailElement)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-150">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          🔍 Create Blown-Up Detail
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Maginfy a region of <span className="font-semibold text-gray-800 dark:text-gray-200">{sourceElement.drawing?.drawingName || 'Drawing'}</span> ({sourceScale}) into an architectural detail callout.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Detail Title & Tag
            </label>
            <input
              type="text"
              value={detailLabel}
              onChange={e => setDetailLabel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Target Detail Scale
            </label>
            <select
              value={targetScale}
              onChange={e => setTargetScale(e.target.value as ArchScale)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gold-500"
            >
              <option value="1:5">1:5 (Fine Detail)</option>
              <option value="1:10">1:10 (Construction Detail)</option>
              <option value="1:20">1:20 (Architectural Detail)</option>
              <option value="1:50">1:50 (Enlarged Room Plan)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Callout Mask Shape
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['circle', 'rect', 'cloud'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShape(s)}
                  className={`py-2 px-3 text-xs capitalize rounded-lg border font-medium transition-colors ${
                    shape === s
                      ? 'bg-gold-500 text-gray-950 border-gold-500 font-semibold'
                      : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-5 py-2 text-xs font-semibold bg-[#D4AF37] hover:bg-[#b8952d] text-gray-950 rounded-lg shadow transition-colors"
          >
            Generate Callout Detail
          </button>
        </div>
      </div>
    </div>
  )
}
