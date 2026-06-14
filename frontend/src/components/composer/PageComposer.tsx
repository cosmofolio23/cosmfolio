'use client'

import type { Block, Page, DesignTokens, BlockType } from './types'
import { allImages, createBlock } from './types'
import { getSpec, type LayoutSpec, type Region, type RegionRole } from './layoutSpecs'
import {
  ImageBlock, LegendBlock, MetaBlock, TitleBlock, SubtitleBlock, DescriptionBlock, pickContrast,
} from './Blocks'
import { TitleBlockView } from '@/components/templates/TitleBlockView'
import { TITLE_BLOCKS } from '@/components/templates/titleBlocks'
import type { DemoPalette } from '@/components/templates/demoArt'

const toPalette = (t: DesignTokens): DemoPalette => ({
  primary: t.primary, accent: t.accent, bg: t.background, text: t.text, muted: t.muted,
})

interface Props {
  page: Page
  tokens: DesignTokens
  onChange: (page: Page) => void
  onUploadImage?: (file: File) => Promise<string>
}

const ROLE_TO_TYPE: Record<Exclude<RegionRole, 'image'>, BlockType> = {
  title: 'title', subtitle: 'subtitle', text: 'description', legend: 'legend', meta: 'meta',
}

export default function PageComposer({ page, tokens, onChange, onUploadImage }: Props) {
  const spec = getSpec(page.layoutId)
  const images = allImages(page.blocks)
  const titleBlock = page.titleBlockId ? TITLE_BLOCKS.find(b => b.id === page.titleBlockId) : undefined

  const patchBlock = (id: string, patch: Partial<Block>) =>
    onChange({ ...page, blocks: page.blocks.map(b => b.id === id ? { ...b, ...patch } : b) })

  const addBlock = (type: BlockType): Block => {
    const block = createBlock(type)
    onChange({ ...page, blocks: [...page.blocks, block] })
    return block
  }

  const firstOfType = (type: BlockType) => page.blocks.find(b => b.type === type)

  const overlay = spec.kind === 'overlay'

  return (
    <div
      className="relative w-full mx-auto shadow-2xl"
      style={{ background: tokens.background, color: tokens.text, fontFamily: tokens.bodyFont, aspectRatio: '210 / 297', maxWidth: 760 }}
    >
      <div
        className="absolute inset-0 grid p-6"
        style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)', gap: 8 }}
      >
        {spec.regions.map((region, i) => (
          <RegionView
            key={i}
            region={region}
            spec={spec}
            tokens={tokens}
            overlay={overlay}
            images={images}
            patchBlock={patchBlock}
            addBlock={addBlock}
            firstOfType={firstOfType}
            onUploadImage={onUploadImage}
            titleBlock={titleBlock}
          />
        ))}
      </div>

      {/* gradient scrim for overlay covers */}
      {overlay && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
      )}
    </div>
  )
}

function gridStyle(r: Region): React.CSSProperties {
  return { gridColumn: `${r.c0} / span ${r.cs}`, gridRow: `${r.r0} / span ${r.rs}`, minHeight: 0, minWidth: 0 }
}

function RegionView({
  region, spec, tokens, overlay, images, patchBlock, addBlock, firstOfType, onUploadImage, titleBlock,
}: {
  region: Region
  spec: LayoutSpec
  tokens: DesignTokens
  overlay: boolean
  images: Block[]
  patchBlock: (id: string, patch: Partial<Block>) => void
  addBlock: (type: BlockType) => Block
  firstOfType: (type: BlockType) => Block | undefined
  onUploadImage?: (file: File) => Promise<string>
  titleBlock?: (typeof TITLE_BLOCKS)[number]
}) {
  const style = gridStyle(region)

  /* ---- image region ---- */
  if (region.role === 'image') {
    const idx = region.imageIndex ?? 0
    const block = images[idx]
    if (block) {
      return (
        <div style={style} className={overlay ? 'z-0' : ''}>
          <ImageBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} fill showLabel={!overlay} onUpload={onUploadImage} />
        </div>
      )
    }
    return (
      <button
        style={style}
        onClick={() => addBlock('render')}
        className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50/40 transition border-2 border-dashed rounded-sm"
      >
        <span className="text-2xl leading-none">＋</span>
        <span className="text-[9px] uppercase tracking-widest font-semibold mt-1">Image</span>
      </button>
    )
  }

  /* ---- text-type regions ---- */
  const type = ROLE_TO_TYPE[region.role]
  const block = firstOfType(type)
  const onColor = overlay ? '#ffffff' : undefined
  const z = overlay ? 'relative z-10' : ''

  if (!block) {
    return (
      <button
        style={style}
        onClick={() => addBlock(type)}
        className={`flex items-center justify-center text-[10px] uppercase tracking-widest font-semibold text-gray-300 hover:text-blue-500 border border-dashed border-transparent hover:border-blue-300 rounded-sm transition ${z}`}
      >
        + {region.role}
      </button>
    )
  }

  const tk: DesignTokens = onColor ? { ...tokens, primary: onColor, text: onColor, accent: '#e5e5e5' } : tokens

  return (
    <div style={style} className={`min-h-0 overflow-hidden ${z}`}>
      {region.role === 'title' && (
        titleBlock
          ? <TitleBlockView
              style={titleBlock}
              p={toPalette(overlay ? { ...tokens, primary: '#fff', text: '#fff' } : tokens)}
              fonts={{ heading: tokens.headingFont, body: tokens.bodyFont }}
              content={{
                number: firstOfType('meta')?.fields?.[0]?.value || '01',
                title: block.text || 'Project Title',
                subline: firstOfType('subtitle')?.text || '',
              }}
            />
          : <TitleBlock block={block} tokens={tk} onChange={p => patchBlock(block.id, p)} size={spec.category === 'Cover' ? 'xl' : 'lg'} />
      )}
      {region.role === 'subtitle' && <SubtitleBlock block={block} tokens={tk} onChange={p => patchBlock(block.id, p)} />}
      {region.role === 'text' && <DescriptionBlock block={block} tokens={tk} onChange={p => patchBlock(block.id, p)} />}
      {region.role === 'legend' && <LegendBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} />}
      {region.role === 'meta' && <MetaBlock block={block} tokens={tokens} onChange={p => patchBlock(block.id, p)} />}
    </div>
  )
}

/* --------------------------- Layout thumbnail ---------------------------- */
/** A tiny visual preview of a layout spec, for the layout picker. */
export function LayoutThumb({ spec, tokens, active }: { spec: LayoutSpec; tokens?: DesignTokens; active?: boolean }) {
  const accent = tokens?.accent || '#3b82f6'
  const bg = tokens?.background || '#ffffff'
  return (
    <div
      className="relative w-full rounded-sm overflow-hidden border"
      style={{ aspectRatio: '210 / 297', background: bg, borderColor: active ? accent : 'rgba(0,0,0,0.12)' }}
    >
      <div className="absolute inset-0 grid p-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)', gap: 2 }}>
        {spec.regions.map((r, i) => {
          const st: React.CSSProperties = { ...gridStyle(r) }
          switch (r.role) {
            case 'image': st.background = 'rgba(0,0,0,0.14)'; break
            case 'title': st.background = accent; break
            case 'subtitle': st.background = 'rgba(0,0,0,0.30)'; break
            case 'text': st.background = 'rgba(0,0,0,0.10)'; break
            case 'legend': st.background = 'rgba(0,0,0,0.18)'; break
            case 'meta': st.background = 'rgba(0,0,0,0.12)'; break
          }
          return <div key={i} style={st} className="rounded-[1px]" />
        })}
      </div>
    </div>
  )
}
