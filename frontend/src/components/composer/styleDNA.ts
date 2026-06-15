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
  // ==================== MINIMALIST & SWISS GRID ====================
  {
    id: 'minimal-white',
    name: 'Minimal White',
    description: 'Timeless, generous white space with elegant dark grey typography.',
    tokens: { background: '#FFFFFF', text: '#1A1A1A', primary: '#1A1A1A', accent: '#7F7F7F', muted: '#F3F4F6', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'swiss-grid',
    name: 'Swiss Grid',
    description: 'Clean typography, strict alignments, and vibrant red accent lines.',
    tokens: { background: '#F8F9FA', text: '#111111', primary: '#E63946', accent: '#2B2D42', muted: '#EDF2F4', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    description: 'Soft warm neutrals, forest accents, and friendly typography.',
    tokens: { background: '#F4F1EA', text: '#333333', primary: '#4A524A', accent: '#7A827A', muted: '#E5E0D8', headingFont: 'Montserrat, sans-serif', bodyFont: 'Open Sans, sans-serif' },
  },
  {
    id: 'japanese-minimal',
    name: 'Japanese Minimal',
    description: 'Paper texture tones, delicate margins, and serene black ink lines.',
    tokens: { background: '#FCF9F2', text: '#2A2A2A', primary: '#1B1B1B', accent: '#D2C4B1', muted: '#F2EDE4', headingFont: 'Playfair Display, serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'cyber-minimal',
    name: 'Cyber Minimal',
    description: 'Pure black screen with luminous cyan accents.',
    tokens: { background: '#000000', text: '#00FFCC', primary: '#00FFCC', accent: '#008877', muted: '#111111', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },

  // ==================== DARK STUDIO & LUXURY ====================
  {
    id: 'dark-studio',
    name: 'Dark Studio',
    description: 'Moody dark background with vibrant amber and gold accents.',
    tokens: { background: '#0E0E10', text: '#EDEDED', primary: '#FFFFFF', accent: '#D4AF37', muted: '#2A2A2E', headingFont: 'Oswald, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'black-luxury',
    name: 'Black Luxury',
    description: 'Deep black background with warm gold headings and dark charcoal margins.',
    tokens: { background: '#050505', text: '#FFFFFF', primary: '#E5A93C', accent: '#333333', muted: '#1A1A1A', headingFont: 'Georgia, serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'monochrome-noir',
    name: 'Monochrome Noir',
    description: 'High contrast grayscale palette for shadow and form study.',
    tokens: { background: '#111111', text: '#FFFFFF', primary: '#FFFFFF', accent: '#888888', muted: '#222222', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'dark-mode-luxury',
    name: 'Dark Mode Luxury',
    description: 'Jet black background with charcoal text and bronze accents.',
    tokens: { background: '#0A0A0C', text: '#A0A0A5', primary: '#E2E2E5', accent: '#B38F4D', muted: '#1C1C22', headingFont: 'Georgia, serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'gold-charcoal',
    name: 'Gold & Charcoal',
    description: 'Slate charcoal background with luminous gold highlights.',
    tokens: { background: '#242426', text: '#EAEAEA', primary: '#E6C687', accent: '#E6C687', muted: '#38383B', headingFont: 'Oswald, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'steel-glass',
    name: 'Steel & Glass',
    description: 'Cool blue steel tones, reflecting transparency and structures.',
    tokens: { background: '#F2F6FA', text: '#2C3E50', primary: '#2980B9', accent: '#34495E', muted: '#E2ECF5', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },

  // ==================== EDITORIAL & JOURNAL ====================
  {
    id: 'editorial-magazine',
    name: 'Editorial Magazine',
    description: 'Warm cream, bold serif headers, and high-quality article typography.',
    tokens: { background: '#FDFBF7', text: '#1E2937', primary: '#111827', accent: '#B45309', muted: '#F3EFE7', headingFont: 'Playfair Display, serif', bodyFont: 'Lora, serif' },
  },
  {
    id: 'journal',
    name: 'Architectural Journal',
    description: 'Warm paper background with structured serif body and slate blue headings.',
    tokens: { background: '#FAF8F3', text: '#2B2B2B', primary: '#1F2937', accent: '#A16207', muted: '#E7E1D5', headingFont: 'Playfair Display, serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'interior-editorial',
    name: 'Interior Editorial',
    description: 'Soft beige tones with delicate layout margins and luxury serif text.',
    tokens: { background: '#F7F4EF', text: '#3E3B37', primary: '#B2A595', accent: '#8F8273', muted: '#EAE5DC', headingFont: 'Georgia, serif', bodyFont: 'Raleway, sans-serif' },
  },
  {
    id: 'typographic-bold',
    name: 'Typographic Bold',
    description: 'Massive, heavy headings that define the page architecture.',
    tokens: { background: '#FFFFFF', text: '#000000', primary: '#000000', accent: '#000000', muted: '#EAEAEA', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'conceptual-collage',
    name: 'Conceptual Collage',
    description: 'Warm sand backdrop with craft green and charcoal tones.',
    tokens: { background: '#F5ECE1', text: '#3D3D3D', primary: '#A57C5A', accent: '#4E5A4E', muted: '#E8DCD1', headingFont: 'Playfair Display, serif', bodyFont: 'Raleway, sans-serif' },
  },

  // ==================== BRUTALIST & INDUSTRIAL ====================
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Raw gray concrete styling with high-contrast magenta lines.',
    tokens: { background: '#E0E0E0', text: '#050505', primary: '#000000', accent: '#FF0055', muted: '#C8C8C8', headingFont: 'Oswald, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'brutalist-grid',
    name: 'Brutalist Grid',
    description: 'Raw concrete colors paired with heavy black headers and caution red.',
    tokens: { background: '#DCDCDC', text: '#101010', primary: '#FF3333', accent: '#000000', muted: '#B0B0B0', headingFont: 'Oswald, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'neo-brutalist',
    name: 'Neo-Brutalist',
    description: 'Vibrant, high-saturation yellow background with thick black shapes.',
    tokens: { background: '#FFDE43', text: '#000000', primary: '#000000', accent: '#FF0055', muted: '#FFF099', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'concrete-brutalism',
    name: 'Concrete Brutalism',
    description: 'Industrial cement shades and structured technical layouts.',
    tokens: { background: '#E2E2E2', text: '#2B2B2B', primary: '#1B1B1B', accent: '#6B6B6B', muted: '#CFCFCF', headingFont: 'Oswald, sans-serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'metallic-industrial',
    name: 'Metallic Industrial',
    description: 'Cool steel gray background with high-contrast iron-colored borders.',
    tokens: { background: '#E2E8F0', text: '#1E293B', primary: '#475569', accent: '#0F172A', muted: '#CBD5E1', headingFont: 'Montserrat, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },

  // ==================== PORTFOLIO CORE PRESETS ====================
  {
    id: 'competition',
    name: 'Competition Board',
    description: 'Vibrant crimson details, optimized for maximum visual impact.',
    tokens: { background: '#FFFFFF', text: '#111111', primary: '#E11D48', accent: '#111111', muted: '#F3F4F6', headingFont: 'Oswald, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'award-submission',
    name: 'Award Submission',
    description: 'Sleek white background with premium gold and corporate navy.',
    tokens: { background: '#FFFFFF', text: '#2D3748', primary: '#D4AF37', accent: '#1A202C', muted: '#EDF2F7', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'thesis',
    name: 'Thesis Academic',
    description: 'Traditional editorial serif layout suitable for high-density reading.',
    tokens: { background: '#FCFCFA', text: '#1B1B1B', primary: '#3F3F46', accent: '#7C2D12', muted: '#E4E4E7', headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif' },
  },
  {
    id: 'research-style',
    name: 'Research Style',
    description: 'Cool gray tones and sans-serif fonts optimized for reports.',
    tokens: { background: '#F8FAFC', text: '#0F172A', primary: '#334155', accent: '#475569', muted: '#F1F5F9', headingFont: 'Montserrat, sans-serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'university-app',
    name: 'University Application',
    description: 'Highly readable blue-accented styling to impress admission panels.',
    tokens: { background: '#FFFFFF', text: '#1E2937', primary: '#4F46E5', accent: '#312E81', muted: '#EEF2F6', headingFont: 'Poppins, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional navy tones with robust and restrained structures.',
    tokens: { background: '#FFFFFF', text: '#1F2937', primary: '#1E3A8A', accent: '#2563EB', muted: '#E5E7EB', headingFont: 'Montserrat, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },

  // ==================== PARAMETRIC & TECH ====================
  {
    id: 'parametric',
    name: 'Parametric',
    description: 'Sleek deep navy with bright neon blue and cyan accents.',
    tokens: { background: '#0B1020', text: '#D6E0FF', primary: '#7DD3FC', accent: '#38BDF8', muted: '#1E293B', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'computational',
    name: 'Computational Design',
    description: 'Matrix-inspired theme for algorithmically generated projects.',
    tokens: { background: '#080E1A', text: '#A7F3D0', primary: '#10B981', accent: '#065F46', muted: '#111827', headingFont: 'Oswald, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'futuristic-ai',
    name: 'Futuristic AI',
    description: 'Dark mode layout with neon lavender and bright violet details.',
    tokens: { background: '#0A051D', text: '#F3E8FF', primary: '#D8B4FE', accent: '#A855F7', muted: '#1E1548', headingFont: 'Poppins, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'tech-blueprint',
    name: 'Tech Blueprint',
    description: 'Luminous technical cyan over blueprint blue.',
    tokens: { background: '#0F2C59', text: '#E0F2FE', primary: '#38BDF8', accent: '#7DD3FC', muted: '#1E40AF', headingFont: 'Montserrat, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'neon-blueprint',
    name: 'Neon Blueprint',
    description: 'Electric green drafting lines over dark navy backdrop.',
    tokens: { background: '#051122', text: '#39FF14', primary: '#39FF14', accent: '#1F8F0A', muted: '#0F243A', headingFont: 'Oswald, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'monospaced-code',
    name: 'Monospaced Code',
    description: 'Minimal terminal developer style with cyan and mint highlights.',
    tokens: { background: '#0F172A', text: '#38BDF8', primary: '#34D399', accent: '#FB7185', muted: '#1E293B', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'parametric-cyber',
    name: 'Parametric Cyber',
    description: 'Cyberpunk network styles for complex digital geometry.',
    tokens: { background: '#0B0D19', text: '#818CF8', primary: '#F472B6', accent: '#4F46E5', muted: '#1E1B4B', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },

  // ==================== ENVIRONMENTAL & ECO ====================
  {
    id: 'landscape-eco',
    name: 'Landscape Eco',
    description: 'Forest green highlights combined with recycled leaf cream.',
    tokens: { background: '#FAFBF9', text: '#2E3A2F', primary: '#4E6E52', accent: '#2C3E30', muted: '#E4EAE4', headingFont: 'Poppins, sans-serif', bodyFont: 'Open Sans, sans-serif' },
  },
  {
    id: 'urban-manifesto',
    name: 'Urban Manifesto',
    description: 'Raw concrete theme with warning orange graphic lines.',
    tokens: { background: '#FFFFFF', text: '#1A1A1A', primary: '#FF5E00', accent: '#1A1A1A', muted: '#EAEAEA', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'historic-heritage',
    name: 'Historic Heritage',
    description: 'Classic sepia paper styling referencing historic archive files.',
    tokens: { background: '#F4EFE3', text: '#3E2F20', primary: '#5C4033', accent: '#8B5A2B', muted: '#E6DEC9', headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif' },
  },
  {
    id: 'vintage-blueprint',
    name: 'Vintage Blueprint',
    description: 'Faded retro cyan background with blueprint layout lines.',
    tokens: { background: '#1B4D8E', text: '#FFFFFF', primary: '#B3D4FF', accent: '#80B3FF', muted: '#103360', headingFont: 'Oswald, sans-serif', bodyFont: 'Arial, sans-serif' },
  },

  // ==================== CHROMATIC & NATURE ====================
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    description: 'Warm lavender styling with soft peach and pink accent colors.',
    tokens: { background: '#F5E6FF', text: '#3B1F5C', primary: '#F0ABFC', accent: '#C026D3', muted: '#EAD1FF', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta',
    description: 'Clay, ochre, and warm sand hues inspired by desert dwellings.',
    tokens: { background: '#F7EBE1', text: '#5D2E16', primary: '#C85C32', accent: '#7F3B1A', muted: '#E8D2C2', headingFont: 'Playfair Display, serif', bodyFont: 'Lato, sans-serif' },
  },
  {
    id: 'forest-pine',
    name: 'Forest Pine',
    description: 'Deep woodland green with organic moss accents.',
    tokens: { background: '#0F1E19', text: '#E2E8F0', primary: '#2D5A27', accent: '#81C784', muted: '#1A332B', headingFont: 'Montserrat, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Deep',
    description: 'Vast marine navy background with electric cyan details.',
    tokens: { background: '#081726', text: '#E0F2FE', primary: '#0EA5E9', accent: '#38BDF8', muted: '#122E4A', headingFont: 'Montserrat, sans-serif', bodyFont: 'Open Sans, sans-serif' },
  },
  {
    id: 'desert-sand',
    name: 'Desert Sand',
    description: 'Warm terracotta text on faded beige desert sand background.',
    tokens: { background: '#F2E8D5', text: '#4A3B32', primary: '#A64B2A', accent: '#7F3B1A', muted: '#E0D2BA', headingFont: 'Georgia, serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'watercolor-wash',
    name: 'Watercolor Wash',
    description: 'Light desaturated green washing over soft beige paper.',
    tokens: { background: '#F0F8F6', text: '#2C4A42', primary: '#5A8B7E', accent: '#8CBEB2', muted: '#DBEBE7', headingFont: 'Playfair Display, serif', bodyFont: 'Raleway, sans-serif' },
  },

  // ==================== ART & AVANT-GARDE ====================
  {
    id: 'pop-art',
    name: 'Pop Art',
    description: 'Vibrant poster yellow background with magenta and blue accents.',
    tokens: { background: '#FFF500', text: '#000000', primary: '#0000FF', accent: '#FF00FF', muted: '#FFFA80', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Arial, sans-serif' },
  },
  {
    id: 'high-tech',
    name: 'High-Tech Contrast',
    description: 'Pure white background with sharp neon green lines.',
    tokens: { background: '#FFFFFF', text: '#000000', primary: '#00FF00', accent: '#000000', muted: '#E0E0E0', headingFont: 'Montserrat, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    description: 'Primary blue and pink accents over off-white textures.',
    tokens: { background: '#FAF9F6', text: '#111111', primary: '#DB2777', accent: '#2563EB', muted: '#E5E7EB', headingFont: 'Montserrat, sans-serif', bodyFont: 'Roboto, sans-serif' },
  },
  {
    id: 'deconstructivist',
    name: 'Deconstructivist',
    description: 'Sharp angles, black backgrounds, and raw warning orange.',
    tokens: { background: '#FFFFFF', text: '#111111', primary: '#000000', accent: '#EA580C', muted: '#F3F4F6', headingFont: 'Bebas Neue, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'bauhaus-grid',
    name: 'Bauhaus Grid',
    description: 'Vintage architectural grid with clay red details.',
    tokens: { background: '#EFEFEA', text: '#222222', primary: '#C23B22', accent: '#1E3F66', muted: '#DDDCD6', headingFont: 'Montserrat, sans-serif', bodyFont: 'Arial, sans-serif' },
  },
  {
    id: 'organic-flow',
    name: 'Organic Flow',
    description: 'Gentle cream background with calm forest green headings.',
    tokens: { background: '#FAF7F0', text: '#3E4A3E', primary: '#7A9A7A', accent: '#5A7A5A', muted: '#E6E2D8', headingFont: 'Georgia, serif', bodyFont: 'Raleway, sans-serif' },
  },
  {
    id: 'sketchbook',
    name: 'Sketchbook Pencil',
    description: 'Natural hand-drawn graphite lines over paper background.',
    tokens: { background: '#FCFAF5', text: '#3A3A3A', primary: '#555555', accent: '#777777', muted: '#EFECE6', headingFont: 'Georgia, serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'diagrammatic',
    name: 'Diagrammatic',
    description: 'Clean scientific layouts with bright red and blue graphics.',
    tokens: { background: '#FFFFFF', text: '#111111', primary: '#E11D48', accent: '#2563EB', muted: '#F3F4F6', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif' },
  },
  {
    id: 'axonometric',
    name: 'Axonometric Technical',
    description: 'Slate gray tech blueprint styles.',
    tokens: { background: '#F1F3F5', text: '#212529', primary: '#343A40', accent: '#495057', muted: '#E9ECEF', headingFont: 'Montserrat, sans-serif', bodyFont: 'Source Sans Pro, sans-serif' },
  },
  {
    id: 'craft-paper',
    name: 'Craft Paper',
    description: 'Eco-friendly cardboard styling with organic brown details.',
    tokens: { background: '#E2CEB1', text: '#403020', primary: '#604D3C', accent: '#806A57', muted: '#D2BDA0', headingFont: 'Georgia, serif', bodyFont: 'Raleway, sans-serif' },
  },
]
