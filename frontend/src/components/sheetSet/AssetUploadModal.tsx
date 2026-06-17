import React, { useState } from 'react'
import { DrawingType, ArchScale } from './sheetSetTypes'

interface AssetUploadModalProps {
  assetUrl: string
  onConfirm: (metadata: { drawingType: DrawingType; originalScale?: ArchScale }) => void
  onCancel: () => void
}

const DRAWING_TYPES: { id: DrawingType; label: string; icon: string }[] = [
  { id: 'plan', label: 'Plan', icon: '📐' },
  { id: 'section', label: 'Section', icon: '✂️' },
  { id: 'elevation', label: 'Elevation', icon: '🏛️' },
  { id: 'detail', label: 'Detail', icon: '🔍' },
  { id: 'diagram', label: 'Diagram / Sketch', icon: '💡' },
  { id: 'render', label: 'Render / View', icon: '🖼️' },
  { id: 'analysis', label: 'Analysis / Map', icon: '🗺️' },
]

const SCALES: ArchScale[] = [
  '1:1', '1:5', '1:10', '1:20', '1:50', '1:100', '1:200', '1:500', '1:1000'
]

export function AssetUploadModal({ assetUrl, onConfirm, onCancel }: AssetUploadModalProps) {
  const [drawingType, setDrawingType] = useState<DrawingType>('plan')
  const [scale, setScale] = useState<ArchScale | 'none'>('1:100')

  const isTechnical = ['plan', 'section', 'elevation', 'detail'].includes(drawingType)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 flex flex-col md:flex-row gap-6">
        
        {/* Preview Side */}
        <div className="w-full md:w-1/2 flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Asset Preview
          </div>
          <div className="flex-1 flex items-center justify-center p-4 min-h-[250px]">
            <img src={assetUrl} alt="Upload preview" className="max-w-full max-h-full object-contain drop-shadow-md" />
          </div>
        </div>

        {/* Intelligence Side */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Categorize Drawing</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cosmo uses this to enforce scales and suggest layouts.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Asset Type</label>
            <div className="grid grid-cols-2 gap-2">
              {DRAWING_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setDrawingType(t.id)}
                  className={`px-3 py-2 text-left rounded-lg text-sm border transition flex items-center gap-2
                    ${drawingType === t.id 
                      ? 'border-[#D4AF37] bg-[#FBE7A1]/20 font-semibold text-gray-900' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                >
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isTechnical && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Original Scale</label>
              <select
                value={scale}
                onChange={(e) => setScale(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none"
              >
                <option value="none">Not to scale</option>
                {SCALES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                This locks the proportion of the drawing on the sheet.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm({ 
                drawingType, 
                originalScale: isTechnical && scale !== 'none' ? (scale as ArchScale) : undefined 
              })}
              className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
            >
              Add to Sheet
            </button>
          </div>
        </div>
        
      </div>
    </div>
  )
}
