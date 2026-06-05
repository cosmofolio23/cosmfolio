'use client'

/**
 * TemplateMockup - Renders a realistic visual preview of a template
 * using its actual colors and fonts, instead of showing raw text.
 */

interface TemplateMockupProps {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
    muted?: string
  }
  fonts?: {
    heading?: string
    body?: string
  }
  name: string
  variant?: 'portfolio' | 'sheet'
}

export default function TemplateMockup({ colors, fonts, name, variant = 'portfolio' }: TemplateMockupProps) {
  const bg = colors?.background || '#FFFFFF'
  const text = colors?.text || '#1a1a1a'
  const primary = colors?.primary || colors?.text || '#1a1a1a'
  const accent = colors?.accent || '#888888'
  const muted = colors?.muted || '#E5E5E5'
  const headingFont = fonts?.heading || 'Georgia, serif'

  // Detect if background is dark to adjust placeholder contrast
  const isDark = isColorDark(bg)
  const placeholderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'
  const placeholderColor2 = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.10)'

  if (variant === 'sheet') {
    // Sheet mockup: landscape presentation board layout
    return (
      <div
        className="w-full h-full overflow-hidden relative"
        style={{ background: bg, fontFamily: headingFont }}
      >
        <div className="absolute inset-0 p-3 flex flex-col">
          {/* Title bar */}
          <div className="flex items-center justify-between mb-2">
            <div
              className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[70%]"
              style={{ color: primary }}
            >
              {name.slice(0, 22)}
            </div>
            <div className="h-2 w-8 rounded-sm" style={{ background: accent }} />
          </div>
          {/* Large hero image area */}
          <div className="flex-1 rounded-sm mb-2" style={{ background: placeholderColor2 }} />
          {/* Bottom row: 3 panels */}
          <div className="flex gap-1.5 h-[35%]">
            <div className="flex-1 rounded-sm" style={{ background: placeholderColor }} />
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-1.5 rounded-full" style={{ background: accent, width: '80%' }} />
              <div className="h-1 rounded-full" style={{ background: placeholderColor2, width: '100%' }} />
              <div className="h-1 rounded-full" style={{ background: placeholderColor2, width: '90%' }} />
              <div className="h-1 rounded-full" style={{ background: placeholderColor2, width: '95%' }} />
              <div className="h-1 rounded-full" style={{ background: placeholderColor2, width: '60%' }} />
            </div>
            <div className="flex-1 rounded-sm" style={{ background: placeholderColor }} />
          </div>
        </div>
      </div>
    )
  }

  // Portfolio mockup: portrait magazine spread
  return (
    <div
      className="w-full h-full overflow-hidden relative flex"
      style={{ background: bg, fontFamily: headingFont }}
    >
      {/* Left page */}
      <div className="w-1/2 h-full p-3 flex flex-col border-r" style={{ borderColor: placeholderColor }}>
        {/* Big heading */}
        <div
          className="text-[11px] font-bold leading-tight mb-2"
          style={{ color: primary }}
        >
          {name.split(' ').slice(0, 2).join(' ')}
        </div>
        <div className="h-0.5 w-6 mb-2" style={{ background: accent }} />
        {/* Text lines */}
        <div className="space-y-1 mb-2">
          <div className="h-1 rounded-full" style={{ background: placeholderColor2, width: '100%' }} />
          <div className="h-1 rounded-full" style={{ background: placeholderColor2, width: '85%' }} />
          <div className="h-1 rounded-full" style={{ background: placeholderColor2, width: '92%' }} />
        </div>
        {/* Image block */}
        <div className="flex-1 rounded-sm" style={{ background: placeholderColor2 }} />
      </div>

      {/* Right page */}
      <div className="w-1/2 h-full p-3 flex flex-col">
        {/* Top image */}
        <div className="h-[45%] rounded-sm mb-2" style={{ background: placeholderColor2 }} />
        {/* Caption */}
        <div className="h-1 rounded-full mb-2" style={{ background: accent, width: '50%' }} />
        {/* Two small images */}
        <div className="flex gap-1.5 flex-1">
          <div className="flex-1 rounded-sm" style={{ background: placeholderColor }} />
          <div className="flex-1 rounded-sm" style={{ background: placeholderColor }} />
        </div>
      </div>

      {/* Accent corner tag */}
      <div
        className="absolute top-0 right-0 w-0 h-0"
        style={{
          borderTop: `16px solid ${accent}`,
          borderLeft: '16px solid transparent'
        }}
      />
    </div>
  )
}

// Helper: determine if a hex color is dark
function isColorDark(hex: string): boolean {
  try {
    const c = hex.replace('#', '')
    const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    // Perceived luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
  } catch {
    return false
  }
}
