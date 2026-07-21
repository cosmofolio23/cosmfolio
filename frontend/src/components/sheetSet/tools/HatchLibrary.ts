/**
 * Master Architectural Hatch Pattern Library
 *
 * Vector SVG Hatch definitions for architectural plans, sections, and details:
 * - Concrete, Brickwork, Insulated Cavity, Earth/Poche, Glass, Wood Grain, Floor Tiles
 */

import type { HatchDefinition } from '../sheetSetTypes'

export const HATCH_PATTERNS: HatchDefinition[] = [
  {
    id: 'hatch-concrete',
    name: 'Reinforced Concrete',
    category: 'concrete',
    svgPatternId: 'pattern-concrete',
    scale: 1,
    rotation: 0,
    color: '#64748B',
  },
  {
    id: 'hatch-brick',
    name: 'Standard Brickwork',
    category: 'brick',
    svgPatternId: 'pattern-brick',
    scale: 1,
    rotation: 0,
    color: '#B91C1C',
  },
  {
    id: 'hatch-earth',
    name: 'Ground Earth / Poche',
    category: 'earth',
    svgPatternId: 'pattern-earth',
    scale: 1,
    rotation: 45,
    color: '#334155',
  },
  {
    id: 'hatch-insulation',
    name: 'Thermal Insulation',
    category: 'insulation',
    svgPatternId: 'pattern-insulation',
    scale: 1,
    rotation: 0,
    color: '#F59E0B',
  },
  {
    id: 'hatch-tiles',
    name: 'Floor / Wall Tiles',
    category: 'tiles',
    svgPatternId: 'pattern-tiles',
    scale: 1,
    rotation: 0,
    color: '#94A3B8',
  },
  {
    id: 'hatch-glass',
    name: 'Glazing / Glass Hatch',
    category: 'glass',
    svgPatternId: 'pattern-glass',
    scale: 1,
    rotation: 0,
    color: '#0284C7',
  },
]

/**
 * Render SVG <defs> for all architectural hatch patterns so they can be referenced by fill="url(#pattern-id)"
 */
export function getHatchSvgDefs(): string {
  return `
    <defs>
      <!-- Concrete Hatch Pattern -->
      <pattern id="pattern-concrete" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="1.5" fill="#64748B" />
        <circle cx="14" cy="12" r="1.2" fill="#64748B" />
        <path d="M10 2L12 6L8 5Z" fill="#64748B" />
        <path d="M2 14L5 18L1 16Z" fill="#64748B" />
      </pattern>

      <!-- Brick Pattern -->
      <pattern id="pattern-brick" width="30" height="15" patternUnits="userSpaceOnUse">
        <path d="M0 0H30V15H0Z" fill="none" stroke="#B91C1C" stroke-width="0.8" />
        <path d="M0 7.5H30" stroke="#B91C1C" stroke-width="0.8" />
        <path d="M15 0V7.5" stroke="#B91C1C" stroke-width="0.8" />
        <path d="M0 7.5V15" stroke="#B91C1C" stroke-width="0.8" />
        <path d="M30 7.5V15" stroke="#B91C1C" stroke-width="0.8" />
      </pattern>

      <!-- Earth Hatch Pattern -->
      <pattern id="pattern-earth" width="16" height="16" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="16" y2="16" stroke="#334155" stroke-width="1" />
        <line x1="8" y1="0" x2="16" y2="8" stroke="#334155" stroke-width="1" />
        <line x1="0" y1="8" x2="8" y2="16" stroke="#334155" stroke-width="1" />
      </pattern>

      <!-- Thermal Insulation Hatch -->
      <pattern id="pattern-insulation" width="20" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5 Q 5 0, 10 5 T 20 5" fill="none" stroke="#F59E0B" stroke-width="1.2" />
      </pattern>

      <!-- Tile Grid Pattern -->
      <pattern id="pattern-tiles" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="20" height="20" fill="none" stroke="#94A3B8" stroke-width="0.8" />
      </pattern>
    </defs>
  `
}
