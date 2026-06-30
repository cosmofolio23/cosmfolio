'use client'

import { useState, useEffect } from 'react'

export interface StylePack {
  id: string
  name: string
  description: string
  is_preset?: boolean
  is_custom?: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  typography: {
    heading_font: string
    body_font: string
    heading_size: number
    body_size: number
    heading_weight: number
    body_weight: number
    line_height: number
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
}

interface Props {
  selectedPackId?: string
  onSelect: (pack: StylePack) => void
  onGenerateClick?: () => void
  showCustomPacks?: boolean
  portfolioId?: string
}

const PRESET_PACKS: StylePack[] = [
  {
    id: 'preset-minimal-white',
    name: 'Minimal White',
    description: 'Clean, minimal design with white background',
    is_preset: true,
    colors: { primary: '#000000', secondary: '#666666', accent: '#0066cc', background: '#ffffff', text: '#333333' },
    typography: { heading_font: 'sans-serif', body_font: 'sans-serif', heading_size: 36, body_size: 16, heading_weight: 700, body_weight: 400, line_height: 1.6 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  },
  {
    id: 'preset-dark-studio',
    name: 'Dark Studio',
    description: 'Dark professional theme for architecture',
    is_preset: true,
    colors: { primary: '#ffffff', secondary: '#cccccc', accent: '#ff6b35', background: '#1a1a1a', text: '#f0f0f0' },
    typography: { heading_font: 'serif', body_font: 'sans-serif', heading_size: 40, body_size: 16, heading_weight: 700, body_weight: 400, line_height: 1.5 },
    spacing: { xs: 6, sm: 12, md: 20, lg: 30, xl: 40 },
  },
  {
    id: 'preset-scandinavian',
    name: 'Scandinavian',
    description: 'Light, airy Scandinavian design',
    is_preset: true,
    colors: { primary: '#264653', secondary: '#2a9d8f', accent: '#e9c46a', background: '#f4f1de', text: '#333333' },
    typography: { heading_font: 'sans-serif', body_font: 'sans-serif', heading_size: 32, body_size: 16, heading_weight: 600, body_weight: 400, line_height: 1.7 },
    spacing: { xs: 5, sm: 10, md: 18, lg: 28, xl: 36 },
  },
  {
    id: 'preset-corporate',
    name: 'Corporate',
    description: 'Professional corporate design',
    is_preset: true,
    colors: { primary: '#003366', secondary: '#0055aa', accent: '#ff6633', background: '#ffffff', text: '#333333' },
    typography: { heading_font: 'serif', body_font: 'sans-serif', heading_size: 38, body_size: 15, heading_weight: 700, body_weight: 400, line_height: 1.6 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  },
  {
    id: 'preset-arch-journal',
    name: 'Architectural Journal',
    description: 'Magazine-like aesthetic',
    is_preset: true,
    colors: { primary: '#2c2c2c', secondary: '#8b7355', accent: '#d4a574', background: '#f9f7f4', text: '#2c2c2c' },
    typography: { heading_font: 'serif', body_font: 'sans-serif', heading_size: 44, body_size: 14, heading_weight: 700, body_weight: 400, line_height: 1.8 },
    spacing: { xs: 6, sm: 12, md: 20, lg: 32, xl: 48 },
  },
  {
    id: 'preset-competition',
    name: 'Competition Board',
    description: 'Bold, high-contrast graphic design',
    is_preset: true,
    colors: { primary: '#000000', secondary: '#ff0000', accent: '#ffff00', background: '#ffffff', text: '#000000' },
    typography: { heading_font: 'sans-serif', body_font: 'sans-serif', heading_size: 52, body_size: 12, heading_weight: 900, body_weight: 700, line_height: 1.4 },
    spacing: { xs: 8, sm: 16, md: 24, lg: 40, xl: 56 },
  },
  {
    id: 'preset-parametric',
    name: 'Parametric',
    description: 'Geometric, tech-forward minimal',
    is_preset: true,
    colors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#00d4ff', background: '#f0f4ff', text: '#0f3460' },
    typography: { heading_font: 'sans-serif', body_font: 'sans-serif', heading_size: 40, body_size: 14, heading_weight: 600, body_weight: 400, line_height: 1.5 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 28, xl: 40 },
  },
  {
    id: 'preset-luxury',
    name: 'Luxury Editorial',
    description: 'High-end serif with warm neutrals',
    is_preset: true,
    colors: { primary: '#5a4a42', secondary: '#c9ada7', accent: '#d4a574', background: '#fefaf0', text: '#5a4a42' },
    typography: { heading_font: 'serif', body_font: 'serif', heading_size: 48, body_size: 16, heading_weight: 400, body_weight: 300, line_height: 1.9 },
    spacing: { xs: 8, sm: 16, md: 24, lg: 40, xl: 56 },
  },
  {
    id: 'preset-future-tech',
    name: 'Future Tech',
    description: 'Neon accents with modern sans-serif',
    is_preset: true,
    colors: { primary: '#0a0e27', secondary: '#1a1f3a', accent: '#00ff88', background: '#ffffff', text: '#0a0e27' },
    typography: { heading_font: 'sans-serif', body_font: 'sans-serif', heading_size: 42, body_size: 14, heading_weight: 700, body_weight: 400, line_height: 1.6 },
    spacing: { xs: 5, sm: 10, md: 18, lg: 30, xl: 44 },
  },
  {
    id: 'preset-monochrome',
    name: 'Monochrome',
    description: 'Black, white, and grayscale',
    is_preset: true,
    colors: { primary: '#000000', secondary: '#666666', accent: '#333333', background: '#ffffff', text: '#1a1a1a' },
    typography: { heading_font: 'sans-serif', body_font: 'sans-serif', heading_size: 36, body_size: 15, heading_weight: 700, body_weight: 400, line_height: 1.7 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  },
]

export function StylePackGallery({ selectedPackId, onSelect, onGenerateClick, showCustomPacks, portfolioId }: Props) {
  const [customPacks, setCustomPacks] = useState<StylePack[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (showCustomPacks && portfolioId) {
      loadCustomPacks()
    }
  }, [portfolioId, showCustomPacks])

  const loadCustomPacks = async () => {
    if (!portfolioId) return
    try {
      setLoading(true)
      const API_URL = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? '/backend-proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app'))
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${portfolioId}/style-packs?include_defaults=false`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCustomPacks(data.packs || [])
      }
    } catch (e) {
      console.error('Load custom packs error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate New Button */}
      {onGenerateClick && (
        <button
          onClick={onGenerateClick}
          className="w-full p-4 rounded-xl border-2 border-dashed border-primary bg-blue-50 hover:bg-blue-100 transition flex items-center justify-center gap-2 font-semibold text-primary"
        >
          <span className="text-xl">✨</span>
          Generate Custom Pack with AI
        </button>
      )}

      {/* Preset Packs */}
      <div>
        <h3 className="text-sm font-bold text-stone uppercase tracking-wider mb-3">
          Design Packs ({PRESET_PACKS.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_PACKS.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              selected={selectedPackId === pack.id}
              onClick={() => onSelect(pack)}
            />
          ))}
        </div>
      </div>

      {/* Custom Packs */}
      {showCustomPacks && customPacks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-stone uppercase tracking-wider mb-3">
            Your Custom Packs ({customPacks.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {customPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                selected={selectedPackId === pack.id}
                onClick={() => onSelect(pack)}
              />
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-sm text-stone-light">Loading custom packs...</div>
      )}
    </div>
  )
}

function PackCard({ pack, selected, onClick }: { pack: StylePack; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border-2 overflow-hidden transition ${
        selected ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-border-light hover:border-stone-light'
      }`}
      style={{ background: pack.colors.background }}
    >
      {/* Color swatch preview */}
      <div className="flex h-16">
        <div style={{ background: pack.colors.primary, width: '30%' }} />
        <div style={{ background: pack.colors.secondary, width: '20%' }} />
        <div style={{ background: pack.colors.accent, width: '15%' }} />
        <div style={{ background: pack.colors.background, width: '35%', borderLeft: `1px solid ${pack.colors.text}33` }} />
      </div>
      {/* Pack info */}
      <div className="p-3" style={{ color: pack.colors.text, background: pack.colors.background }}>
        <div
          className="font-bold text-sm truncate"
          style={{ fontFamily: pack.typography.heading_font, fontWeight: pack.typography.heading_weight }}
        >
          {pack.name}
        </div>
        <div
          className="text-xs opacity-70 truncate mt-1"
          style={{ fontFamily: pack.typography.body_font }}
        >
          {pack.description}
        </div>
      </div>
    </button>
  )
}

export { PRESET_PACKS }
