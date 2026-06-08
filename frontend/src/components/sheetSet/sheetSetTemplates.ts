/**
 * Sheet Set Template Packs
 *
 * THESIS - 28 sheets (complete academic submission)
 * COMPETITION - 3 sheets (presentation boards)
 * STUDIO - 6 sheets (design review)
 */

import type { SheetSetTemplate, SheetLayout } from './sheetSetTypes'

// ─────────────────────────────────────────────────────────────
// SHEET LAYOUTS (Reusable)
// ─────────────────────────────────────────────────────────────

const LAYOUT_TITLE_IMAGE: SheetLayout = {
  id: 'layout-title-image',
  name: 'Title + Image',
  description: 'Title at top, large image below',
  columnCount: 1,
  rowCount: 2,
  gridSize: 'column',
  slotDefinitions: [
    { id: 'title', position: 1, acceptedDrawingTypes: ['diagram'], label: 'Title/Diagram' },
    { id: 'main', position: 2, acceptedDrawingTypes: ['plan', 'render', 'diagram'], label: 'Main Drawing' },
  ],
}

const LAYOUT_DUAL_PLAN_SECTION: SheetLayout = {
  id: 'layout-dual-plan-section',
  name: 'Plan + Section',
  description: 'Plan on left, section on right',
  columnCount: 2,
  rowCount: 1,
  gridSize: 'column',
  slotDefinitions: [
    { id: 'left', position: 1, acceptedDrawingTypes: ['plan'], needsScale: '1:100', label: 'Plan' },
    { id: 'right', position: 2, acceptedDrawingTypes: ['section'], needsScale: '1:100', label: 'Section' },
  ],
}

const LAYOUT_GRID_4: SheetLayout = {
  id: 'layout-grid-4',
  name: '2x2 Grid',
  description: 'Four equal cells',
  columnCount: 2,
  rowCount: 2,
  gridSize: 'modular',
  slotDefinitions: [
    { id: 'tl', position: 1, acceptedDrawingTypes: ['plan', 'section', 'diagram'], label: 'Top Left' },
    { id: 'tr', position: 2, acceptedDrawingTypes: ['plan', 'section', 'diagram'], label: 'Top Right' },
    { id: 'bl', position: 3, acceptedDrawingTypes: ['plan', 'section', 'diagram'], label: 'Bottom Left' },
    { id: 'br', position: 4, acceptedDrawingTypes: ['plan', 'section', 'diagram'], label: 'Bottom Right' },
  ],
}

const LAYOUT_RENDER_FEATURED: SheetLayout = {
  id: 'layout-render-featured',
  name: 'Render Featured',
  description: 'Large render with small diagrams',
  columnCount: 2,
  rowCount: 2,
  gridSize: 'column',
  slotDefinitions: [
    { id: 'main', position: 1, acceptedDrawingTypes: ['render'], label: 'Main Render' },
    { id: 'd1', position: 2, acceptedDrawingTypes: ['diagram'], label: 'Diagram 1' },
    { id: 'd2', position: 3, acceptedDrawingTypes: ['diagram'], label: 'Diagram 2' },
    { id: 'd3', position: 4, acceptedDrawingTypes: ['diagram'], label: 'Diagram 3' },
  ],
}

const LAYOUT_SINGLE_LARGE: SheetLayout = {
  id: 'layout-single-large',
  name: 'Single Large',
  description: 'Full sheet for one large drawing',
  columnCount: 1,
  rowCount: 1,
  gridSize: 'column',
  slotDefinitions: [
    { id: 'main', position: 1, acceptedDrawingTypes: ['plan', 'section', 'elevation', 'render', 'diagram'], label: 'Drawing' },
  ],
}

const LAYOUT_ANALYSIS_GRID: SheetLayout = {
  id: 'layout-analysis-grid',
  name: 'Analysis Grid',
  description: 'Multiple diagrams in grid',
  columnCount: 3,
  rowCount: 3,
  gridSize: 'modular',
  slotDefinitions: Array.from({ length: 9 }, (_, i) => ({
    id: `cell-${i}`,
    position: i + 1,
    acceptedDrawingTypes: ['diagram', 'analysis', 'sketch'],
    label: `Cell ${i + 1}`,
  })),
}

// ─────────────────────────────────────────────────────────────
// THESIS PACK — 28 SHEETS
// ─────────────────────────────────────────────────────────────

