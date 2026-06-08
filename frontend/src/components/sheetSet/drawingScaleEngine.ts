/**
 * Drawing Scale Engine
 *
 * Maintains drawing scale relationships and metadata
 * Handles scale ratios, conversions, and scale-aware resizing
 */

import type { ArchScale, DrawingMetadata } from './sheetSetTypes'

// ─────────────────────────────────────────────────────────────
// SCALE RATIOS
// ─────────────────────────────────────────────────────────────

export const SCALE_RATIOS: Record<ArchScale, number> = {
  '1:1': 1,
  '1:5': 5,
  '1:10': 10,
  '1:20': 20,
  '1:50': 50,
  '1:100': 100,
  '1:200': 200,
  '1:500': 500,
  '1:1000': 1000,
}

// ─────────────────────────────────────────────────────────────
// SCALE CONVERSIONS
// ─────────────────────────────────────────────────────────────

/**
 * Convert drawing from one scale to another
 * Maintains real-world proportions
 */
export function convertScale(
  currentScale: ArchScale,
  targetScale: ArchScale
): number {
  const currentRatio = SCALE_RATIOS[currentScale]
  const targetRatio = SCALE_RATIOS[targetScale]
  return currentRatio / targetRatio
}

/**
 * When resizing a locked-scale drawing, show the implied scale change
 */
export function calculateImpliedScale(
  originalWidth: number,
  originalHeight: number,
  newWidth: number,
  newHeight: number,
  originalScale: ArchScale
): { newScale: ArchScale; scaleFactor: number; warning: string } {
  const scaleFactor = newWidth / originalWidth

  // Find closest standard scale
  const currentRatio = SCALE_RATIOS[originalScale]
  const impliedRatio = currentRatio / scaleFactor

  let closestScale: ArchScale = originalScale
  let closestDistance = Math.abs(SCALE_RATIOS[closestScale] - impliedRatio)

  for (const scale of Object.keys(SCALE_RATIOS) as ArchScale[]) {
    const distance = Math.abs(SCALE_RATIOS[scale] - impliedRatio)
    if (distance < closestDistance) {
      closestDistance = distance
      closestScale = scale
    }
  }

  return {
    newScale: closestScale,
    scaleFactor,
    warning: `Resizing changes drawing scale from ${originalScale} to approximately ${closestScale}`,
  }
}

// ─────────────────────────────────────────────────────────────
// RECOMMENDED SCALES BY DRAWING TYPE
// ─────────────────────────────────────────────────────────────

export const RECOMMENDED_SCALES: Record<string, ArchScale[]> = {
  'master-plan': ['1:500', '1:1000'],
  'site-plan': ['1:500', '1:1000'],
  'ground-floor': ['1:100', '1:200'],
  'floor-plan': ['1:100', '1:200'],
  'section': ['1:100', '1:200'],
  'elevation': ['1:100', '1:200'],
  'detail': ['1:20', '1:50', '1:10'],
  'context': ['1:1000', '1:500'],
}

// ─────────────────────────────────────────────────────────────
// SCALE LABEL GENERATION
// ─────────────────────────────────────────────────────────────

export function generateScaleLabel(drawing: DrawingMetadata): string {
  const scaleStr = drawing.sheetScale || drawing.originalScale
  return `Scale ${scaleStr}`
}

export function generateDrawingLabel(drawing: DrawingMetadata): string {
  return `${drawing.drawingName}\n${generateScaleLabel(drawing)}`
}

// ─────────────────────────────────────────────────────────────
// VECTOR DETECTION
// ─────────────────────────────────────────────────────────────

/**
 * Detect if uploaded file is vector (SVG, PDF) vs raster (PNG, JPG)
 */
export function isVectorFormat(url: string): boolean {
  const ext = url.split('.').pop()?.toLowerCase()
  return ext === 'svg' || ext === 'pdf'
}

/**
 * Quality assessment for drawing upload
 */
export function assessDrawingQuality(
  url: string,
  drawingType: string
): { quality: 'high' | 'medium' | 'low'; recommendation: string } {
  const isVector = isVectorFormat(url)

  // Vector formats are always high quality for technical drawings
  if (isVector) {
    return { quality: 'high', recommendation: 'Vector format - excellent for technical drawings' }
  }

  // Raster formats need pixel inspection (simplified here)
  // In real implementation, would check image dimensions
  return {
    quality: 'medium',
    recommendation: 'PNG/JPG detected - ensure high resolution (300+ DPI recommended for plans)',
  }
}

