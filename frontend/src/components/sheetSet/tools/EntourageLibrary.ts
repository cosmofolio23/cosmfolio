/**
 * Scale-Aware Entourage Asset Library
 *
 * Vector 2D assets (Trees, Plants, Human Figures, Vehicles, Furniture) tagged with real-world dimensions (mm).
 * Auto-scales entourage based on target drawing scale (1:20, 1:50, 1:100, etc.) so a "1.8m person" is always perfectly proportioned.
 */

import type { EntourageDefinition, ArchScale, SheetSize } from '../sheetSetTypes'
import { calculatePlacedWidthMm } from './ScaleEngine'

export const ENTOURAGE_ASSETS: EntourageDefinition[] = [
  // Human Figures
  {
    id: 'figure-person-standing',
    name: 'Standing Person (Line)',
    category: 'people',
    viewType: 'elevation',
    style: 'line',
    realWorldHeightMm: 1800,
    realWorldWidthMm: 500,
    svgContent: `
      <svg viewBox="0 0 50 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="18" r="10" stroke="#1E293B" stroke-width="2" />
        <line x1="25" y1="28" x2="25" y2="110" stroke="#1E293B" stroke-width="2" />
        <line x1="25" y1="50" x2="5" y2="90" stroke="#1E293B" stroke-width="2" />
        <line x1="25" y1="50" x2="45" y2="90" stroke="#1E293B" stroke-width="2" />
        <line x1="25" y1="110" x2="10" y2="175" stroke="#1E293B" stroke-width="2" />
        <line x1="25" y1="110" x2="40" y2="175" stroke="#1E293B" stroke-width="2" />
      </svg>
    `,
  },
  {
    id: 'figure-person-silhouette',
    name: 'Human Silhouette',
    category: 'people',
    viewType: 'elevation',
    style: 'silhouette',
    realWorldHeightMm: 1750,
    realWorldWidthMm: 550,
    svgContent: `
      <svg viewBox="0 0 55 175" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M27.5 0C32.5 0 36.5 4 36.5 9C36.5 14 32.5 18 27.5 18C22.5 18 18.5 14 18.5 9C18.5 4 22.5 0 27.5 0ZM14 30C14 26 18 24 27.5 24C37 24 41 26 41 30L44 80H35L33 175H22L20 80H11L14 30Z" fill="#1E293B" />
      </svg>
    `,
  },

  // Architectural Trees
  {
    id: 'tree-plan-minimal',
    name: 'Minimal Tree (Plan)',
    category: 'tree',
    viewType: 'top',
    style: 'line',
    realWorldHeightMm: 5000,
    realWorldWidthMm: 5000,
    svgContent: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="#1E293B" stroke-width="1.5" stroke-dasharray="4 3" />
        <circle cx="50" cy="50" r="30" stroke="#1E293B" stroke-width="1" />
        <circle cx="50" cy="50" r="3" fill="#1E293B" />
      </svg>
    `,
  },
  {
    id: 'tree-elevation-architectural',
    name: 'Architectural Tree (Elevation)',
    category: 'tree',
    viewType: 'elevation',
    style: 'sketch',
    realWorldHeightMm: 7000,
    realWorldWidthMm: 4500,
    svgContent: `
      <svg viewBox="0 0 90 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="45" y1="40" x2="45" y2="140" stroke="#1E293B" stroke-width="2" />
        <circle cx="45" cy="50" r="40" stroke="#1E293B" stroke-width="1.5" fill="#1E293B" fill-opacity="0.05" />
        <path d="M45 70L30 50M45 80L60 60" stroke="#1E293B" stroke-width="1.5" />
      </svg>
    `,
  },

  // Vehicles
  {
    id: 'vehicle-car-elevation',
    name: 'Sedan Car (Elevation)',
    category: 'vehicle',
    viewType: 'elevation',
    style: 'line',
    realWorldHeightMm: 1500,
    realWorldWidthMm: 4600,
    svgContent: `
      <svg viewBox="0 0 230 75" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 L35 30 L80 15 L150 15 L185 30 L220 50 Z" stroke="#1E293B" stroke-width="2" fill="none" />
        <rect x="5" y="45" width="220" height="15" rx="5" stroke="#1E293B" stroke-width="2" />
        <circle cx="45" cy="60" r="12" fill="#1E293B" />
        <circle cx="180" cy="60" r="12" fill="#1E293B" />
      </svg>
    `,
  },
]

/**
 * Calculate scale-aware entourage dimensions on the sheet canvas (% of sheet width/height)
 */
export function calculateEntourageSheetBounds(
  entourage: EntourageDefinition,
  scale: ArchScale,
  sheetSize: SheetSize
) {
  const widthMm = calculatePlacedWidthMm(entourage.realWorldWidthMm, scale)
  const heightMm = calculatePlacedWidthMm(entourage.realWorldHeightMm, scale)

  return {
    widthMm,
    heightMm,
    widthPercent: (widthMm / 841) * 100, // Normalized for A1 canvas
    heightPercent: (heightMm / 594) * 100,
  }
}
