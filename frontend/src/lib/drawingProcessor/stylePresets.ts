/**
 * Style presets per drawing type. A preset is a bundle of adjustment + line
 * settings plus a background treatment and optional decorations that the
 * processor applies in one click. Users can fine-tune everything afterwards.
 */
import type { Adjustments, LineSettings } from './imageOps'

export interface DrawingTypeDef {
  id: string
  name: string
  icon: string
}

export const DRAWING_TYPES: DrawingTypeDef[] = [
  { id: 'floor-plan', name: 'Floor Plan', icon: '🏠' },
  { id: 'section', name: 'Section', icon: '✂️' },
  { id: 'elevation', name: 'Elevation', icon: '🏛️' },
  { id: 'site-plan', name: 'Site Plan', icon: '🗺️' },
  { id: 'concept-diagram', name: 'Concept Diagram', icon: '💡' },
  { id: 'detail', name: 'Detail Drawing', icon: '🔍' },
]

export type Background = 'white' | 'paper' | 'sky' | 'dark' | 'transparent'

export interface StylePreset {
  id: string
  name: string
  desc: string
  adjustments: Partial<Adjustments>
  line: Partial<LineSettings>
  background: Background
  /** Optional hatch id drawn as a ground band across the bottom (sections/elevations). */
  groundHatch?: string
  /** Subtle paper grain overlay (hand-drawn feel). */
  paperGrain?: boolean
  /** Soft drop shadow band on the ground plane (elevations). */
  shadow?: boolean
}

const base = (): Adjustments => ({ brightness: 0, contrast: 0, tone: 0, invert: false })