// ─────────────────────────────────────────────────────────────
// SCALE-AWARE RESIZE
// ─────────────────────────────────────────────────────────────

/**
 * When resizing a drawing, suggest what the scale actually changes to
 */
export function suggestScalePreservation(
  drawing: DrawingMetadata,
  newWidth: number,
  originalWidth: number
): {
  action: 'preserve-scale' | 'update-scale' | 'warn'
  message: string
  recommendedScale?: ArchScale
} {
  const scaleFactor = newWidth / originalWidth

  if (Math.abs(scaleFactor - 1) < 0.01) {
    return { action: 'preserve-scale', message: 'Scale preserved' }
  }

  if (scaleFactor > 0.95 && scaleFactor < 1.05) {
    return { action: 'preserve-scale', message: 'Minor adjustment within tolerance' }
  }

  const { newScale, warning } = calculateImpliedScale(
    originalWidth,
    0,
    newWidth,
    0,
    drawing.sheetScale
  )

  return {
    action: 'warn',
    message: warning,
    recommendedScale: newScale,
  }
}

// ─────────────────────────────────────────────────────────────
// METADATA VALIDATION
// ─────────────────────────────────────────────────────────────

export interface ScaleValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateDrawingMetadata(drawing: DrawingMetadata): ScaleValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!drawing.drawingName) errors.push('Drawing name required')
  if (!drawing.drawingType) errors.push('Drawing type required')
  if (!drawing.originalScale) errors.push('Original scale required')
  if (!drawing.url) errors.push('Drawing URL required')

  // Warn if scales don't match standard pairs
  if (!RECOMMENDED_SCALES[drawing.drawingType]?.includes(drawing.originalScale)) {
    warnings.push(
      `Scale ${drawing.originalScale} not standard for ${drawing.drawingType}. ` +
      `Consider: ${RECOMMENDED_SCALES[drawing.drawingType]?.join(', ')}`
    )
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ─────────────────────────────────────────────────────────────
// SCALE INTELLIGENCE
// ─────────────────────────────────────────────────────────────

/**
 * Suggest scale based on drawing name heuristics
 */
export function inferScaleFromName(drawingName: string): ArchScale | null {
  const name = drawingName.toLowerCase()

  if (name.includes('master') || name.includes('site')) return '1:500'
  if (name.includes('ground floor') || name.includes('floor')) return '1:100'
  if (name.includes('section')) return '1:100'
  if (name.includes('elevation')) return '1:100'
  if (name.includes('detail')) return '1:20'
  if (name.includes('context')) return '1:1000'

  return null
}

/**
 * Suggest drawing type from filename
 */
export function inferDrawingTypeFromName(fileName: string): string {
  const name = fileName.toLowerCase()

  if (name.includes('plan')) return 'plan'
  if (name.includes('section')) return 'section'
  if (name.includes('elevation')) return 'elevation'
  if (name.includes('detail')) return 'detail'
  if (name.includes('render') || name.includes('perspective')) return 'render'
  if (name.includes('diagram')) return 'diagram'

  return 'sketch'
}

// ─────────────────────────────────────────────────────────────
// SCALE LOCK BEHAVIOR
// ─────────────────────────────────────────────────────────────

export interface ScaleLockBehavior {
  locked: boolean
  action: 'preserve-proportions' | 'warn-and-update' | 'prevent'
}

/**
 * When scale lock is enabled, prevent non-uniform scaling
 * Only allow uniform scaling with scale factor
 */
export function enforceLockBehavior(
  currentW: number,
  currentH: number,
  proposedW: number,
  proposedH: number,
  locked: boolean
): { w: number; h: number; applied: boolean } {
  if (!locked) return { w: proposedW, h: proposedH, applied: false }

  // Calculate scale factors
  const scaleW = proposedW / currentW
  const scaleH = proposedH / currentH

  // Use average or warn if very different
  if (Math.abs(scaleW - scaleH) > 0.05) {
    // Non-uniform - use primary scale (width)
    return { w: proposedW, h: currentH * scaleW, applied: true }
  }

  return { w: proposedW, h: proposedH, applied: false }
}
