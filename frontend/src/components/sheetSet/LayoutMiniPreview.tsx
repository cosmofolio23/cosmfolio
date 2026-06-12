'use client'

/**
 * Tiny visual preview of a SheetLayout. Frame-based layouts render their real
 * asymmetric composition; uniform layouts render as a CSS grid.
 */

import type { SheetLayout } from './sheetSetTypes'

export function LayoutMiniPreview({ layout, className = '' }: { layout: SheetLayout; className?: string }) {
  const hasFrames = layout.slotDefinitions.some(s => s.frame)

  if (hasFrames) {
    return (
      <div className={`relative bg-white border border-gray-300 rounded-sm overflow-hidden ${className}`}>
        {layout.slotDefinitions.map((s, i) => {
          const f = s.frame || { x: 6, y: 8, w: 88, h: 84 }
          return (
            <div key={i} className="absolute rounded-[1px] bg-[#D4AF37]/40"
              style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }} />
          )
        })}
      </div>
    )
  }

  const cells = Math.min(layout.slotDefinitions.length, layout.columnCount * layout.rowCount)
  return (
    <div className={`bg-white border border-gray-300 rounded-sm p-[3px] grid gap-[2px] ${className}`}
      style={{
        gridTemplateColumns: `repeat(${layout.columnCount}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rowCount}, 1fr)`,
      }}>
      {Array.from({ length: cells }, (_, i) => (
        <div key={i} className="rounded-[1px] bg-[#D4AF37]/40" />
      ))}
    </div>
  )
}
