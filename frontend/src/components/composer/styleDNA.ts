/**
 * Style DNA — named portfolio style presets.
 *
 * Each style maps to composer DesignTokens (colors + fonts). Applying a style
 * recolors/retypesets the whole portfolio in one click, the "Style DNA" layer
 * of the spec. Layout stays parametric; style is orthogonal.
 */

import type { DesignTokens } from './types'

export interface StyleDNA {
  id: string
  name: string
  description: string
  tokens: DesignTokens
}

export const STYLE_DNA: StyleDNA[] = [
  {
    id: 'minimal-white', name: 'Minimal White', description: 'Clean, generous white space',
    tokens: { background: '#FFFFFF', text: '#1A1A1A', primary: '#1A1A1A', accent: '#9CA3AF', muted: '#E5E7EB', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'dark-studio', name: 'Dark Studio', description: 'Moody dark with gold accents',
    tokens: { background: '#0E0E10', text: '#EDEDED', primary: '#FFFFFF', accent: '#D4AF37', muted: '#2A2A2E', headingFont: 'Oswald, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'competition', name: 'Competition Board', description: 'Bold, high-contrast graphic',
    tokens: { background: '#FFFFFF', text: '#111111', primary: '#E11D48', accent: '#111111', muted: '#F3F4F6', headingFont: 'Oswald, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'journal', name: 'Architectural Journal', description: 'Editorial serif + sans mix',
    tokens: { background: '#FAF8F3', text: '#2B2B2B', primary: '#1F2937', accent: '#A16207', muted: '#E7E1D5', headingFont: 'Playfair Display, serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'parametric', name: 'Parametric', description: 'Geometric, tech-forward',
    tokens: { background: '#0B1020', text: '#D6E0FF', primary: '#7DD3FC', accent: '#38BDF8', muted: '#1E293B', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'corporate', name: 'Corporate', description: 'Professional blues, restrained',
    tokens: { background: '#FFFFFF', text: '#1F2937', primary: '#1E3A8A', accent: '#2563EB', muted: '#E5E7EB', headingFont: 'Montserrat, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'thesis', name: 'Thesis', description: 'Academic, sequential, serif',
    tokens: { background: '#FCFCFA', text: '#1B1B1B', primary: '#3F3F46', accent: '#7C2D12', muted: '#E4E4E7', headingFont: 'Cormorant Garamond, serif', bodyFont: 'Georgia, serif' },
  },
  {
    id: 'experimental', name: 'Experimental', description: 'Warm, expressive, unexpected',
    tokens: { background: '#1A0B2E', text: '#F5E6FF', primary: '#F0ABFC', accent: '#C026D3', muted: '#3B1F5C', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
]