export const STYLE_PRESETS: Record<string, StylePreset[]> = {
  'floor-plan': [
    {
      id: 'mono-minimal', name: 'Monochrome Minimal', desc: 'Black walls, white fill, no colour',
      adjustments: { contrast: 35 }, line: { threshold: 130, weight: 0, wall: 1, annotation: 0.8, dimension: 0.6, color: '#111111' }, background: 'white',
    },
    {
      id: 'graphic-zones', name: 'Graphic Color Zones', desc: 'Black walls, soft colour-filled rooms',
      adjustments: { contrast: 30 }, line: { threshold: 135, weight: 1, wall: 1.1, annotation: 0.8, dimension: 0.55, color: '#0F0F0F' }, background: 'white',
    },
    {
      id: 'pastel-soft', name: 'Pastel Soft', desc: 'Muted pastel fills, thin walls',
      adjustments: { contrast: 15, brightness: 8 }, line: { threshold: 120, weight: 0, wall: 0.8, annotation: 0.6, dimension: 0.45, color: '#3A3A3A' }, background: 'paper',
    },
    {
      id: 'bold-graphic', name: 'Bold Graphic', desc: 'Thick walls, strong fills, high contrast',
      adjustments: { contrast: 55 }, line: { threshold: 150, weight: 2, wall: 1.4, annotation: 0.9, dimension: 0.5, color: '#000000' }, background: 'white',
    },
    {
      id: 'hand-drawn', name: 'Hand Drawn', desc: 'Sketch-like feel with paper texture',
      adjustments: { contrast: 20, tone: 12 }, line: { threshold: 135, weight: 1, wall: 1, annotation: 0.85, dimension: 0.7, color: '#2B2A26' }, background: 'paper', paperGrain: true,
    },
  ],
  section: [
    {
      id: 'white-cut', name: 'White Cut', desc: 'Cut elements light, context darker',
      adjustments: { contrast: 25 }, line: { threshold: 135, weight: 1, wall: 1.2, annotation: 0.7, dimension: 0.5, color: '#111111' }, background: 'white',
    },
    {
      id: 'material-realistic', name: 'Material Realistic', desc: 'Different fill per material',
      adjustments: { contrast: 22 }, line: { threshold: 135, weight: 1, wall: 1.1, annotation: 0.8, dimension: 0.55, color: '#1A1A1A' }, background: 'white', groundHatch: 'earth',
    },
    {
      id: 'graphic-bold', name: 'Graphic Bold', desc: 'Strong black cut, sky gradient, ground hatch',
      adjustments: { contrast: 50 }, line: { threshold: 150, weight: 2, wall: 1.5, annotation: 0.9, dimension: 0.5, color: '#000000' }, background: 'sky', groundHatch: 'earth',
    },
    {
      id: 'minimal-line', name: 'Minimal Line', desc: 'Clean lines only, no fills',
      adjustments: { contrast: 30 }, line: { threshold: 125, weight: 0, wall: 0.9, annotation: 0.7, dimension: 0.55, color: '#222222' }, background: 'white',
    },
  ],
  elevation: [
    {
      id: 'shadow-render', name: 'Shadow Render', desc: 'Gradient shadow on ground plane',
      adjustments: { contrast: 28 }, line: { threshold: 135, weight: 1, wall: 1.1, annotation: 0.8, dimension: 0.55, color: '#141414' }, background: 'sky', shadow: true,
    },
    {
      id: 'flat-graphic', name: 'Flat Graphic', desc: 'Clean lines, flat colour fills',
      adjustments: { contrast: 35 }, line: { threshold: 140, weight: 1, wall: 1.1, annotation: 0.8, dimension: 0.5, color: '#0F0F0F' }, background: 'white',
    },
    {
      id: 'contextual', name: 'Contextual', desc: 'Faded context, highlighted main building',
      adjustments: { contrast: 18, brightness: 10 }, line: { threshold: 130, weight: 1, wall: 1, annotation: 0.7, dimension: 0.5, color: '#2A2A2A' }, background: 'paper', shadow: true,
    },
  ],
  'site-plan': [
    {
      id: 'urban-diagram', name: 'Urban Diagram', desc: 'Roads grey, buildings dark, green & water',
      adjustments: { contrast: 30 }, line: { threshold: 140, weight: 1, wall: 1.2, annotation: 0.8, dimension: 0.5, color: '#101010' }, background: 'white',
    },
    {
      id: 'analysis-overlay', name: 'Analysis Overlay', desc: 'Neutral base with coloured analysis zones',
      adjustments: { contrast: 12, brightness: 12 }, line: { threshold: 125, weight: 0, wall: 0.8, annotation: 0.6, dimension: 0.45, color: '#3A3A3A' }, background: 'paper',
    },
    {
      id: 'minimal-black', name: 'Minimal Black', desc: 'Everything in black and white',
      adjustments: { contrast: 45 }, line: { threshold: 145, weight: 1, wall: 1.1, annotation: 0.8, dimension: 0.6, color: '#000000' }, background: 'white',
    },
  ],
  'concept-diagram': [
    {
      id: 'clean-graphic', name: 'Clean Graphic', desc: 'Crisp lines, white base',
      adjustments: { contrast: 30 }, line: { threshold: 140, weight: 1, wall: 1, annotation: 0.8, dimension: 0.6, color: '#111111' }, background: 'white',
    },
    {
      id: 'sketch', name: 'Sketch', desc: 'Loose, paper texture',
      adjustments: { contrast: 18, tone: 10 }, line: { threshold: 135, weight: 1, wall: 1, annotation: 0.85, dimension: 0.7, color: '#2B2A26' }, background: 'paper', paperGrain: true,
    },
    {
      id: 'dark-mode', name: 'Dark Mode', desc: 'Inverted — light lines on dark',
      adjustments: { contrast: 30, invert: true }, line: { threshold: 150, weight: 1, wall: 1, annotation: 0.8, dimension: 0.6, color: '#F2F2F2' }, background: 'dark',
    },
  ],
  detail: [
    {
      id: 'technical', name: 'Technical', desc: 'High contrast, crisp linework',
      adjustments: { contrast: 40 }, line: { threshold: 145, weight: 1, wall: 1.1, annotation: 0.85, dimension: 0.6, color: '#000000' }, background: 'white',
    },
    {
      id: 'material-detail', name: 'Material Detail', desc: 'Ready for material hatches',
      adjustments: { contrast: 28 }, line: { threshold: 138, weight: 1, wall: 1.1, annotation: 0.8, dimension: 0.55, color: '#141414' }, background: 'white',
    },
  ],
}

export const DEFAULT_ADJUSTMENTS = base
