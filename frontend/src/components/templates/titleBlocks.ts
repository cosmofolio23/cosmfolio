/**
 * Master Title Block library — 56 reusable title-block designs across 8
 * categories (Minimal, Luxury, Magazine, Competition, Academic, Bold,
 * Parametric, Corporate). Each is a parametric style interpreted by
 * TitleBlockView; font, colour, size and position remain editable.
 *
 * Roles: number (PROJECT 01), title (CULTURAL CENTER), subline (typology · year).
 */

export type TitleBlockCategory =
  | 'Minimal' | 'Luxury' | 'Magazine' | 'Competition'
  | 'Academic' | 'Bold' | 'Parametric' | 'Corporate'

export const TITLE_BLOCK_CATEGORIES: TitleBlockCategory[] = [
  'Minimal', 'Luxury', 'Magazine', 'Competition', 'Academic', 'Bold', 'Parametric', 'Corporate',
]

export interface TitleBlockStyle {
  id: string
  name: string
  category: TitleBlockCategory
  align: 'left' | 'center' | 'right'
  numberStyle: 'none' | 'big' | 'chip' | 'slash' | 'outline' | 'dot' | 'prefix'
  rule: 'none' | 'over' | 'under' | 'left' | 'box' | 'split' | 'double' | 'corner'
  caps: boolean
  weight: 300 | 400 | 600 | 800
  tracking: number          // title letter-spacing in em
  accentBar: boolean        // a coloured accent bar near the title
  fill: 'none' | 'accent' | 'tint' | 'dark'
  subline: 'plain' | 'caps' | 'divider' | 'spaced'
}

let _n = 0
const mk = (
  category: TitleBlockCategory, name: string,
  o: Partial<TitleBlockStyle>,
): TitleBlockStyle => ({
  id: `tb-${category.toLowerCase()}-${_n++}`,
  name, category,
  align: o.align ?? 'left',
  numberStyle: o.numberStyle ?? 'none',
  rule: o.rule ?? 'none',
  caps: o.caps ?? false,
  weight: o.weight ?? 600,
  tracking: o.tracking ?? 0,
  accentBar: o.accentBar ?? false,
  fill: o.fill ?? 'none',
  subline: o.subline ?? 'plain',
})

