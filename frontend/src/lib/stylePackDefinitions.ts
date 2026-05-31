import { StylePackTokens } from '@/types/portfolio'

// ==================== 7 COMPLETE STYLE PACKS ====================
// Each pack defines: fonts, colors, spacing, grid, borders, page numbering, effects
// 7 styles x 50 layouts = 350 unique portfolio variants

export const STYLE_PACKS: StylePackTokens[] = [
  // ==================== 1. MINIMAL WHITE ====================
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Clean, elegant, timeless. Maximum whitespace, refined typography.',
    fonts: {
      heading: { family: 'Inter', weight: 300, size: '42px', letterSpacing: '-0.02em', lineHeight: '1.1', textTransform: 'none' },
      subheading: { family: 'Inter', weight: 400, size: '18px', letterSpacing: '0.05em', lineHeight: '1.4', textTransform: 'uppercase' },
      body: { family: 'Inter', weight: 400, size: '14px', letterSpacing: '0', lineHeight: '1.7' },
      caption: { family: 'Inter', weight: 300, size: '11px', letterSpacing: '0.03em', lineHeight: '1.5', textTransform: 'uppercase' },
      pageNumber: { family: 'Inter', weight: 300, size: '10px', letterSpacing: '0.1em', lineHeight: '1' },
    },
    colors: {
      background: '#FFFFFF',
      surface: '#FAFAFA',
      text: { primary: '#1A1A1A', secondary: '#666666', tertiary: '#999999' },
      accent: { primary: '#000000', secondary: '#E5E5E5' },
      border: '#E8E8E8',
      overlay: 'rgba(255,255,255,0.9)',
    },
    spacing: { pageMargin: '48px', sectionGap: '40px', itemGap: '24px', innerPadding: '32px', headerHeight: '80px' },
    grid: { columns: 12, gutter: '24px', maxWidth: '1200px' },
    borders: { width: '1px', style: 'solid', color: '#E8E8E8', radius: '0px' },
    pageNumber: { position: 'bottom-center', format: 'numeric' },
    effects: { imageBorderRadius: '0px', cardShadow: 'none', hoverScale: 1.02, overlayOpacity: 0.05 },
  },
]

export const getStylePack = (id: string): StylePackTokens => {
  return STYLE_PACKS.find(sp => sp.id === id) || STYLE_PACKS[0]
}

export const getStylePackCSS = (tokens: StylePackTokens): Record<string, string> => ({
  '--bg': tokens.colors.background,
  '--surface': tokens.colors.surface,
  '--text-primary': tokens.colors.text.primary,
  '--text-secondary': tokens.colors.text.secondary,
  '--text-tertiary': tokens.colors.text.tertiary,
  '--accent': tokens.colors.accent.primary,
  '--accent-secondary': tokens.colors.accent.secondary,
  '--border': tokens.colors.border,
  '--overlay': tokens.colors.overlay,
  '--page-margin': tokens.spacing.pageMargin,
  '--section-gap': tokens.spacing.sectionGap,
  '--item-gap': tokens.spacing.itemGap,
  '--inner-padding': tokens.spacing.innerPadding,
  '--heading-font': tokens.fonts.heading.family,
  '--body-font': tokens.fonts.body.family,
  '--border-radius': tokens.borders.radius,
  '--card-shadow': tokens.effects.cardShadow,
  '--image-radius': tokens.effects.imageBorderRadius,
})
