/**
 * Architectural Scale Engine
 *
 * Handles precise real-world millimeter calculations, scale factor conversions,
 * scale-bar math, and scale mismatch warnings for A0–A4 presentation boards.
 */

import { SHEET_SIZES, type ArchScale, type SheetSize, type ScaleConfig } from '../sheetSetTypes'

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

/**
 * Calculate physical placed width (mm) on sheet given real-world dimension (mm) and scale
 */
export function calculatePlacedWidthMm(realWorldMm: number, scale: ArchScale): number {
  const ratio = SCALE_RATIOS[scale] || 100
  return realWorldMm / ratio
}

/**
 * Calculate real-world dimension (mm) given placed width on sheet (mm) and scale
 */
export function calculateRealWorldMm(placedMm: number, scale: ArchScale): number {
  const ratio = SCALE_RATIOS[scale] || 100
  return placedMm * ratio
}

/**
 * Scale Mismatch Checker
 * Detects if a drawing placed on a sheet has been stretched/resized away from its declared label scale.
 */
export function detectScaleMismatch(
  placedWidthPercent: number, // % of sheet width
  sheetSize: SheetSize,
  orientation: 'portrait' | 'landscape',
  declaredScale: ArchScale,
  realWorldDimensionMm?: number
): ScaleConfig {
  const ratio = SCALE_RATIOS[declaredScale] || 100
  const spec = SHEET_SIZES[sheetSize] || SHEET_SIZES['A1']
  const sheetWidthMm = orientation === 'landscape' ? spec.height || 841 : spec.width || 594

  const placedMm = (placedWidthPercent / 100) * sheetWidthMm

  if (!realWorldDimensionMm) {
    return {
      archScale: declaredScale,
      scaleRatio: ratio,
      sheetWidthMm: placedMm,
      isMismatch: false,
      calculatedScaleLabel: `Scale ${declaredScale}`,
    }
  }

  const effectiveRatio = realWorldDimensionMm / placedMm
  const deviation = Math.abs(effectiveRatio - ratio) / ratio

  const isMismatch = deviation > 0.08 // >8% deviation indicates scaled mismatch

  const closestScale = (Object.keys(SCALE_RATIOS) as ArchScale[]).reduce((prev, curr) => {
    return Math.abs(SCALE_RATIOS[curr] - effectiveRatio) < Math.abs(SCALE_RATIOS[prev] - effectiveRatio) ? curr : prev
  })

  return {
    archScale: declaredScale,
    scaleRatio: ratio,
    realWorldWidthMm: realWorldDimensionMm,
    sheetWidthMm: placedMm,
    isMismatch,
    calculatedScaleLabel: isMismatch
      ? `⚠️ Mismatch: Placed size = 1:${Math.round(effectiveRatio)} (Declared: ${declaredScale})`
      : `Scale ${declaredScale}`,
  }
}

/**
 * Calculate metric scalebar graduations (5m, 10m, 20m) for a given scale and sheet size
 */
export function calculateScalebarGraduations(scale: ArchScale, sheetSize: SheetSize) {
  const ratio = SCALE_RATIOS[scale] || 100
  
  // Select reasonable metric step (e.g. 1:100 -> 5m / 10m / 20m)
  const targetMeters = ratio <= 20 ? 2 : ratio <= 100 ? 10 : ratio <= 500 ? 50 : 100
  const realWorldMm = targetMeters * 1000
  const scalebarMm = realWorldMm / ratio

  return {
    label: `${targetMeters}m`,
    realWorldMeters: targetMeters,
    scalebarWidthMm: scalebarMm,
    subdivisions: [0, targetMeters / 2, targetMeters],
  }
}
