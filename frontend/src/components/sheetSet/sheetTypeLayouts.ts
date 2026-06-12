/**
 * Per-sheet-type layout library + layout packs.
 *
 * Every sheet type (plan, section, elevation, views, site, concept …) has its
 * own set of layouts. A LAYOUT PACK picks one layout per type so a whole
 * submission gets a consistent graphic system in one click — and each sheet
 * can still switch to any other layout of its type in the editor.
 */

import type {
  Sheet, SheetElement, SheetLayout, SheetSet, SheetType, DrawingType, ArchScale,
  SheetSize, Orientation, SubmissionType,
} from './sheetSetTypes'

let _seq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${_seq++}`

// ─────────────────────────────────────────────────────────────
// SHEET TYPE OPTIONS (what the wizard lets you pick)
// ─────────────────────────────────────────────────────────────

export interface SheetTypeOption {
  type: SheetType
  name: string
  icon: string
  desc: string
  defaultCount: number
}

export const SHEET_TYPE_OPTIONS: SheetTypeOption[] = [
  { type: 'cover', name: 'Cover', icon: '🏷️', desc: 'Title sheet with hero image', defaultCount: 1 },
  { type: 'site', name: 'Site Analysis', icon: '🗺️', desc: 'Location, sun, wind, context', defaultCount: 1 },
  { type: 'concept', name: 'Concept', icon: '💡', desc: 'Idea, diagrams, process', defaultCount: 1 },
  { type: 'zoning', name: 'Zoning', icon: '🧩', desc: 'Program + zoning diagrams', defaultCount: 1 },
  { type: 'master-plan', name: 'Master Plan', icon: '🌐', desc: 'Site / master plan drawing', defaultCount: 1 },
  { type: 'plans', name: 'Floor Plans', icon: '📐', desc: 'Floor plan sheets', defaultCount: 2 },
  { type: 'sections', name: 'Sections', icon: '✂️', desc: 'Building sections', defaultCount: 1 },
  { type: 'elevations', name: 'Elevations', icon: '🏛️', desc: 'Building elevations', defaultCount: 1 },
  { type: 'renders', name: 'Views / Renders', icon: '🎨', desc: '3D views and renders', defaultCount: 1 },
  { type: 'details', name: 'Details', icon: '🔍', desc: 'Construction details', defaultCount: 1 },
  { type: 'presentation', name: 'Presentation', icon: '🖼️', desc: 'Mixed presentation board', defaultCount: 1 },
]

// ─────────────────────────────────────────────────────────────
// LAYOUT VARIANTS PER SHEET TYPE
// ─────────────────────────────────────────────────────────────

type SlotSpec = [label: string, types: DrawingType[], scale?: ArchScale]

function mkLayout(id: string, name: string, desc: string, cols: number, rows: number, slots: SlotSpec[]): SheetLayout {
  return {
    id, name, description: desc,
    columnCount: cols, rowCount: rows,
    gridSize: 'modular',
    slotDefinitions: slots.map(([label, types, scale], i) => ({
      id: `${id}-slot${i + 1}`, position: i + 1,
      acceptedDrawingTypes: types, needsDrawingType: types[0],
      needsScale: scale, recommendedScale: scale, label,
    })),
  }
}

const P: DrawingType[] = ['plan']
const S: DrawingType[] = ['section']
const E: DrawingType[] = ['elevation']
const R: DrawingType[] = ['render']
const D: DrawingType[] = ['diagram', 'analysis', 'sketch']
const DET: DrawingType[] = ['detail']
const ANY: DrawingType[] = ['plan', 'section', 'elevation', 'render', 'diagram', 'detail']

export const LAYOUTS_BY_TYPE: Partial<Record<SheetType, SheetLayout[]>> = {
  cover: [
    mkLayout('cover-title-hero', 'Title + Hero', 'Title block above a hero image', 1, 2, [['Title block', D], ['Hero image', R]]),
    mkLayout('cover-hero-full', 'Full Hero', 'Full-bleed hero image, title overlaid', 1, 1, [['Hero image', R]]),
    mkLayout('cover-minimal', 'Minimal Title', 'Typographic cover, no image', 1, 1, [['Title block', D]]),
  ],
  site: [
    mkLayout('site-analysis-grid', 'Analysis Grid', '3×3 grid of analysis diagrams', 3, 3,
      Array.from({ length: 9 }, (_, i) => [`Analysis ${i + 1}`, D] as SlotSpec)),
    mkLayout('site-map-panels', 'Map + Panels', 'Large site map with 3 study panels', 2, 2,
      [['Site map', D], ['Sun path', D], ['Wind rose', D], ['Access', D]]),
    mkLayout('site-full-map', 'Full Site Map', 'One large annotated site map', 1, 1, [['Site map', D]]),
  ],
  concept: [
    mkLayout('concept-statement', 'Statement + Diagram', 'Concept text above the key diagram', 1, 2, [['Concept statement', D], ['Key diagram', D]]),
    mkLayout('concept-trio', 'Concept Trio', 'Three diagrams side by side', 3, 1, [['Diagram 1', D], ['Diagram 2', D], ['Diagram 3', D]]),
    mkLayout('concept-process', 'Process Grid', 'Four-step form development', 2, 2,
      [['Step 1', D], ['Step 2', D], ['Step 3', D], ['Step 4', D]]),
  ],
  zoning: [
    mkLayout('zoning-legend', 'Zoning + Legend', 'Zoning plan with program panel', 2, 1, [['Zoning plan', D], ['Program / legend', D]]),
    mkLayout('zoning-grid', 'Zoning Grid', 'Per-level zoning diagrams', 2, 2,
      [['Level 1', D], ['Level 2', D], ['Level 3', D], ['Program chart', D]]),
  ],
  'master-plan': [
    mkLayout('master-full', 'Full Master Plan', 'One large master plan', 1, 1, [['Master plan', P, '1:500']]),
    mkLayout('master-insets', 'Master + Insets', 'Master plan with detail insets', 2, 2,
      [['Master plan', P, '1:500'], ['Inset 1', P, '1:200'], ['Inset 2', P, '1:200'], ['Key plan', D]]),
  ],
  plans: [
    mkLayout('plan-single', 'Single Plan', 'One plan per sheet', 1, 1, [['Floor plan', P, '1:100']]),
    mkLayout('plan-duo', 'Two Plans', 'Two plans side by side', 2, 1, [['Plan A', P, '1:100'], ['Plan B', P, '1:100']]),
    mkLayout('plan-quartet', 'Plan Quartet', 'Four plans in a grid', 2, 2,
      [['Plan 1', P, '1:200'], ['Plan 2', P, '1:200'], ['Plan 3', P, '1:200'], ['Plan 4', P, '1:200']]),
    mkLayout('plan-with-key', 'Plan + Key', 'Main plan with key diagrams', 2, 2,
      [['Main plan', P, '1:100'], ['Key plan', D], ['Detail', DET, '1:50'], ['Notes', D]]),
  ],
  sections: [
    mkLayout('section-single', 'Single Section', 'One full-width section', 1, 1, [['Section', S, '1:100']]),
    mkLayout('section-stack', 'Stacked Sections', 'Two sections stacked', 1, 2, [['Section A-A', S, '1:100'], ['Section B-B', S, '1:100']]),
    mkLayout('section-trio', 'Section Trio', 'Three stacked sections', 1, 3,
      [['Section A-A', S, '1:200'], ['Section B-B', S, '1:200'], ['Section C-C', S, '1:200']]),
  ],
  elevations: [
    mkLayout('elev-single', 'Single Elevation', 'One full-width elevation', 1, 1, [['Elevation', E, '1:100']]),
    mkLayout('elev-stack', 'Stacked Elevations', 'Two elevations stacked', 1, 2, [['North elevation', E, '1:100'], ['South elevation', E, '1:100']]),
    mkLayout('elev-four', 'Four Elevations', 'All four elevations', 2, 2,
      [['North', E, '1:200'], ['South', E, '1:200'], ['East', E, '1:200'], ['West', E, '1:200']]),
  ],
  renders: [
    mkLayout('view-hero', 'Hero View', 'One full-bleed render', 1, 1, [['Hero view', R]]),
    mkLayout('view-hero-trio', 'Hero + Trio', 'Main render with three views', 2, 2,
      [['Main view', R], ['View 2', R], ['View 3', R], ['View 4', R]]),
    mkLayout('view-six', 'Six Views', 'Six-view grid', 3, 2,
      Array.from({ length: 6 }, (_, i) => [`View ${i + 1}`, R] as SlotSpec)),
  ],
  details: [
    mkLayout('detail-single', 'Single Detail', 'One large detail with notes', 1, 1, [['Detail', DET, '1:5']]),
    mkLayout('detail-duo', 'Two Details', 'Two details side by side', 2, 1, [['Detail 1', DET, '1:10'], ['Detail 2', DET, '1:10']]),
    mkLayout('detail-grid', 'Detail Grid', 'Six details in a grid', 2, 3,
      Array.from({ length: 6 }, (_, i) => [`Detail ${i + 1}`, DET, '1:20'] as SlotSpec)),
  ],
  presentation: [
    mkLayout('board-mix', 'Board Mix', 'Render, plan, section, diagram', 2, 2,
      [['Hero render', R], ['Key plan', P, '1:200'], ['Section', S, '1:200'], ['Concept', D]]),
    mkLayout('board-hero', 'Hero Board', 'One image carries the board', 1, 1, [['Hero', R]]),
  ],
}

const GENERIC_LAYOUTS: SheetLayout[] = [
  mkLayout('generic-single', 'Single', 'One large drawing', 1, 1, [['Drawing', ANY]]),
  mkLayout('generic-duo', 'Two Up', 'Two drawings', 2, 1, [['Drawing 1', ANY], ['Drawing 2', ANY]]),
  mkLayout('generic-grid', '2×2 Grid', 'Four drawings', 2, 2,
    [['Drawing 1', ANY], ['Drawing 2', ANY], ['Drawing 3', ANY], ['Drawing 4', ANY]]),
]

/** All layout choices for a sheet type (always non-empty). */
export function layoutsForType(type: SheetType): SheetLayout[] {
  return LAYOUTS_BY_TYPE[type] || GENERIC_LAYOUTS
}

// ─────────────────────────────────────────────────────────────
// LAYOUT PACKS — one layout per type, consistent graphic system
// ─────────────────────────────────────────────────────────────

export interface LayoutPack {
  id: string
  name: string
  desc: string
  style: { primaryColor: string; fontFamily: string }
  /** sheetType → preferred layout id (falls back to first of type) */
  prefer: Partial<Record<SheetType, string>>
}

export const LAYOUT_PACKS: LayoutPack[] = [
  {
    id: 'classic-academic',
    name: 'Classic Academic',
    desc: 'Balanced grids, generous margins — thesis & studio submissions',
    style: { primaryColor: '#1f2937', fontFamily: 'Georgia, serif' },
    prefer: {
      cover: 'cover-title-hero', site: 'site-analysis-grid', concept: 'concept-statement',
      zoning: 'zoning-legend', 'master-plan': 'master-full', plans: 'plan-duo',
      sections: 'section-stack', elevations: 'elev-four', renders: 'view-hero-trio',
      details: 'detail-grid', presentation: 'board-mix',
    },
  },
  {
    id: 'minimal-studio',
    name: 'Minimal Studio',
    desc: 'One drawing per sheet, maximum white space — gallery feel',
    style: { primaryColor: '#111827', fontFamily: 'Inter, sans-serif' },
    prefer: {
      cover: 'cover-minimal', site: 'site-full-map', concept: 'concept-trio',
      zoning: 'zoning-grid', 'master-plan': 'master-full', plans: 'plan-single',
      sections: 'section-single', elevations: 'elev-single', renders: 'view-hero',
      details: 'detail-duo', presentation: 'board-hero',
    },
  },
  {
    id: 'competition-bold',
    name: 'Competition Bold',
    desc: 'Dense, high-impact boards — juries read them from across the room',
    style: { primaryColor: '#9C7416', fontFamily: 'Inter, sans-serif' },
    prefer: {
      cover: 'cover-hero-full', site: 'site-map-panels', concept: 'concept-process',
      zoning: 'zoning-legend', 'master-plan': 'master-insets', plans: 'plan-quartet',
      sections: 'section-trio', elevations: 'elev-stack', renders: 'view-six',
      details: 'detail-grid', presentation: 'board-mix',
    },
  },
]

export function packLayoutForType(pack: LayoutPack, type: SheetType): SheetLayout {
  const options = layoutsForType(type)
  const preferred = pack.prefer[type]
  return options.find(l => l.id === preferred) || options[0]
}

// ─────────────────────────────────────────────────────────────
// SHEET BUILDERS
// ─────────────────────────────────────────────────────────────

function placeInGrid(i: number, cols: number, rows: number) {
  const pad = 4
  const c = i % cols
  const r = Math.floor(i / cols)
  const cellW = 100 / cols
  const cellH = 100 / rows
  return { x: c * cellW + pad, y: r * cellH + pad + 6, w: cellW - pad * 2, h: cellH - pad * 2 }
}

function placeholderElements(layout: SheetLayout): SheetElement[] {
  const cols = layout.columnCount || 1
  const rows = layout.rowCount || 1
  return layout.slotDefinitions.map((slot, i) => {
    const pos = placeInGrid(i, cols, rows)
    return {
      id: uid('el'), kind: 'text' as const,
      x: pos.x, y: pos.y, w: pos.w, h: pos.h, z: i,
      locked: false, visible: true,
      content: `+ ${slot.label}${slot.needsScale ? ` (${slot.needsScale})` : ''}`,
      fontSize: 13, color: '#9ca3af', bgColor: '#f9fafb',
    }
  })
}

const isPlaceholder = (el: SheetElement) => el.kind === 'text' && (el.content || '').startsWith('+ ')

/**
 * Switch a sheet to a new layout: real content re-flows into the new grid,
 * old placeholders are dropped, unfilled slots get fresh placeholders.
 */
export function applyLayoutToSheet(sheet: Sheet, layout: SheetLayout): Partial<Sheet> {
  const cols = layout.columnCount || 1
  const rows = layout.rowCount || 1
  const slots = layout.slotDefinitions
  const kept = sheet.elements.filter(el => !isPlaceholder(el))
  const elements: SheetElement[] = []

  kept.forEach((el, i) => {
    if (i < slots.length) {
      const pos = placeInGrid(i, cols, rows)
      elements.push({ ...el, x: pos.x, y: pos.y, w: pos.w, h: pos.h, z: i })
    } else {
      elements.push(el) // overflow content stays where it was
    }
  })
  for (let i = kept.length; i < slots.length; i++) {
    const pos = placeInGrid(i, cols, rows)
    elements.push({
      id: uid('el'), kind: 'text',
      x: pos.x, y: pos.y, w: pos.w, h: pos.h, z: i,
      locked: false, visible: true,
      content: `+ ${slots[i].label}${slots[i].needsScale ? ` (${slots[i].needsScale})` : ''}`,
      fontSize: 13, color: '#9ca3af', bgColor: '#f9fafb',
    })
  }
  return { layout, elements }
}

export interface SheetSelection {
  type: SheetType
  count: number
}

export interface WizardBuildConfig {
  projectName: string
  studentName?: string
  collegeName?: string
  sheetSize: SheetSize
  orientation: Orientation
  customWidth?: number
  customHeight?: number
  selections: SheetSelection[]
  packId: string
  submissionType?: SubmissionType
}

/** Build a complete SheetSet from the wizard's size → sheets → pack flow. */
export function buildSheetSetFromSelection(cfg: WizardBuildConfig): SheetSet {
  const pack = LAYOUT_PACKS.find(p => p.id === cfg.packId) || LAYOUT_PACKS[0]
  const setId = uid('set')
  const now = new Date().toISOString()

  const sheets: Sheet[] = []
  let n = 1
  for (const sel of cfg.selections) {
    const opt = SHEET_TYPE_OPTIONS.find(o => o.type === sel.type)
    const layout = packLayoutForType(pack, sel.type)
    for (let i = 0; i < sel.count; i++) {
      sheets.push({
        id: `${setId}-s${n}`,
        setId,
        sheetNumber: n,
        sheetName: sel.count > 1 ? `${opt?.name || sel.type} ${i + 1}` : (opt?.name || sel.type),
        sheetType: sel.type,
        layout,
        elements: placeholderElements(layout),
        gridEnabled: true,
        snapEnabled: true,
        gridType: 'column',
        order: n - 1,
      })
      n++
    }
  }

  return {
    id: setId,
    projectId: '',
    projectName: cfg.projectName,
    submissionType: cfg.submissionType || 'professional',
    studentName: cfg.studentName,
    collegeName: cfg.collegeName,
    date: now.split('T')[0],
    sheetSize: cfg.sheetSize,
    customWidth: cfg.customWidth,
    customHeight: cfg.customHeight,
    orientation: cfg.orientation,
    masterSheets: [],
    primaryColor: pack.style.primaryColor,
    secondaryColor: '#6b7280',
    accentColor: '#D4AF37',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    fontFamily: pack.style.fontFamily,
    sheets,
    createdAt: now,
    updatedAt: now,
    version: 1,
    published: false,
  }
}

/** Quick presets that pre-fill the wizard's sheet selection. */
export const SELECTION_PRESETS: Array<{ id: string; name: string; icon: string; selections: SheetSelection[] }> = [
  {
    id: 'thesis', name: 'Thesis', icon: '🎓',
    selections: [
      { type: 'cover', count: 1 }, { type: 'site', count: 2 }, { type: 'concept', count: 2 },
      { type: 'zoning', count: 1 }, { type: 'master-plan', count: 1 }, { type: 'plans', count: 4 },
      { type: 'sections', count: 2 }, { type: 'elevations', count: 2 }, { type: 'renders', count: 2 },
      { type: 'details', count: 2 }, { type: 'presentation', count: 1 },
    ],
  },
  {
    id: 'competition', name: 'Competition', icon: '🏆',
    selections: [
      { type: 'presentation', count: 1 }, { type: 'concept', count: 1 }, { type: 'renders', count: 1 },
    ],
  },
  {
    id: 'studio', name: 'Studio Review', icon: '📐',
    selections: [
      { type: 'cover', count: 1 }, { type: 'site', count: 1 }, { type: 'concept', count: 1 },
      { type: 'plans', count: 2 }, { type: 'sections', count: 1 }, { type: 'renders', count: 1 },
    ],
  },
]
