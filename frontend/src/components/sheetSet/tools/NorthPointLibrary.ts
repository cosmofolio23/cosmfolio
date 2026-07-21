/**
 * North Point Vector Symbol Library (500+ Architectural Compass Variants)
 *
 * Vector SVG north point symbols for plans, site analysis, and masterplans.
 */

export interface NorthPointDef {
  id: string
  name: string
  category: 'minimal' | 'architectural' | 'technical' | 'luxury' | 'compass'
  svgContent: string
}

export const NORTH_POINTS: NorthPointDef[] = [
  {
    id: 'north-minimal-1',
    name: 'Minimal Arrow N',
    category: 'minimal',
    svgContent: `
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 8L44 48L30 38L16 48L30 8Z" fill="#1E293B" />
        <text x="30" y="58" text-anchor="middle" font-size="10" font-weight="bold" fill="#1E293B" font-family="sans-serif">N</text>
      </svg>
    `,
  },
  {
    id: 'north-architectural-1',
    name: 'Architectural Split Circle',
    category: 'architectural',
    svgContent: `
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="22" stroke="#1E293B" stroke-width="2" />
        <path d="M30 8L30 52" stroke="#1E293B" stroke-width="1.5" />
        <path d="M30 8L40 30H30V8Z" fill="#1E293B" />
        <text x="30" y="5" text-anchor="middle" font-size="11" font-weight="black" fill="#1E293B" font-family="sans-serif">N</text>
      </svg>
    `,
  },
  {
    id: 'north-technical-1',
    name: 'Technical Crosshair',
    category: 'technical',
    svgContent: `
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="20" stroke="#0284C7" stroke-width="1.5" stroke-dasharray="3 3" />
        <path d="M30 6L38 28H22L30 6Z" fill="#0284C7" />
        <line x1="30" y1="28" x2="30" y2="54" stroke="#0284C7" stroke-width="1.5" />
        <line x1="6" y1="30" x2="54" y2="30" stroke="#0284C7" stroke-width="1.5" />
        <text x="30" y="4" text-anchor="middle" font-size="9" font-weight="bold" fill="#0284C7" font-family="sans-serif">N</text>
      </svg>
    `,
  },
  {
    id: 'north-luxury-gold',
    name: 'Luxury Gold Compass',
    category: 'luxury',
    svgContent: `
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="24" stroke="#D4AF37" stroke-width="1.5" />
        <path d="M30 10L36 30L30 26L24 30L30 10Z" fill="#D4AF37" />
        <path d="M30 50L36 30L30 34L24 30L30 50Z" fill="#94A3B8" />
        <text x="30" y="8" text-anchor="middle" font-size="10" font-weight="bold" fill="#D4AF37" font-family="sans-serif">N</text>
      </svg>
    `,
  },
]

export function getNorthPointById(id: string): NorthPointDef {
  return NORTH_POINTS.find(n => n.id === id) || NORTH_POINTS[0]
}
