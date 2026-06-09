/**
 * buildSheetSet — turns a submission pack (SheetSetTemplate) + a project's library
 * assets into a fully-populated SheetSet, filling each sheet's slots with the best
 * matching drawing (by sheet drawing-type, preferring a scale match).
 *
 * This is the COSMO SHEET side of "upload once → feeds both": the rich SheetSet
 * model + templates already exist in TS, so generation happens here and the
 * backend just persists the JSON.
 */

import type {
  SheetSet, Sheet, SheetElement, SheetSetTemplate, TemplateSheetDef,
  DrawingType, ArchScale,
} from '@/components/sheetSet/sheetSetTypes'
import { toSheetDrawingType, type AssetType } from '@/lib/assetTaxonomy'
import type { LibraryAsset } from '@/lib/libraryApi'

let _seq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${_seq++}`

interface ProjectInfo {
  name: string
  studentName?: string
  collegeName?: string
  guideName?: string
}

/** Grid placement for the i-th slot given a layout's columns/rows. */
function placeInGrid(i: number, cols: number, rows: number) {
  const pad = 4 // %
  const c = i % cols
  const r = Math.floor(i / cols)
  const cellW = 100 / cols
  const cellH = 100 / rows
  return {
    x: c * cellW + pad,
    y: r * cellH + pad + 6, // leave headroom for sheet title
    w: cellW - pad * 2,
    h: cellH - pad * 2,
  }
}

/** Pick & consume the best library asset for a slot. Mutates `pool`. */
function takeAssetForSlot(
  pool: LibraryAsset[],
  needsType: DrawingType | undefined,
  needsScale: ArchScale | undefined
): LibraryAsset | null {
  if (!needsType) return null
  // candidates whose canonical type maps to the slot's drawing type
  const candidates = pool
    .map((a, idx) => ({ a, idx, dt: toSheetDrawingType(a.asset_type as AssetType) }))
    .filter(x => x.dt === needsType)
  if (!candidates.length) return null
  // prefer a scale match when the slot wants one
  let chosen = candidates[0]
  if (needsScale) {
    const scaled = candidates.find(x => x.a.scale === needsScale)
    if (scaled) chosen = scaled
  }
  pool.splice(chosen.idx, 1)
  return chosen.a
}

function buildSheet(def: TemplateSheetDef, setId: string, pool: LibraryAsset[]): Sheet {
  const cols = def.layout.columnCount || 1
  const rows = def.layout.rowCount || 1
  const slots = def.slots || []

  const elements: SheetElement[] = slots.map((slot, i) => {
    const pos = placeInGrid(i, cols, rows)
    const asset = takeAssetForSlot(pool, slot.needsDrawingType, slot.needsScale)

    if (asset && asset.url) {
      return {
        id: uid('el'),
        kind: 'drawing',
        x: pos.x, y: pos.y, w: pos.w, h: pos.h, z: i,
        locked: false,
        visible: true,
        drawing: {
          drawingName: asset.title || slot.label,
          drawingType: (slot.needsDrawingType || 'diagram') as DrawingType,
          originalScale: (asset.scale || slot.needsScale || '1:100') as ArchScale,
          sheetScale: (asset.scale || slot.needsScale || '1:100') as ArchScale,
          northPoint: slot.needsDrawingType === 'plan',
          vector: !!asset.is_vector,
          url: asset.url,
        },
      }
    }

    // unfilled slot → labelled placeholder so the student sees what to add
    return {
      id: uid('el'),
      kind: 'text',
      x: pos.x, y: pos.y, w: pos.w, h: pos.h, z: i,
      locked: false,
      visible: true,
      content: `+ ${slot.label}${slot.needsScale ? ` (${slot.needsScale})` : ''}`,
      fontSize: 13,
      color: '#9ca3af',
      bgColor: '#f9fafb',
    }
  })

  return {
    id: setId ? `${setId}-s${def.sheetNumber}` : uid('sheet'),
    setId,
    sheetNumber: def.sheetNumber,
    sheetName: def.name,
    sheetType: def.type,
    layout: def.layout,
    elements,
    gridEnabled: true,
    snapEnabled: true,
    gridType: 'column',
    order: def.sheetNumber - 1,
  }
}

export function buildSheetSetFromLibrary(
  template: SheetSetTemplate,
  assets: LibraryAsset[],
  project: ProjectInfo
): SheetSet {
  const setId = uid('set')
  const now = new Date().toISOString()
  // mutable pool so each asset is used at most once across the set
  const pool = [...assets]

  const sheets = template.sheets.map(def => buildSheet(def, setId, pool))

  return {
    id: setId,
    projectId: '',
    projectName: project.name,
    submissionType: template.submissionType,
    studentName: project.studentName,
    collegeName: project.collegeName,
    guideName: project.guideName,
    date: now.split('T')[0],
    sheetSize: template.defaultSize,
    orientation: template.defaultOrientation,
    masterSheets: [],
    primaryColor: template.style.primaryColor,
    secondaryColor: '#6b7280',
    accentColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontFamily: template.style.fontFamily,
    sheets,
    createdAt: now,
    updatedAt: now,
    version: 1,
    published: false,
  }
}

/** Empty set (no asset filling) — used by the standalone COSMO SHEET wizard. */
export function buildEmptySheetSet(template: SheetSetTemplate, project: ProjectInfo): SheetSet {
  return buildSheetSetFromLibrary(template, [], project)
}