export const THESIS_PACK: SheetSetTemplate = {
  id: 'thesis-pack',
  name: 'Thesis Submission Package',
  description: 'Complete academic thesis - 28 sheets covering problem, research, design, and documentation',
  submissionType: 'thesis',
  sheetCount: 28,
  defaultSize: 'A2',
  defaultOrientation: 'portrait',
  sheets: [
    // Cover & Abstract (Sheets 1-2)
    {
      sheetNumber: 1,
      name: 'Cover Sheet',
      type: 'cover',
      description: 'Project title, student name, institution',
      layout: LAYOUT_TITLE_IMAGE,
      slots: [
        { position: 1, needsDrawingType: 'concept' as any, needsScale: '1:1', label: 'Project Concept/Logo' },
        { position: 2, needsDrawingType: 'render' as any, needsScale: '1:1', label: 'Hero Image' },
      ],
      sampleContent: {
        drawings: [{ drawingName: 'Cover', drawingType: 'render', originalScale: '1:1', sheetScale: '1:1', url: '' }],
        diagrams: [],
        text: ['Project Title', 'Student Name', 'Institution'],
      },
    },
    {
      sheetNumber: 2,
      name: 'Abstract',
      type: 'abstract',
      description: 'Project summary and key findings',
      layout: { ...LAYOUT_TITLE_IMAGE, name: 'Text + Diagram' },
      slots: [
        { position: 1, needsDrawingType: 'diagram', label: 'Key Diagram' },
        { position: 2, needsDrawingType: 'diagram', label: 'Supplementary' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: ['Abstract text', 'Key Findings'] },
    },

    // Research & Context (Sheets 3-10)
    {
      sheetNumber: 3,
      name: 'Problem Statement',
      type: 'problem',
      description: 'What problem does the project address?',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Problem ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 4,
      name: 'Aim & Objectives',
      type: 'aim',
      description: 'Goals and measurable objectives',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Objective ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 5,
      name: 'Methodology',
      type: 'methodology',
      description: 'Research approach and methods',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 4 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Method ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(4).fill(''), text: [] },
    },
    {
      sheetNumber: 6,
      name: 'Literature Study',
      type: 'literature',
      description: 'Key references and theoretical framework',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Reference ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 7,
      name: 'Case Study 01',
      type: 'case-study',
      description: 'First case study analysis',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'render', label: 'Project Image' },
        { position: 2, needsDrawingType: 'plan', needsScale: '1:500', label: 'Plan' },
        { position: 3, needsDrawingType: 'diagram', label: 'Analysis 1' },
        { position: 4, needsDrawingType: 'diagram', label: 'Analysis 2' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },
    {
      sheetNumber: 8,
      name: 'Case Study 02',
      type: 'case-study',
      description: 'Second case study analysis',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'render', label: 'Project Image' },
        { position: 2, needsDrawingType: 'plan', needsScale: '1:500', label: 'Plan' },
        { position: 3, needsDrawingType: 'diagram', label: 'Analysis 1' },
        { position: 4, needsDrawingType: 'diagram', label: 'Analysis 2' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },
    {
      sheetNumber: 9,
      name: 'Comparative Analysis',
      type: 'analysis',
      description: 'Comparison of case studies',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 9 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Comparison ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(9).fill(''), text: [] },
    },
    {
      sheetNumber: 10,
      name: 'Site Introduction',
      type: 'site',
      description: 'Location and site context',
      layout: LAYOUT_DUAL_PLAN_SECTION,
      slots: [
        { position: 1, needsDrawingType: 'plan', needsScale: '1:500', label: 'Site Context' },
        { position: 2, needsDrawingType: 'diagram', label: 'Site Analysis' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },

    // Site Analysis (Sheets 11-13)
    {
      sheetNumber: 11,
      name: 'Site Analysis',
      type: 'site',
      description: 'Physical site characteristics',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Analysis ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 12,
      name: 'Climate Analysis',
      type: 'climate',
      description: 'Climate, orientation, environmental factors',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 4 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Climate ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(4).fill(''), text: [] },
    },
    {
      sheetNumber: 13,
      name: 'User Study',
      type: 'user-study',
      description: 'User needs and behavior analysis',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `User Study ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },

    // Concept Development (Sheets 14-17)
    {
      sheetNumber: 14,
      name: 'Area Statement',
      type: 'concept',
      description: 'Statement of area and design intent',
      layout: LAYOUT_TITLE_IMAGE,
      slots: [
        { position: 1, needsDrawingType: 'diagram', label: 'Concept Diagram' },
        { position: 2, needsDrawingType: 'diagram', label: 'Strategy' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: ['Area Statement'] },
    },
    {
      sheetNumber: 15,
      name: 'Concept Development',
      type: 'concept',
      description: 'Design concept evolution',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 9 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'sketch',
        label: `Concept ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(9).fill(''), text: [] },
    },
    {
      sheetNumber: 16,
      name: 'Form Evolution',
      type: 'form',
      description: 'How the form developed',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 8 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Evolution ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(8).fill(''), text: [] },
    },
    {
      sheetNumber: 17,
      name: 'Zoning',
      type: 'zoning',
      description: 'Program and spatial zoning',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'diagram', label: 'Zoning Concept' },
        { position: 2, needsDrawingType: 'diagram', label: 'Program' },
        { position: 3, needsDrawingType: 'diagram', label: 'Circulation' },
        { position: 4, needsDrawingType: 'diagram', label: 'Functions' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },

    // Design Documentation (Sheets 18-25)
    {
      sheetNumber: 18,
      name: 'Master Plan',
      type: 'master-plan',
      description: 'Overall site and building layout',
      layout: LAYOUT_SINGLE_LARGE,
      slots: [{ position: 1, needsDrawingType: 'plan', needsScale: '1:500', label: 'Master Plan' }],
      sampleContent: { drawings: [{ drawingName: 'Master Plan', drawingType: 'plan', originalScale: '1:500', sheetScale: '1:500', url: '' }], diagrams: [], text: [] },
    },
    {
      sheetNumber: 19,
      name: 'Ground Floor Plan',
      type: 'plans',
      description: 'Ground level layout',
      layout: LAYOUT_SINGLE_LARGE,
      slots: [{ position: 1, needsDrawingType: 'plan', needsScale: '1:100', label: 'Ground Floor' }],
      sampleContent: { drawings: [{ drawingName: 'Ground Floor Plan', drawingType: 'plan', originalScale: '1:100', sheetScale: '1:100', url: '' }], diagrams: [], text: [] },
    },
    {
      sheetNumber: 20,
      name: 'Floor Plans',
      type: 'plans',
      description: 'Upper floor layouts',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'plan', needsScale: '1:100', label: 'Floor 1' },
        { position: 2, needsDrawingType: 'plan', needsScale: '1:100', label: 'Floor 2' },
        { position: 3, needsDrawingType: 'plan', needsScale: '1:100', label: 'Floor 3' },
        { position: 4, needsDrawingType: 'plan', needsScale: '1:100', label: 'Floor 4' },
      ],
      sampleContent: { drawings: Array(4).fill({ drawingName: 'Plan', drawingType: 'plan', originalScale: '1:100', sheetScale: '1:100', url: '' }), diagrams: [], text: [] },
    },
    {
      sheetNumber: 21,
      name: 'Sections',
      type: 'sections',
      description: 'Building sections',
      layout: LAYOUT_DUAL_PLAN_SECTION,
      slots: [
        { position: 1, needsDrawingType: 'section', needsScale: '1:100', label: 'Section A' },
        { position: 2, needsDrawingType: 'section', needsScale: '1:100', label: 'Section B' },
      ],
      sampleContent: { drawings: Array(2).fill({ drawingName: 'Section', drawingType: 'section', originalScale: '1:100', sheetScale: '1:100', url: '' }), diagrams: [], text: [] },
    },
    {
      sheetNumber: 22,
      name: 'Elevations',
      type: 'elevations',
      description: 'Building facades',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'elevation', needsScale: '1:100', label: 'Front' },
        { position: 2, needsDrawingType: 'elevation', needsScale: '1:100', label: 'Side' },
        { position: 3, needsDrawingType: 'elevation', needsScale: '1:100', label: 'Back' },
        { position: 4, needsDrawingType: 'elevation', needsScale: '1:100', label: 'Side' },
      ],
      sampleContent: { drawings: Array(4).fill({ drawingName: 'Elevation', drawingType: 'elevation', originalScale: '1:100', sheetScale: '1:100', url: '' }), diagrams: [], text: [] },
    },
    {
      sheetNumber: 23,
      name: 'Details',
      type: 'details',
      description: 'Construction details',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'detail',
        needsScale: '1:20',
        label: `Detail ${i + 1}`,
      })),
      sampleContent: { drawings: Array(6).fill({ drawingName: 'Detail', drawingType: 'detail', originalScale: '1:20', sheetScale: '1:20', url: '' }), diagrams: [], text: [] },
    },
    {
      sheetNumber: 24,
      name: 'Structural System',
      type: 'structural',
      description: 'Structure and materials',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Structure ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 25,
      name: 'Services',
      type: 'services',
      description: 'MEP systems',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 4 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `System ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(4).fill(''), text: [] },
    },

    // Presentation (Sheets 26-28)
    {
      sheetNumber: 26,
      name: 'Sustainability',
      type: 'sustainability',
      description: 'Green strategies and performance',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Strategy ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 27,
      name: 'Interior & Exterior Views',
      type: 'exterior',
      description: 'Rendered perspectives',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'render', label: 'Exterior 1' },
        { position: 2, needsDrawingType: 'render', label: 'Exterior 2' },
        { position: 3, needsDrawingType: 'render', label: 'Interior 1' },
        { position: 4, needsDrawingType: 'render', label: 'Interior 2' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },
    {
      sheetNumber: 28,
      name: 'Final Presentation',
      type: 'presentation',
      description: 'Project summary board',
      layout: LAYOUT_RENDER_FEATURED,
      slots: [
        { position: 1, needsDrawingType: 'render', label: 'Hero Render' },
        { position: 2, needsDrawingType: 'diagram', label: 'Key Concept' },
        { position: 3, needsDrawingType: 'diagram', label: 'Key Stats' },
        { position: 4, needsDrawingType: 'diagram', label: 'Next Steps' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },
  ],
  style: {
    primaryColor: '#1a1a1a',
    fontFamily: 'Inter, sans-serif',
    description: 'Clean academic style - professional and organized',
  },
  requirements: {
    plans: 8,
    sections: 3,
    elevations: 4,
    renders: 6,
    diagrams: 20,
  },
  preview: {
    thumbnails: ['sheet-01.jpg', 'sheet-18.jpg', 'sheet-28.jpg'],
    description: 'Complete thesis - cover, research, design documentation, renders',
  },
}

// ─────────────────────────────────────────────────────────────
// COMPETITION PACK — 3 SHEETS
// ─────────────────────────────────────────────────────────────

export const COMPETITION_PACK: SheetSetTemplate = {
  id: 'competition-pack',
  name: 'Competition Boards',
  description: 'Professional competition submission - 3 high-impact presentation boards',
  submissionType: 'competition',
  sheetCount: 3,
  defaultSize: 'A1',
  defaultOrientation: 'portrait',
  sheets: [
    {
      sheetNumber: 1,
      name: 'Hero Presentation Board',
      type: 'hero-board',
      description: 'Compelling project overview with hero image',
      layout: LAYOUT_RENDER_FEATURED,
      slots: [
        { position: 1, needsDrawingType: 'render', label: 'Hero Image' },
        { position: 2, needsDrawingType: 'diagram', label: 'Concept' },
        { position: 3, needsDrawingType: 'diagram', label: 'Key Stats' },
        { position: 4, needsDrawingType: 'diagram', label: 'Innovation' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: ['Project Title', 'Team Name'] },
    },
    {
      sheetNumber: 2,
      name: 'Technical Board',
      type: 'technical-board',
      description: 'Plans, sections, elevations - technical proof',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: i < 3 ? 'plan' : 'section',
        needsScale: '1:200',
        label: `Drawing ${i + 1}`,
      })),
      sampleContent: {
        drawings: Array(6).fill({
          drawingName: 'Technical',
          drawingType: 'plan',
          originalScale: '1:200',
          sheetScale: '1:200',
          url: '',
        }),
        diagrams: [],
        text: [],
      },
    },
    {
      sheetNumber: 3,
      name: 'Experience Board',
      type: 'experience-board',
      description: 'User experience and context visualization',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'render', label: 'View 1' },
        { position: 2, needsDrawingType: 'render', label: 'View 2' },
        { position: 3, needsDrawingType: 'diagram', label: 'Context' },
        { position: 4, needsDrawingType: 'diagram', label: 'Impact' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },
  ],
  style: {
    primaryColor: '#000000',
    fontFamily: 'Helvetica, Arial, sans-serif',
    description: 'Bold, high-impact competition boards - maximum visual impact',
  },
  requirements: {
    plans: 2,
    sections: 2,
    elevations: 0,
    renders: 4,
    diagrams: 5,
  },
  preview: {
    thumbnails: ['comp-01.jpg', 'comp-02.jpg', 'comp-03.jpg'],
    description: 'Hero presentation + technical proof + experience story',
  },
}

// ─────────────────────────────────────────────────────────────
// STUDIO PACK — 6 SHEETS
// ─────────────────────────────────────────────────────────────

export const STUDIO_PACK: SheetSetTemplate = {
  id: 'studio-pack',
  name: 'Studio Review Package',
  description: 'Design studio review - 6 sheets covering concept through presentation',
  submissionType: 'studio-review',
  sheetCount: 6,
  defaultSize: 'A2',
  defaultOrientation: 'portrait',
  sheets: [
    {
      sheetNumber: 1,
      name: 'Concept',
      type: 'concept',
      description: 'Design concept and site understanding',
      layout: LAYOUT_DUAL_PLAN_SECTION,
      slots: [
        { position: 1, needsDrawingType: 'diagram', label: 'Site Concept' },
        { position: 2, needsDrawingType: 'diagram', label: 'Design Strategy' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: ['Concept Title'] },
    },
    {
      sheetNumber: 2,
      name: 'Site Analysis',
      type: 'site',
      description: 'Site conditions and analysis',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'diagram',
        label: `Analysis ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 3,
      name: 'Design Development',
      type: 'form',
      description: 'Design evolution and options',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: 'sketch',
        label: `Option ${i + 1}`,
      })),
      sampleContent: { drawings: [], diagrams: Array(6).fill(''), text: [] },
    },
    {
      sheetNumber: 4,
      name: 'Plans',
      type: 'plans',
      description: 'Building plans at multiple scales',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'plan', needsScale: '1:500', label: 'Site Plan' },
        { position: 2, needsDrawingType: 'plan', needsScale: '1:200', label: 'Ground Floor' },
        { position: 3, needsDrawingType: 'plan', needsScale: '1:200', label: 'Upper Floor' },
        { position: 4, needsDrawingType: 'plan', needsScale: '1:500', label: 'Context' },
      ],
      sampleContent: {
        drawings: Array(4).fill({
          drawingName: 'Plan',
          drawingType: 'plan',
          originalScale: '1:200',
          sheetScale: '1:200',
          url: '',
        }),
        diagrams: [],
        text: [],
      },
    },
    {
      sheetNumber: 5,
      name: 'Sections + Elevations',
      type: 'sections',
      description: 'Cross-sections and facades',
      layout: LAYOUT_ANALYSIS_GRID,
      slots: Array.from({ length: 6 }, (_, i) => ({
        position: i + 1,
        needsDrawingType: i < 3 ? 'section' : 'elevation',
        needsScale: '1:200',
        label: `Drawing ${i + 1}`,
      })),
      sampleContent: {
        drawings: Array(6).fill({
          drawingName: 'Section/Elevation',
          drawingType: 'section',
          originalScale: '1:200',
          sheetScale: '1:200',
          url: '',
        }),
        diagrams: [],
        text: [],
      },
    },
    {
      sheetNumber: 6,
      name: 'Renders',
      type: 'renders',
      description: 'Perspective views and visualization',
      layout: LAYOUT_GRID_4,
      slots: [
        { position: 1, needsDrawingType: 'render', label: 'Exterior View 1' },
        { position: 2, needsDrawingType: 'render', label: 'Exterior View 2' },
        { position: 3, needsDrawingType: 'render', label: 'Interior View 1' },
        { position: 4, needsDrawingType: 'render', label: 'Interior View 2' },
      ],
      sampleContent: { drawings: [], diagrams: [], text: [] },
    },
  ],
  style: {
    primaryColor: '#1a1a1a',
    fontFamily: 'Inter, sans-serif',
    description: 'Clean studio presentation - professional and well-organized',
  },
  requirements: {
    plans: 4,
    sections: 3,
    elevations: 4,
    renders: 4,
    diagrams: 12,
  },
  preview: {
    thumbnails: ['studio-01.jpg', 'studio-04.jpg', 'studio-06.jpg'],
    description: 'Concept → site analysis → design development → documentation → renders',
  },
}

// ─────────────────────────────────────────────────────────────
// ALL TEMPLATES
// ─────────────────────────────────────────────────────────────

export const SHEET_SET_TEMPLATES: SheetSetTemplate[] = [THESIS_PACK, COMPETITION_PACK, STUDIO_PACK]

export function getTemplateById(id: string): SheetSetTemplate | undefined {
  return SHEET_SET_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesBySubmissionType(type: any): SheetSetTemplate[] {
  return SHEET_SET_TEMPLATES.filter(t => t.submissionType === type)
}
