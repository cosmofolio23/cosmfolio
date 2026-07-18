import { archArt, paletteFrom, type ArchArtKind } from '@/components/templates/demoArt'

/**
 * Generates a themed placeholder SVG Data URI based on the template's color palette.
 */
export function getPlaceholderImage(
  type: 'render' | 'plan' | 'section' | 'diagram' | 'portrait',
  colors?: Record<string, string>,
  seed = 1
): string {
  const palette = paletteFrom(colors)
  // Map drawing types
  let kind: ArchArtKind = 'render'
  if (type === 'plan') kind = 'plan'
  else if (type === 'section') kind = 'section'
  else if (type === 'diagram') kind = 'diagram'
  else if (type === 'portrait') kind = 'portrait'

  const svgString = archArt(kind, palette, seed)
  let base64 = ''
  if (typeof window === 'undefined') {
    base64 = Buffer.from(svgString).toString('base64')
  } else {
    base64 = window.btoa(unescape(encodeURIComponent(svgString)))
  }
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Returns realistic placeholder text matching the design style/category.
 */
export function getPlaceholderText(
  type: 'title' | 'subtitle' | 'description' | 'bio',
  category = 'contemporary'
): string {
  const cat = category.toLowerCase()

  if (cat.includes('minimal')) {
    switch (type) {
      case 'title': return 'Nordic Pavilion'
      case 'subtitle': return 'Simplicity & Spatial Clarity'
      case 'description': return 'A design centered on raw concrete and timber framing. By stripping away non-essential elements, the focus is placed entirely on the framing of natural landscape views.'
      case 'bio': return 'Architectural designer focusing on spatial minimalism, light studies, and raw local materials.'
    }
  }

  if (cat.includes('brutalist') || cat.includes('industrial')) {
    switch (type) {
      case 'title': return 'Concrete Foundry'
      case 'subtitle': return 'Stark Tectonics & Adaptive Re-use'
      case 'description': return 'An industrial conversion showcasing tectonic concrete volumes. The design retains the raw structural identity, celebrating heavy massing and deep shadow casting.'
      case 'bio': return 'Architect working with heavy concrete, adaptive reuse of industrial sites, and monumental spatial voids.'
    }
  }

  if (cat.includes('parametric') || cat.includes('technical')) {
    switch (type) {
      case 'title': return 'Generative Pavilion'
      case 'subtitle': return 'Computational Grids & Structural Formfinding'
      case 'description': return 'A structural canopy generated via algorithms to optimize daylight shading and structural load paths. Fabricated from CNC-cut double-curved timber joints.'
      case 'bio': return 'Computational designer specializing in algorithmic form-finding, digital fabrication, and parametric skins.'
    }
  }

  if (cat.includes('sustainable') || cat.includes('organic')) {
    switch (type) {
      case 'title': return 'Earthen Canopy'
      case 'subtitle': return 'Rammed Earth & Eco-Vernacular Design'
      case 'description': return 'A self-sustaining local community center made from rammed earth. Integrates graywater filtration, passive air circulation chimney vents, and solar harvesting tiles.'
      case 'bio': return 'Architect and sustainability researcher committed to zero-carbon housing, local earth crafts, and passive heating/cooling.'
    }
  }

  // Default / Contemporary
  switch (type) {
    case 'title': return 'Metropolitan Hub'
    case 'subtitle': return 'Civic Infrastructure & Public Plazas'
    case 'description': return 'A multi-functional civic development bridging public transport lines with green walk lanes, fostering neighborhood integration and vibrant local street life.'
    case 'bio': return 'Architectural practitioner combining civic design, commercial viability, and environmental sustainability in modern urban centers.'
  }
}
