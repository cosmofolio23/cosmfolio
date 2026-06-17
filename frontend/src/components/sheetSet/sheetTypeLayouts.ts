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

/** Free-placement layout: each slot carries an explicit % frame (asymmetric
 * compositions — hero+strip, columns, bands, golden splits — per the modular
 * zone conventions used on real competition/thesis boards). */
type FreeSlot = [label: string, types: DrawingType[], frame: [number, number, number, number], scale?: ArchScale]

function mkFree(id: string, name: string, desc: string, slots: FreeSlot[]): SheetLayout {
  return {
    id, name, description: desc,
    columnCount: 12, rowCount: 12,
    gridSize: 'custom',
    slotDefinitions: slots.map(([label, types, f, scale], i) => ({
      id: `${id}-slot${i + 1}`, position: i + 1,
      acceptedDrawingTypes: types, needsDrawingType: types[0],
      needsScale: scale, recommendedScale: scale, label,
      frame: { x: f[0], y: f[1], w: f[2], h: f[3] },
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
    mkFree('cover-split', 'Split Cover', 'Title column left, full-height hero right', [
      ['Title block', D, [5, 8, 33, 84]], ['Hero image', R, [42, 4, 54, 92]],
    ]),
    mkFree('cover-band-title', 'Hero + Title Band', 'Hero image with a title band below', [
      ['Hero image', R, [4, 4, 92, 60]], ['Title block', D, [4, 70, 92, 24]],
    ]),
    mkFree('cover-spine', 'Title Spine', 'Vertical title spine beside the hero', [
      ['Title spine', D, [4, 4, 11, 92]], ['Hero image', R, [19, 4, 77, 92]],
    ]),
  ],
  site: [
    mkLayout('site-analysis-grid', 'Analysis Grid', '3×3 grid of analysis diagrams', 3, 3,
      Array.from({ length: 9 }, (_, i) => [`Analysis ${i + 1}`, D] as SlotSpec)),
    mkLayout('site-map-panels', 'Map + Panels', 'Large site map with 3 study panels', 2, 2,
      [['Site map', D], ['Sun path', D], ['Wind rose', D], ['Access', D]]),
    mkLayout('site-full-map', 'Full Site Map', 'One large annotated site map', 1, 1, [['Site map', D]]),
    mkFree('site-map-column', 'Map + Study Column', 'Large map with a stacked analysis column', [
      ['Site map', D, [4, 8, 58, 86]], ['Sun path', D, [66, 8, 30, 26]],
      ['Wind rose', D, [66, 38, 30, 26]], ['Access & noise', D, [66, 68, 30, 26]],
    ]),
    mkFree('site-banner-studies', 'Banner Map + Strip', 'Wide location map over a study strip', [
      ['Location map', D, [4, 8, 92, 50]], ['Study 1', D, [4, 64, 21.5, 30]],
      ['Study 2', D, [27.5, 64, 21.5, 30]], ['Study 3', D, [51, 64, 21.5, 30]], ['Study 4', D, [74.5, 64, 21.5, 30]],
    ]),
    mkFree('site-context-photos', 'Context + Map', 'Context photo grid beside the site map', [
      ['Context 1', D, [4, 8, 21.5, 28]], ['Context 2', D, [27.5, 8, 21.5, 28]],
      ['Site map', D, [51, 8, 45, 86]],
      ['Context 3', D, [4, 40, 21.5, 28]], ['Context 4', D, [27.5, 40, 21.5, 28]],
      ['Observations', D, [4, 72, 44.5, 22]],
    ]),
  ],
  concept: [
    mkLayout('concept-statement', 'Statement + Diagram', 'Concept text above the key diagram', 1, 2, [['Concept statement', D], ['Key diagram', D]]),
    mkLayout('concept-trio', 'Concept Trio', 'Three diagrams side by side', 3, 1, [['Diagram 1', D], ['Diagram 2', D], ['Diagram 3', D]]),
    mkLayout('concept-process', 'Process Grid', 'Four-step form development', 2, 2,
      [['Step 1', D], ['Step 2', D], ['Step 3', D], ['Step 4', D]]),
    mkFree('concept-timeline', 'Timeline Strip', 'Statement above a five-step evolution strip', [
      ['Concept statement', D, [4, 8, 92, 24]],
      ['Step 1', D, [4, 38, 16.8, 42]], ['Step 2', D, [22.8, 38, 16.8, 42]], ['Step 3', D, [41.6, 38, 16.8, 42]],
      ['Step 4', D, [60.4, 38, 16.8, 42]], ['Step 5', D, [79.2, 38, 16.8, 42]],
    ]),
    mkFree('concept-hero-notes', 'Hero Diagram + Notes', 'Key diagram with a notes column', [
      ['Key diagram', D, [4, 8, 62, 86]], ['Notes', D, [70, 8, 26, 40]], ['Supporting diagram', D, [70, 52, 26, 42]],
    ]),
    mkFree('concept-evolution', 'Form Evolution', 'Four massing steps over the final form', [
      ['Step 1', D, [4, 8, 21.5, 32]], ['Step 2', D, [27.5, 8, 21.5, 32]],
      ['Step 3', D, [51, 8, 21.5, 32]], ['Step 4', D, [74.5, 8, 21.5, 32]],
      ['Final form', R, [4, 46, 92, 48]],
    ]),
  ],
  zoning: [
    mkLayout('zoning-legend', 'Zoning + Legend', 'Zoning plan with program panel', 2, 1, [['Zoning plan', D], ['Program / legend', D]]),
    mkLayout('zoning-grid', 'Zoning Grid', 'Per-level zoning diagrams', 2, 2,
      [['Level 1', D], ['Level 2', D], ['Level 3', D], ['Program chart', D]]),
    mkFree('zoning-axon-labels', 'Exploded Axon', 'Central exploded axon with zone callouts', [
      ['Exploded axon', D, [26, 6, 48, 88]],
      ['Zone 1', D, [4, 10, 18, 24]], ['Zone 2', D, [4, 40, 18, 24]], ['Zone 3', D, [4, 70, 18, 24]],
      ['Program chart', D, [78, 10, 18, 84]],
    ]),
    mkFree('zoning-band-program', 'Zoning + Program Band', 'Zoning plan over program bar and legend', [
      ['Zoning plan', D, [4, 8, 92, 56]], ['Program bar', D, [4, 70, 60, 24]], ['Legend', D, [68, 70, 28, 24]],
    ]),
  ],
  'master-plan': [
    mkLayout('master-full', 'Full Master Plan', 'One large master plan', 1, 1, [['Master plan', P, '1:500']]),
    mkLayout('master-insets', 'Master + Insets', 'Master plan with detail insets', 2, 2,
      [['Master plan', P, '1:500'], ['Inset 1', P, '1:200'], ['Inset 2', P, '1:200'], ['Key plan', D]]),
    mkFree('master-context-col', 'Context + Master', 'Context diagrams beside the master plan', [
      ['Figure-ground', D, [4, 8, 26, 42]], ['Connectivity', D, [4, 54, 26, 40]],
      ['Master plan', P, [34, 4, 62, 90], '1:500'],
    ]),
    mkFree('master-sections-band', 'Master + Site Sections', 'Master plan over two site sections', [
      ['Master plan', P, [4, 4, 92, 62], '1:500'],
      ['Site section A', S, [4, 70, 45, 24], '1:500'], ['Site section B', S, [51, 70, 45, 24], '1:500'],
    ]),
  ],
  plans: [
    mkLayout('plan-single', 'Single Plan', 'One plan per sheet', 1, 1, [['Floor plan', P, '1:100']]),
    mkLayout('plan-duo', 'Two Plans', 'Two plans side by side', 2, 1, [['Plan A', P, '1:100'], ['Plan B', P, '1:100']]),
    mkLayout('plan-quartet', 'Plan Quartet', 'Four plans in a grid', 2, 2,
      [['Plan 1', P, '1:200'], ['Plan 2', P, '1:200'], ['Plan 3', P, '1:200'], ['Plan 4', P, '1:200']]),
    mkLayout('plan-with-key', 'Plan + Key', 'Main plan with key diagrams', 2, 2,
      [['Main plan', P, '1:100'], ['Key plan', D], ['Detail', DET, '1:50'], ['Notes', D]]),
    mkFree('plan-hero-details', 'Hero Plan + Details', 'Main plan with a detail column', [
      ['Main plan', P, [4, 8, 60, 86], '1:100'],
      ['Detail 1', DET, [68, 8, 28, 26], '1:50'], ['Detail 2', DET, [68, 38, 28, 26], '1:50'], ['Notes', D, [68, 68, 28, 26]],
    ]),
    mkFree('plan-section-band', 'Plan + Section Band', 'Floor plan over a full-width section', [
      ['Floor plan', P, [4, 8, 92, 54], '1:100'], ['Section band', S, [4, 66, 92, 28], '1:100'],
    ]),
    mkFree('plan-duo-notes', 'Plans + Notes Strip', 'Two plans over a legend strip', [
      ['Plan A', P, [4, 8, 44, 72], '1:100'], ['Plan B', P, [52, 8, 44, 72], '1:100'],
      ['Notes / legend', D, [4, 84, 92, 12]],
    ]),
  ],
  sections: [
    mkLayout('section-single', 'Single Section', 'One full-width section', 1, 1, [['Section', S, '1:100']]),
    mkLayout('section-stack', 'Stacked Sections', 'Two sections stacked', 1, 2, [['Section A-A', S, '1:100'], ['Section B-B', S, '1:100']]),
    mkLayout('section-trio', 'Section Trio', 'Three stacked sections', 1, 3,
      [['Section A-A', S, '1:200'], ['Section B-B', S, '1:200'], ['Section C-C', S, '1:200']]),
    mkFree('section-cinematic', 'Cinematic Band', 'One long section centred on the sheet', [
      ['Long section', S, [4, 30, 92, 40], '1:100'],
      ['Key plan', D, [4, 76, 24, 18]], ['Detail callout', DET, [72, 76, 24, 18], '1:20'],
    ]),
    mkFree('section-callouts', 'Section + Callouts', 'Section with a detail callout column', [
      ['Section', S, [4, 8, 62, 86], '1:100'],
      ['Callout 1', DET, [70, 8, 26, 26], '1:20'], ['Callout 2', DET, [70, 38, 26, 26], '1:20'], ['Callout 3', DET, [70, 68, 26, 26], '1:20'],
    ]),
    mkFree('section-views-band', 'Views + Section', 'Two interior views above the section', [
      ['View 1', R, [4, 8, 45, 28]], ['View 2', R, [51, 8, 45, 28]],
      ['Section A-A', S, [4, 42, 92, 52], '1:100'],
    ]),
  ],
  elevations: [
    mkLayout('elev-single', 'Single Elevation', 'One full-width elevation', 1, 1, [['Elevation', E, '1:100']]),
    mkLayout('elev-stack', 'Stacked Elevations', 'Two elevations stacked', 1, 2, [['North elevation', E, '1:100'], ['South elevation', E, '1:100']]),
    mkLayout('elev-four', 'Four Elevations', 'All four elevations', 2, 2,
      [['North', E, '1:200'], ['South', E, '1:200'], ['East', E, '1:200'], ['West', E, '1:200']]),
    mkFree('elev-hero-details', 'Elevation + Materials', 'Main elevation over a material detail strip', [
      ['Main elevation', E, [4, 8, 92, 48], '1:100'],
      ['Material 1', DET, [4, 62, 29, 32], '1:20'], ['Material 2', DET, [35.5, 62, 29, 32], '1:20'], ['Material 3', DET, [67, 62, 29, 32], '1:20'],
    ]),
    mkFree('elev-pair-renders', 'Elevations + Views', 'Two elevations beside two renders', [
      ['North elevation', E, [4, 8, 60, 42], '1:100'], ['South elevation', E, [4, 54, 60, 42], '1:100'],
      ['View 1', R, [68, 8, 28, 42]], ['View 2', R, [68, 54, 28, 42]],
    ]),
    mkFree('elev-strip-key', 'Elevation Strip', 'Centred elevation with key plan and palette', [
      ['Elevation', E, [4, 26, 92, 40], '1:100'],
      ['Key plan', D, [4, 72, 20, 22]], ['Material palette', D, [76, 72, 20, 22]],
    ]),
  ],
  renders: [
    mkLayout('view-hero', 'Hero View', 'One full-bleed render', 1, 1, [['Hero view', R]]),
    mkLayout('view-hero-trio', 'Hero + Trio', 'Main render with three views', 2, 2,
      [['Main view', R], ['View 2', R], ['View 3', R], ['View 4', R]]),
    mkLayout('view-six', 'Six Views', 'Six-view grid', 3, 2,
      Array.from({ length: 6 }, (_, i) => [`View ${i + 1}`, R] as SlotSpec)),
    mkFree('view-hero-strip', 'Hero + Thumb Strip', 'Hero render over a four-thumb strip', [
      ['Hero view', R, [4, 4, 92, 62]],
      ['View 2', R, [4, 70, 21.5, 26]], ['View 3', R, [27.5, 70, 21.5, 26]],
      ['View 4', R, [51, 70, 21.5, 26]], ['View 5', R, [74.5, 70, 21.5, 26]],
    ]),
    mkFree('view-filmstrip', 'Filmstrip', 'Three full-width cinematic bands', [
      ['View 1', R, [4, 4, 92, 29]], ['View 2', R, [4, 35.5, 92, 29]], ['View 3', R, [4, 67, 92, 29]],
    ]),
    mkFree('view-magazine', 'Magazine Split', 'Feature view with two stacked views', [
      ['Feature view', R, [4, 4, 60, 92]], ['View 2', R, [68, 4, 28, 44]], ['View 3', R, [68, 52, 28, 44]],
    ]),
    mkFree('view-l-comp', 'L Composition', 'Hero with an L of supporting views', [
      ['Hero view', R, [4, 4, 66, 66]], ['View 2', R, [74, 4, 22, 66]],
      ['View 3', R, [4, 74, 30, 22]], ['View 4', R, [38, 74, 32, 22]], ['Caption', D, [74, 74, 22, 22]],
    ]),
  ],
  details: [
    mkLayout('detail-single', 'Single Detail', 'One large detail with notes', 1, 1, [['Detail', DET, '1:5']]),
    mkLayout('detail-duo', 'Two Details', 'Two details side by side', 2, 1, [['Detail 1', DET, '1:10'], ['Detail 2', DET, '1:10']]),
    mkLayout('detail-grid', 'Detail Grid', 'Six details in a grid', 2, 3,
      Array.from({ length: 6 }, (_, i) => [`Detail ${i + 1}`, DET, '1:20'] as SlotSpec)),
    mkFree('detail-annotation', 'Detail + Annotations', 'Drawing with a full annotation column', [
      ['Detail drawing', DET, [4, 8, 58, 86], '1:5'], ['Annotations', D, [66, 8, 30, 86]],
    ]),
    mkFree('detail-wall-strip', 'Wall Section + Junctions', 'Tall wall section with junction details', [
      ['Wall section', DET, [4, 4, 30, 92], '1:20'],
      ['Junction 1', DET, [40, 8, 26, 40], '1:5'], ['Junction 2', DET, [70, 8, 26, 40], '1:5'],
      ['Junction 3', DET, [40, 54, 26, 40], '1:5'], ['Notes', D, [70, 54, 26, 40]],
    ]),
    mkFree('detail-keyplan', 'Key Plan + Details', 'Key plan locating three details', [
      ['Key plan', D, [4, 8, 24, 24], '1:200'], ['Detail 1', DET, [32, 8, 64, 40], '1:10'],
      ['Detail 2', DET, [4, 52, 44, 42], '1:10'], ['Detail 3', DET, [52, 52, 44, 42], '1:10'],
    ]),
  ],
  presentation: [
    mkLayout('board-mix', 'Board Mix', 'Render, plan, section, diagram', 2, 2,
      [['Hero render', R], ['Key plan', P, '1:200'], ['Section', S, '1:200'], ['Concept', D]]),
    mkLayout('board-hero', 'Hero Board', 'One image carries the board', 1, 1, [['Hero', R]]),
    mkFree('board-hero-band', 'Hero + Drawings Band', 'Hero render over plan and section', [
      ['Hero render', R, [4, 4, 92, 48]],
      ['Plan', P, [4, 58, 44, 36], '1:200'], ['Section', S, [52, 58, 44, 36], '1:200'],
    ]),
    mkFree('board-golden', 'Golden Split', 'Feature render with a drawings column', [
      ['Hero render', R, [4, 4, 58, 92]],
      ['Plan', P, [66, 4, 30, 34], '1:200'], ['Section', S, [66, 42, 30, 26], '1:200'], ['Concept', D, [66, 72, 30, 24]],
    ]),
    mkFree('board-tri-panel', 'Tri-Panel', 'Three vertical panels: concept, drawings, views', [
      ['Concept & site', D, [4, 4, 29, 92]], ['Drawings', P, [35.5, 4, 29, 92], '1:200'], ['Views', R, [67, 4, 29, 92]],
    ]),
    mkFree('board-z-flow', 'Z Flow', 'Z-pattern reading: hero → concept → plan → section', [
      ['Hero view', R, [4, 4, 58, 44]], ['Concept', D, [66, 4, 30, 44]],
      ['Plan', P, [4, 52, 30, 42], '1:200'], ['Section', S, [38, 52, 58, 20], '1:200'], ['Detail / view', R, [38, 76, 58, 18]],
    ]),
  ],
}

const GENERIC_LAYOUTS: SheetLayout[] = [
  mkLayout('generic-single', 'Single', 'One large drawing', 1, 1, [['Drawing', ANY]]),
  mkLayout('generic-duo', 'Two Up', 'Two drawings', 2, 1, [['Drawing 1', ANY], ['Drawing 2', ANY]]),
  mkLayout('generic-grid', '2×2 Grid', 'Four drawings', 2, 2,
    [['Drawing 1', ANY], ['Drawing 2', ANY], ['Drawing 3', ANY], ['Drawing 4', ANY]]),
  mkFree('generic-hero-side', 'Hero + Side', 'Main drawing with a support column', [
    ['Main', ANY, [4, 8, 62, 86]], ['Support 1', ANY, [70, 8, 26, 40]], ['Support 2', ANY, [70, 52, 26, 42]],
  ]),
  mkFree('generic-banner', 'Banner + Pair', 'Wide banner over two drawings', [
    ['Banner', ANY, [4, 8, 92, 48]], ['Left', ANY, [4, 60, 44, 34]], ['Right', ANY, [52, 60, 44, 34]],
  ]),
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
  {
    id: 'editorial',
    name: 'Editorial',
    desc: 'Magazine compositions — hero images, asymmetric splits, note columns',
    style: { primaryColor: '#2B2A26', fontFamily: 'Georgia, serif' },
    prefer: {
      cover: 'cover-band-title', site: 'site-map-column', concept: 'concept-hero-notes',
      zoning: 'zoning-band-program', 'master-plan': 'master-context-col', plans: 'plan-hero-details',
      sections: 'section-callouts', elevations: 'elev-hero-details', renders: 'view-magazine',
      details: 'detail-annotation', presentation: 'board-golden',
    },
  },
  {
    id: 'technical',
    name: 'Technical Precise',
    desc: 'Documentation discipline — key plans, callouts, annotation columns',
    style: { primaryColor: '#2F4B7C', fontFamily: 'Inter, sans-serif' },
    prefer: {
      cover: 'cover-minimal', site: 'site-banner-studies', concept: 'concept-timeline',
      zoning: 'zoning-axon-labels', 'master-plan': 'master-sections-band', plans: 'plan-with-key',
      sections: 'section-views-band', elevations: 'elev-strip-key', renders: 'view-filmstrip',
      details: 'detail-keyplan', presentation: 'board-tri-panel',
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
    const pos = slot.frame ?? placeInGrid(i, cols, rows)
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
      const pos = slots[i].frame ?? placeInGrid(i, cols, rows)
      elements.push({ ...el, x: pos.x, y: pos.y, w: pos.w, h: pos.h, z: i })
    } else {
      elements.push(el) // overflow content stays where it was
    }
  })
  for (let i = kept.length; i < slots.length; i++) {
    const pos = slots[i].frame ?? placeInGrid(i, cols, rows)
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
  guideName?: string
  location?: string
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
    guideName: cfg.guideName,
    location: cfg.location,
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
