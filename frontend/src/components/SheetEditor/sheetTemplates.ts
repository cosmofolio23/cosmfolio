/**
 * Sheet template presets — pre-arranged element layouts for common
 * architecture presentation sheets. Applying one replaces the canvas elements
 * with placeholders the user then fills (images show "Drop image here").
 *
 * Coordinates are percentages of the sheet (0–100), matching SheetElement.
 */

import type { ElementKind, ElementStyle } from './SheetEditor'

export interface TemplateEl {
  kind: ElementKind
  x: number; y: number; w: number; h: number
  content?: string
  style?: ElementStyle
}

export interface SheetTemplate {
  id: string
  name: string
  icon: string
  description: string
  els: TemplateEl[]
}

const title = (x: number, y: number, w: number, h: number, content = 'Project Title'): TemplateEl =>
  ({ kind: 'title', x, y, w, h, content, style: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a' } })
const caption = (x: number, y: number, w: number, h: number, content = 'Short description / concept statement goes here.'): TemplateEl =>
  ({ kind: 'caption', x, y, w, h, content, style: { fontSize: 13, color: '#444' } })
const img = (x: number, y: number, w: number, h: number, content = 'Image'): TemplateEl =>
  ({ kind: 'image', x, y, w, h, content })

export const SHEET_TEMPLATES: SheetTemplate[] = [
  {
    id: 'concept', name: 'Concept', icon: '💡', description: 'Hero image + concept text',
    els: [
      title(5, 5, 60, 8, 'Concept'),
      img(5, 16, 50, 64, 'Hero Image'),
      img(57, 16, 38, 30, 'Detail'),
      img(57, 48, 38, 22, 'Diagram'),
      caption(5, 83, 90, 13),
    ],
  },
  {
    id: 'renders', name: 'Render Grid', icon: '🖼️', description: 'Hero render + thumbnails',
    els: [
      title(5, 4, 60, 8, 'Renders'),
      img(5, 14, 60, 50, 'Main Render'),
      img(67, 14, 28, 24, 'View'),
      img(67, 40, 28, 24, 'View'),
      img(5, 66, 28, 28, 'View'),
      img(35, 66, 28, 28, 'View'),
      img(65, 66, 30, 28, 'View'),
    ],
  },
  {
    id: 'floor_plans', name: 'Floor Plans', icon: '📐', description: '2×2 plans + north + scale',
    els: [
      title(5, 4, 60, 8, 'Floor Plans'),
      img(5, 14, 43, 38, 'Ground Floor'),
      img(52, 14, 43, 38, 'First Floor'),
      img(5, 54, 43, 36, 'Roof Plan'),
      img(52, 54, 43, 36, 'Section'),
      { kind: 'north_arrow', x: 88, y: 90, w: 8, h: 9, content: '' },
      { kind: 'scale_bar', x: 5, y: 92, w: 30, h: 5, content: '' },
    ],
  },
  {
    id: 'site_analysis', name: 'Site Analysis', icon: '🗺️', description: 'Site map + callouts',
    els: [
      title(5, 4, 60, 8, 'Site Analysis'),
      img(5, 14, 62, 78, 'Site Map'),
      img(69, 14, 26, 24, 'Context'),
      img(69, 40, 26, 24, 'Access'),
      img(69, 66, 26, 26, 'Climate'),
      { kind: 'north_arrow', x: 58, y: 16, w: 8, h: 9, content: '' },
    ],
  },
  {
    id: 'details', name: 'Details', icon: '🔍', description: '3×2 detail grid',
    els: [
      title(5, 4, 60, 8, 'Construction Details'),
      img(5, 14, 29, 38, 'Detail 01'), img(36, 14, 29, 38, 'Detail 02'), img(67, 14, 28, 38, 'Detail 03'),
      img(5, 54, 29, 38, 'Detail 04'), img(36, 54, 29, 38, 'Detail 05'), img(67, 54, 28, 38, 'Detail 06'),
    ],
  },
  {
    id: 'process', name: 'Process', icon: '⚙️', description: 'Timeline of iterations',
    els: [
      title(5, 4, 60, 8, 'Design Process'),
      img(5, 22, 21, 44, 'Step 1'),
      { kind: 'arrow', x: 26, y: 42, w: 4, h: 6, content: '', style: { borderColor: '#1a1a1a', borderWidth: 2 } },
      img(28, 22, 21, 44, 'Step 2'),
      { kind: 'arrow', x: 49, y: 42, w: 4, h: 6, content: '', style: { borderColor: '#1a1a1a', borderWidth: 2 } },
      img(51, 22, 21, 44, 'Step 3'),
      { kind: 'arrow', x: 72, y: 42, w: 4, h: 6, content: '', style: { borderColor: '#1a1a1a', borderWidth: 2 } },
      img(74, 22, 21, 44, 'Step 4'),
      caption(5, 70, 90, 16),
    ],
  },
]
