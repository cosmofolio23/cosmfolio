'use client'

/**
 * SpreadComposer — true two-page spread canvas.
 *
 * Renders a single 1520px-wide canvas (2× a normal 760px page) using the
 * standard 12-column grid.  The left half (cols 1-6) maps to the left PDF
 * page; the right half (cols 7-12) maps to the right PDF page.  A subtle
 * dashed gutter guide marks the split at 50%.
 *
 * Accepts the same props as PageComposer — internally it doubles the
 * pageSize width so the aspect ratio is correct, then delegates all
 * rendering to PageComposer.
 */

import PageComposer from './PageComposer'
import type { Page, DesignTokens, FreeElement } from './types'
import type { BackgroundLayer, MasterElement, GridSettings, PageSize } from './publishingTypes'
import type { PageContext } from './PublishingLayers'

interface Props {
  page: Page
  tokens: DesignTokens
  onChange: (page: Page) => void
  onUploadImage?: (file: File) => Promise<string>
  backgrounds?: BackgroundLayer[]
  masterElements?: MasterElement[]
  pageContext?: PageContext
  grid?: GridSettings
  onFreeChange?: (els: FreeElement[]) => void
  editableFree?: boolean
  onApplyScope?: (scope: 'page' | 'spread' | 'all', el: FreeElement) => void
  onFreeSelectionChange?: (el: FreeElement | null) => void
  pages?: Page[]
  onUpdateGlobalPages?: (updater: (pages: Page[]) => Page[]) => void
  overflowVisible?: boolean
  onUpdateMasterElement?: (id: string, patch: Partial<MasterElement>) => void
  /** Base page size (single page). SpreadComposer doubles the width. */
  pageSize?: PageSize
  showWatermark?: boolean
  /** Show edit annotations (gutter line, page labels) */
  editMode?: boolean
}

export default function SpreadComposer({
  pageSize,
  editMode = true,
  ...rest
}: Props) {
  // Double the width so PageComposer's aspect-ratio covers 2 pages side-by-side
  const spreadSize: PageSize = pageSize
    ? { ...pageSize, width: pageSize.width * 2 }
    : { preset: 'custom', name: 'A4 Spread', width: 420, height: 297 }

  return (
    <div className="relative w-full">
      {/* Gutter guide — visible in edit mode only */}
      {editMode && (
        <div
          className="absolute top-0 bottom-0 z-50 pointer-events-none"
          style={{ left: '50%', transform: 'translateX(-50%)', width: 2 }}
        >
          <div className="w-full h-full border-l-2 border-dashed border-blue-400/60" />
          {/* Page labels */}
          <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider select-none whitespace-nowrap">
            Right Page →
          </div>
          <div className="absolute top-2 left-auto right-full mr-2 bg-blue-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider select-none whitespace-nowrap">
            ← Left Page
          </div>
        </div>
      )}

      <PageComposer
        {...rest}
        pageSize={spreadSize}
      />
    </div>
  )
}
