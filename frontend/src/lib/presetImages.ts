/**
 * Preset Images for Style Packs
 * Provides preview images and metadata for design themes
 */

interface PresetImage {
  id: string
  name: string
  category: string
  colors: string[]
  previewUrl?: string
}

/**
 * Get preview for a style pack
 * Returns metadata and styling information for design themes
 */
export function getStylePackPreview(stylePackId: string): PresetImage | null {
  const presets: Record<string, PresetImage> = {
    // Modern Minimalist
    'modern-minimalist': {
      id: 'modern-minimalist',
      name: 'Modern Minimalist',
      category: 'contemporary',
      colors: ['#ffffff', '#000000', '#e0e0e0', '#1a1a1a'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
    // Elegant Dark
    'elegant-dark': {
      id: 'elegant-dark',
      name: 'Elegant Dark',
      category: 'sophisticated',
      colors: ['#1a1a1a', '#ffffff', '#2d2d2d', '#d0d0d0'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
    // Warm Earthy
    'warm-earthy': {
      id: 'warm-earthy',
      name: 'Warm Earthy',
      category: 'natural',
      colors: ['#d4a574', '#3e3e3e', '#f5e6d3', '#8b7355'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
    // Cool Professional
    'cool-professional': {
      id: 'cool-professional',
      name: 'Cool Professional',
      category: 'corporate',
      colors: ['#0066cc', '#ffffff', '#e6f0ff', '#003d99'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
    // Bold Creative
    'bold-creative': {
      id: 'bold-creative',
      name: 'Bold Creative',
      category: 'artistic',
      colors: ['#ff6b35', '#004e89', '#f7b32b', '#1b1b1b'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
    // Soft Pastels
    'soft-pastels': {
      id: 'soft-pastels',
      name: 'Soft Pastels',
      category: 'gentle',
      colors: ['#ffd4e5', '#c0e8f9', '#fff9c4', '#e8d5f2'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
    // High Contrast
    'high-contrast': {
      id: 'high-contrast',
      name: 'High Contrast',
      category: 'striking',
      colors: ['#ffffff', '#000000', '#ff0000', '#00ff00'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
    // Monochrome
    'monochrome': {
      id: 'monochrome',
      name: 'Monochrome',
      category: 'timeless',
      colors: ['#ffffff', '#808080', '#cccccc', '#333333'],
      previewUrl: 'data:image/svg+xml,...', // Placeholder
    },
  }

  return presets[stylePackId] || null
}

/**
 * Get all available style pack presets
 */
export function getAllStylePacks(): PresetImage[] {
  return [
    {
      id: 'modern-minimalist',
      name: 'Modern Minimalist',
      category: 'contemporary',
      colors: ['#ffffff', '#000000', '#e0e0e0', '#1a1a1a'],
    },
    {
      id: 'elegant-dark',
      name: 'Elegant Dark',
      category: 'sophisticated',
      colors: ['#1a1a1a', '#ffffff', '#2d2d2d', '#d0d0d0'],
    },
    {
      id: 'warm-earthy',
      name: 'Warm Earthy',
      category: 'natural',
      colors: ['#d4a574', '#3e3e3e', '#f5e6d3', '#8b7355'],
    },
    {
      id: 'cool-professional',
      name: 'Cool Professional',
      category: 'corporate',
      colors: ['#0066cc', '#ffffff', '#e6f0ff', '#003d99'],
    },
    {
      id: 'bold-creative',
      name: 'Bold Creative',
      category: 'artistic',
      colors: ['#ff6b35', '#004e89', '#f7b32b', '#1b1b1b'],
    },
    {
      id: 'soft-pastels',
      name: 'Soft Pastels',
      category: 'gentle',
      colors: ['#ffd4e5', '#c0e8f9', '#fff9c4', '#e8d5f2'],
    },
    {
      id: 'high-contrast',
      name: 'High Contrast',
      category: 'striking',
      colors: ['#ffffff', '#000000', '#ff0000', '#00ff00'],
    },
    {
      id: 'monochrome',
      name: 'Monochrome',
      category: 'timeless',
      colors: ['#ffffff', '#808080', '#cccccc', '#333333'],
    },
  ]
}

/**
 * Export type for use in other modules
 */
export type { PresetImage }
