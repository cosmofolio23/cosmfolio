'use client'

import React from 'react'
import type { BorderDefinition, SheetSet, Sheet } from '../sheetSetTypes'
import { getBorderById } from './BorderLibrary'

interface VectorBorderOverlayProps {
  sheetSet: SheetSet
  sheet: Sheet
  widthPx: number
  heightPx: number
}

/**
 * Parametric Vector Border SVG Overlay
 * Scales losslessly to any sheet size (A0–A4) and renders corner accents, grid lines, and margin borders.
 */
export const VectorBorderOverlay: React.FC<VectorBorderOverlayProps> = ({
  sheetSet,
  sheet,
  widthPx,
  heightPx,
}) => {
  const borderId = sheet.overrideBorderId || sheetSet.borderId || sheetSet.projectStyle?.borderId || 'border-minimal-1'
  const border = getBorderById(borderId)

  const margin = Math.max(10, (border.style.marginMm / 210) * widthPx)
  const strokeWidth = border.style.borderWidthMm * 1.5
  const strokeColor = border.style.lineColor || '#1E293B'
  const accentColor = border.style.accentColor || '#D4AF37'

  const innerW = widthPx - margin * 2
  const innerH = heightPx - margin * 2

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Grid Pattern if Enabled */}
      {border.style.showGridLines && (
        <g opacity={0.12}>
          <line x1={widthPx / 3} y1={margin} x2={widthPx / 3} y2={heightPx - margin} stroke={strokeColor} strokeDasharray="4 4" />
          <line x1={(widthPx * 2) / 3} y1={margin} x2={(widthPx * 2) / 3} y2={heightPx - margin} stroke={strokeColor} strokeDasharray="4 4" />
          <line x1={margin} y1={heightPx / 3} x2={widthPx - margin} y2={heightPx / 3} stroke={strokeColor} strokeDasharray="4 4" />
          <line x1={margin} y1={(heightPx * 2) / 3} x2={widthPx - margin} y2={(heightPx * 2) / 3} stroke={strokeColor} strokeDasharray="4 4" />
        </g>
      )}

      {/* Main Outer Border Rect */}
      <rect
        x={margin}
        y={margin}
        width={innerW}
        height={innerH}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        rx={border.style.cornerStyle === 'rounded' ? 8 : 0}
      />

      {/* Double Line Corner Style */}
      {border.style.cornerStyle === 'double' && (
        <rect
          x={margin + 4}
          y={margin + 4}
          width={innerW - 8}
          height={innerH - 8}
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.5}
        />
      )}

      {/* Corner Crosshairs / Ticks */}
      {(border.style.cornerStyle === 'crosshair' || border.style.cornerStyle === 'accent-tick') && (
        <g stroke={accentColor} strokeWidth={2}>
          {/* Top-Left */}
          <line x1={margin - 10} y1={margin} x2={margin + 10} y2={margin} />
          <line x1={margin} y1={margin - 10} x2={margin} y2={margin + 10} />
          {/* Top-Right */}
          <line x1={widthPx - margin - 10} y1={margin} x2={widthPx - margin + 10} y2={margin} />
          <line x1={widthPx - margin} y1={margin - 10} x2={widthPx - margin} y2={margin + 10} />
          {/* Bottom-Left */}
          <line x1={margin - 10} y1={heightPx - margin} x2={margin + 10} y2={heightPx - margin} />
          <line x1={margin} y1={heightPx - margin - 10} x2={margin} y2={heightPx - margin + 10} />
          {/* Bottom-Right */}
          <line x1={widthPx - margin - 10} y1={heightPx - margin} x2={widthPx - margin + 10} y2={heightPx - margin} />
          <line x1={widthPx - margin} y1={heightPx - margin - 10} x2={widthPx - margin} y2={heightPx - margin + 10} />
        </g>
      )}
    </svg>
  )
}