export const TITLE_BLOCKS: TitleBlockStyle[] = [
  // ---- Minimal ----
  mk('Minimal', 'Hairline Left', { align: 'left', rule: 'under', weight: 300, tracking: 0.02, subline: 'spaced' }),
  mk('Minimal', 'Quiet Center', { align: 'center', weight: 300, tracking: 0.04, subline: 'spaced' }),
  mk('Minimal', 'Number Dot', { align: 'left', numberStyle: 'dot', weight: 400, subline: 'plain' }),
  mk('Minimal', 'Thin Caps', { align: 'left', caps: true, weight: 300, tracking: 0.16, subline: 'caps' }),
  mk('Minimal', 'Over Rule', { align: 'left', rule: 'over', weight: 400, subline: 'divider' }),
  mk('Minimal', 'Right Align', { align: 'right', weight: 300, tracking: 0.02, subline: 'spaced' }),
  mk('Minimal', 'Bare Stack', { align: 'left', weight: 400, subline: 'plain' }),

  // ---- Luxury ----
  mk('Luxury', 'Serif Gold Bar', { align: 'left', accentBar: true, weight: 400, tracking: 0.03, subline: 'spaced' }),
  mk('Luxury', 'Centered Crest', { align: 'center', rule: 'split', weight: 400, caps: true, tracking: 0.18, subline: 'spaced' }),
  mk('Luxury', 'Double Rule', { align: 'center', rule: 'double', weight: 300, tracking: 0.08, subline: 'caps' }),
  mk('Luxury', 'Slash Numeral', { align: 'left', numberStyle: 'slash', weight: 400, tracking: 0.02, subline: 'divider' }),
  mk('Luxury', 'Tint Plate', { align: 'left', fill: 'tint', weight: 400, accentBar: true, subline: 'spaced' }),
  mk('Luxury', 'Outline Number', { align: 'left', numberStyle: 'outline', weight: 300, tracking: 0.04, subline: 'caps' }),
  mk('Luxury', 'Editorial Serif', { align: 'left', weight: 400, tracking: 0.01, rule: 'left', subline: 'spaced' }),

  // ---- Magazine ----
  mk('Magazine', 'Masthead Caps', { align: 'left', caps: true, weight: 800, tracking: -0.01, subline: 'caps' }),
  mk('Magazine', 'Big Number', { align: 'left', numberStyle: 'big', weight: 800, subline: 'divider' }),
  mk('Magazine', 'Split Header', { align: 'left', rule: 'split', weight: 600, caps: true, subline: 'spaced' }),
  mk('Magazine', 'Kicker + Title', { align: 'left', numberStyle: 'prefix', weight: 800, subline: 'caps' }),
  mk('Magazine', 'Center Feature', { align: 'center', weight: 800, caps: true, tracking: -0.02, subline: 'caps' }),
  mk('Magazine', 'Boxed Kicker', { align: 'left', numberStyle: 'chip', weight: 600, subline: 'plain' }),
  mk('Magazine', 'Underline Bold', { align: 'left', rule: 'under', weight: 800, subline: 'divider' }),

  // ---- Competition ----
  mk('Competition', 'Slab Fill', { align: 'left', fill: 'accent', caps: true, weight: 800, tracking: 0.02, subline: 'caps' }),
  mk('Competition', 'Code + Title', { align: 'left', numberStyle: 'chip', caps: true, weight: 800, subline: 'caps' }),
  mk('Competition', 'Corner Mark', { align: 'left', rule: 'corner', weight: 600, caps: true, subline: 'spaced' }),
  mk('Competition', 'Dark Band', { align: 'left', fill: 'dark', weight: 800, caps: true, subline: 'caps' }),
  mk('Competition', 'Giant Index', { align: 'left', numberStyle: 'big', weight: 800, caps: true, subline: 'divider' }),
  mk('Competition', 'Box Frame', { align: 'center', rule: 'box', weight: 600, caps: true, subline: 'caps' }),
  mk('Competition', 'Accent Bar Bold', { align: 'left', accentBar: true, weight: 800, caps: true, subline: 'caps' }),

  // ---- Academic ----
  mk('Academic', 'Footnote Style', { align: 'left', weight: 400, rule: 'over', subline: 'plain' }),
  mk('Academic', 'Numbered Heading', { align: 'left', numberStyle: 'prefix', weight: 600, subline: 'plain' }),
  mk('Academic', 'Serif Label', { align: 'left', weight: 400, tracking: 0.01, subline: 'divider' }),
  mk('Academic', 'Left Rule', { align: 'left', rule: 'left', weight: 400, subline: 'plain' }),
  mk('Academic', 'Caps Section', { align: 'left', caps: true, weight: 600, tracking: 0.1, subline: 'caps' }),
  mk('Academic', 'Centered Plate', { align: 'center', weight: 400, rule: 'under', subline: 'spaced' }),
  mk('Academic', 'Dot Index', { align: 'left', numberStyle: 'dot', weight: 400, subline: 'plain' }),

  // ---- Bold ----
  mk('Bold', 'Heavy Stack', { align: 'left', weight: 800, tracking: -0.02, subline: 'caps' }),
  mk('Bold', 'Fill Block', { align: 'left', fill: 'accent', weight: 800, subline: 'plain' }),
  mk('Bold', 'Mega Number', { align: 'left', numberStyle: 'big', weight: 800, subline: 'divider' }),
  mk('Bold', 'Caps Slam', { align: 'center', caps: true, weight: 800, tracking: 0.02, subline: 'caps' }),
  mk('Bold', 'Dark Plate', { align: 'left', fill: 'dark', weight: 800, subline: 'caps' }),
  mk('Bold', 'Bar + Heavy', { align: 'left', accentBar: true, weight: 800, subline: 'divider' }),
  mk('Bold', 'Outline Punch', { align: 'left', numberStyle: 'outline', weight: 800, subline: 'plain' }),

  // ---- Parametric ----
  mk('Parametric', 'Mono Code', { align: 'left', numberStyle: 'slash', weight: 400, tracking: 0.05, subline: 'spaced' }),
  mk('Parametric', 'Grid Tick', { align: 'left', rule: 'corner', weight: 400, tracking: 0.04, subline: 'divider' }),
  mk('Parametric', 'Coordinate', { align: 'left', numberStyle: 'prefix', weight: 400, tracking: 0.06, subline: 'spaced' }),
  mk('Parametric', 'Wireframe Box', { align: 'left', rule: 'box', weight: 400, tracking: 0.03, subline: 'caps' }),
  mk('Parametric', 'Data Label', { align: 'left', numberStyle: 'chip', weight: 400, tracking: 0.04, subline: 'spaced' }),
  mk('Parametric', 'Split Mono', { align: 'left', rule: 'split', weight: 400, tracking: 0.05, subline: 'divider' }),
  mk('Parametric', 'Vector North', { align: 'right', numberStyle: 'dot', weight: 400, tracking: 0.04, subline: 'spaced' }),

  // ---- Corporate ----
  mk('Corporate', 'Clean Header', { align: 'left', weight: 600, rule: 'under', subline: 'plain' }),
  mk('Corporate', 'Brand Bar', { align: 'left', accentBar: true, weight: 600, subline: 'plain' }),
  mk('Corporate', 'Tint Banner', { align: 'left', fill: 'tint', weight: 600, subline: 'plain' }),
  mk('Corporate', 'Right Meta', { align: 'right', weight: 600, subline: 'divider' }),
  mk('Corporate', 'Chip Index', { align: 'left', numberStyle: 'chip', weight: 600, subline: 'plain' }),
  mk('Corporate', 'Centered Brand', { align: 'center', weight: 600, rule: 'split', subline: 'caps' }),
  mk('Corporate', 'Boxed Card', { align: 'left', rule: 'box', weight: 600, subline: 'plain' }),
]

export const TITLE_BLOCK_COUNT = TITLE_BLOCKS.length
