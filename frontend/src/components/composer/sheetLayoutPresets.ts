import type { MasterPage, MasterElement } from './publishingTypes'

export interface SheetLayoutPreset {
  id: string
  name: string
  description: string
  category: 'Minimal' | 'Academic' | 'Brutalist' | 'Corporate'
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  elements: MasterElement[]
}

export const SHEET_LAYOUT_PRESETS: SheetLayoutPreset[] = [
  {
    id: 'minimal-a4-hairline',
    name: 'Minimal Hairline',
    description: 'Thin elegant footer line with page number and title block.',
    category: 'Minimal',
    marginTop: 12,
    marginBottom: 16,
    marginLeft: 12,
    marginRight: 12,
    elements: [
      {
        id: 'me-min-line',
        type: 'line',
        position: 'bottom-left',
        x: 12,
        y: 198,
        width: 273, // mm (for A4 Landscape)
        height: 1,
        color: '#E2E8F0',
        opacity: 0.8
      },
      {
        id: 'me-min-title',
        type: 'text',
        position: 'bottom-left',
        textTemplate: '${projectTitle}',
        fontSize: 10,
        fontFamily: 'Inter',
        color: '#64748B',
        opacity: 0.9
      },
      {
        id: 'me-min-num',
        type: 'text',
        position: 'bottom-right',
        textTemplate: 'Page ${pageNumber}',
        fontSize: 10,
        fontFamily: 'Inter',
        color: '#64748B',
        opacity: 0.9
      }
    ]
  },
  {
    id: 'academic-grid-margins',
    name: 'Academic Header Grid',
    description: 'Structured top header with divider and clean typography.',
    category: 'Academic',
    marginTop: 20,
    marginBottom: 16,
    marginLeft: 16,
    marginRight: 16,
    elements: [
      {
        id: 'me-acad-header-title',
        type: 'text',
        position: 'top-left',
        textTemplate: '${projectTitle} — Design Intent',
        fontSize: 11,
        fontFamily: 'Georgia',
        color: '#1E293B',
        opacity: 1
      },
      {
        id: 'me-acad-header-num',
        type: 'text',
        position: 'top-right',
        textTemplate: 'SPREAD ${pageNumber}',
        fontSize: 10,
        fontFamily: 'Inter',
        color: '#475569',
        opacity: 0.9
      },
      {
        id: 'me-acad-divider',
        type: 'line',
        position: 'top-left',
        x: 16,
        y: 16,
        width: 265,
        height: 1.5,
        color: '#475569',
        opacity: 1
      }
    ]
  },
  {
    id: 'brutalist-heavy-border',
    name: 'Brutalist Stark Frame',
    description: 'Heavy graphic border frame with a concrete block aesthetic.',
    category: 'Brutalist',
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    elements: [
      {
        id: 'me-brutalist-border',
        type: 'shape',
        position: 'center',
        width: 297 - 10, // A4 Landscape size minus 10mm border
        height: 210 - 10,
        strokeWidth: 3,
        strokeColor: '#090D16',
        opacity: 1
      },
      {
        id: 'me-brutalist-num-bg',
        type: 'shape',
        position: 'bottom-right',
        x: 275,
        y: 188,
        width: 20,
        height: 20,
        color: '#090D16',
        opacity: 1
      },
      {
        id: 'me-brutalist-num-text',
        type: 'text',
        position: 'bottom-right',
        textTemplate: '${pageNumber}',
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#FFFFFF',
        opacity: 1
      }
    ]
  },
  {
    id: 'commercial-corporate',
    name: 'Corporate CAD Sidebar',
    description: 'Legend title block column along the right side of the sheet.',
    category: 'Corporate',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 50, // Extra margin on the right for the sidebar
    elements: [
      {
        id: 'me-corp-sidebar-line',
        type: 'line',
        position: 'top-right',
        x: 247, // 50mm from right edge
        y: 10,
        width: 1,
        height: 190,
        color: '#CBD5E1',
        opacity: 1
      },
      {
        id: 'me-corp-firm-label',
        type: 'text',
        position: 'bottom-right',
        x: 252,
        y: 120,
        textTemplate: 'COSMO ATELIER',
        fontSize: 12,
        fontFamily: 'Inter',
        color: '#0F172A',
        opacity: 1
      },
      {
        id: 'me-corp-proj-label',
        type: 'text',
        position: 'bottom-right',
        x: 252,
        y: 140,
        textTemplate: 'PROJ: ${projectTitle}',
        fontSize: 10,
        fontFamily: 'Inter',
        color: '#334155',
        opacity: 0.9
      },
      {
        id: 'me-corp-scale-label',
        type: 'text',
        position: 'bottom-right',
        x: 252,
        y: 160,
        textTemplate: 'SCALE: As Noted',
        fontSize: 9,
        fontFamily: 'Inter',
        color: '#64748B',
        opacity: 0.8
      },
      {
        id: 'me-corp-sheet-num',
        type: 'text',
        position: 'bottom-right',
        x: 252,
        y: 180,
        textTemplate: 'SHEET NO: A-0${pageNumber}',
        fontSize: 11,
        fontFamily: 'Inter',
        color: '#0F172A',
        opacity: 1
      }
    ]
  }
]
