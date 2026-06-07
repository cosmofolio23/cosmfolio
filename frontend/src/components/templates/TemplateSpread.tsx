'use client'

/**
 * TemplateSpread - Layout-driven template preview.
 *
 * Unlike TemplateMockup (which only showed a generic color swatch spread),
 * this renders the template's ACTUAL layouts: its real cover layout plus two
 * inner pages, using the template's real colors + fonts. Users can therefore
 * pick a template by LAYOUT, not just palette.
 *
 * Reuses the parametric engine: pickCoverSpec / pickProjectSpecForTemplate +
 * the LayoutThumb renderer (both already power the editor's layout picker).
 */

import { LayoutThumb } from '@/components/composer/PageComposer'
import { getSpec, pickCoverSpec, pickProjectSpecForTemplate } from '@/components/composer/layoutSpecs'
import type { DesignTokens } from '@/components/composer/types'

interface SpreadTemplate {
  name: string
  colors?: Record<string, string>
  fonts?: Record<string, string>
  layouts?: any
  placeholders?: any
}

export default function TemplateSpread({ template }: { template: SpreadTemplate }) {
  const colors = template.colors || {}
  const fonts = template.fonts || {}

  const tokens: DesignTokens = {
    background: colors.background || '#FFFFFF',
    text: colors.text || '#1a1a1a',
    primary: colors.primary || colors.text || '#1a1a1a',
    accent: colors.accent || '#888888',
    muted: colors.muted || '#E5E5E5',
    headingFont: fonts.heading || 'Georgia, serif',
    bodyFont: fonts.body || 'Inter, sans-serif',
  }

  // Derive the three real specs this template would generate.
  const coverSpec = getSpec(pickCoverSpec(template))
  const aboutSpec = getSpec('text.statement')
  const projectSpec = getSpec(pickProjectSpecForTemplate(template))

  // Each wrapper fixes HEIGHT and lets aspect-ratio derive width, so the
  // portrait LayoutThumbs always fit the card area without overflowing.
  const PAGE_AR = '210 / 297'

  return (
    <div
      className="w-full h-full flex items-center justify-center gap-2 p-3"
      style={{ background: tokens.background }}
    >
      {/* Prominent cover */}
      <div style={{ height: '100%', aspectRatio: PAGE_AR }} className="shadow-sm">
        <LayoutThumb spec={coverSpec} tokens={tokens} />
      </div>

      {/* Two inner pages, stacked */}
      <div className="flex flex-col gap-2" style={{ height: '100%' }}>
        <div style={{ height: 'calc(50% - 4px)', aspectRatio: PAGE_AR }} className="opacity-90">
          <LayoutThumb spec={aboutSpec} tokens={tokens} />
        </div>
        <div style={{ height: 'calc(50% - 4px)', aspectRatio: PAGE_AR }} className="opacity-90">
          <LayoutThumb spec={projectSpec} tokens={tokens} />
        </div>
      </div>
    </div>
  )
}
