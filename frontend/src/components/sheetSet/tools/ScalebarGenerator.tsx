'use client'

import React from 'react'
import type { ArchScale, SheetSize } from '../sheetSetTypes'
import { calculateScalebarGraduations } from './ScaleEngine'

interface ScalebarGeneratorProps {
  scale: ArchScale
  sheetSize: SheetSize
  style?: 'metric-blocks' | 'tick-marks' | 'minimal-line'
  primaryColor?: string
}

/**
 * Dynamic Architectural Scalebar SVG Component
 * Generates accurate metric scale bars based on drawing scale and sheet dimensions.
 */
export const ScalebarGenerator: React.FC<ScalebarGeneratorProps> = ({
  scale = '1:100',
  sheetSize = 'A1',
  style = 'metric-blocks',
  primaryColor = '#1E293B',
}) => {
  const graduations = calculateScalebarGraduations(scale, sheetSize)
  const barWidthPx = Math.max(120, graduations.scalebarWidthMm * 3)

  return (
    <div className="inline-flex flex-col items-center pointer-events-auto bg-white/90 dark:bg-gray-900/90 p-2 rounded border border-gray-200 dark:border-gray-800 shadow-sm text-xs select-none">
      <div className="text-[10px] font-semibold tracking-wider text-gray-700 dark:text-gray-300 uppercase mb-1">
        SCALE {scale}
      </div>

      <svg width={barWidthPx} height={20} viewBox={`0 0 ${barWidthPx} 20`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Metric Blocks Style */}
        {style === 'metric-blocks' && (
          <g>
            <rect x={0} y={6} width={barWidthPx / 2} height={6} fill={primaryColor} />
            <rect x={barWidthPx / 2} y={6} width={barWidthPx / 2} height={6} fill="none" stroke={primaryColor} strokeWidth={1.5} />
            <line x1={0} y1={6} x2={barWidthPx} y2={6} stroke={primaryColor} strokeWidth={1.5} />
            <line x1={0} y1={12} x2={barWidthPx} y2={12} stroke={primaryColor} strokeWidth={1.5} />
          </g>
        )}

        {/* Tick Marks Style */}
        {style === 'tick-marks' && (
          <g stroke={primaryColor} strokeWidth={1.5}>
            <line x1={0} y1={10} x2={barWidthPx} y2={10} />
            <line x1={0} y1={4} x2={0} y2={16} />
            <line x1={barWidthPx / 2} y1={6} x2={barWidthPx / 2} y2={14} />
            <line x1={barWidthPx} y1={4} x2={barWidthPx} y2={16} />
          </g>
        )}

        {/* Minimal Line Style */}
        {style === 'minimal-line' && (
          <g stroke={primaryColor} strokeWidth={1.5}>
            <line x1={0} y1={10} x2={barWidthPx} y2={10} />
            <line x1={0} y1={5} x2={0} y2={10} />
            <line x1={barWidthPx} y1={5} x2={barWidthPx} y2={10} />
          </g>
        )}
      </svg>

      {/* Graduation Labels */}
      <div className="w-full flex justify-between text-[9px] font-mono text-gray-600 dark:text-gray-400 mt-0.5">
        <span>0</span>
        <span>{graduations.realWorldMeters / 2}m</span>
        <span>{graduations.label}</span>
      </div>
    </div>
  )
}
