'use client'

import type { Block, Page, DesignTokens } from './types'
import { byType, allImages } from './types'
import {
  ImageBlock, LegendBlock, MetaBlock, TitleBlock, SubtitleBlock, DescriptionBlock, pickContrast,
} from './Blocks'

interface Props {
  page: Page
  tokens: DesignTokens
  onChange: (page: Page) => void
}

export default function PageComposer({ page, tokens, onChange }: Props) {
  const patchBlock = (blockId: string, patch: Partial<Block>) => {
    onChange({ ...page, blocks: page.blocks.map(b => b.id === blockId ? { ...b, ...patch } : b) })
  }

  const ctx = { tokens, patchBlock }

  return (
    <div
      className="w-full shadow-2xl mx-auto"
      style={{
        background: tokens.background,
        color: tokens.text,
        fontFamily: tokens.bodyFont,
        aspectRatio: '210 / 297',
        maxWidth: 760,
      }}
    >
      {renderLayout(page, ctx)}
    </div>
  )
}

type Ctx = { tokens: DesignTokens; patchBlock: (id: string, patch: Partial<Block>) => void }

function renderLayout(page: Page, ctx: Ctx) {
  switch (page.layoutId) {
    case 'cover-hero':         return <CoverHero page={page} ctx={ctx} />
    case 'cover-minimal':      return <CoverMinimal page={page} ctx={ctx} />
    case 'title-block-drawing':return <TitleBlockDrawing page={page} ctx={ctx} />
    case 'plan-legend':        return <PlanLegend page={page} ctx={ctx} />
    case 'section-study':      return <SectionStudy page={page} ctx={ctx} />
    case 'drawing-grid':       return <DrawingGrid page={page} ctx={ctx} />
    case 'render-showcase':    return <RenderShowcase page={page} ctx={ctx} />
    case 'split-render-plan':  return <SplitRenderPlan page={page} ctx={ctx} />
    case 'statement':          return <Statement page={page} ctx={ctx} />
    case 'contact-center':     return <ContactCenter page={page} ctx={ctx} />
    default:                   return <Statement page={page} ctx={ctx} />
  }
}

/* ------------------------------ Layout: Covers ----------------------------- */

function CoverHero({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const subtitle = byType(page.blocks, 'subtitle')[0]
  const hero = allImages(page.blocks)[0]
  return (
    <div className="relative w-full h-full">
      {hero && (
        <div className="absolute inset-0">
          <ImageBlock block={hero} tokens={tokens} onChange={p => patchBlock(hero.id, p)} aspect="h-full" showLabel={false} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.05))' }} />
        </div>
      )}
      <div className="relative h-full flex flex-col justify-end p-12">
        {title && <div className="mb-2"><TitleBlock block={title} tokens={{ ...tokens, primary: hero ? '#fff' : tokens.primary }} onChange={p => patchBlock(title.id, p)} size="xl" /></div>}
        {subtitle && <SubtitleBlock block={subtitle} tokens={{ ...tokens, accent: hero ? '#eee' : tokens.accent }} onChange={p => patchBlock(subtitle.id, p)} />}
      </div>
    </div>
  )
}

function CoverMinimal({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const subtitle = byType(page.blocks, 'subtitle')[0]
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-16">
      <div className="w-12 h-1 mb-8" style={{ background: tokens.accent }} />
      {title && <div className="mb-4"><TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="xl" /></div>}
      {subtitle && <SubtitleBlock block={subtitle} tokens={tokens} onChange={p => patchBlock(subtitle.id, p)} />}
    </div>
  )
}

/* ------------------------- Layout: Title Block (tech) ---------------------- */

function TitleBlockDrawing({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const meta = byType(page.blocks, 'meta')[0]
  const legend = byType(page.blocks, 'legend')[0]
  const desc = byType(page.blocks, 'description')[0]
  const mainImg = allImages(page.blocks)[0]

  return (
    <div className="w-full h-full flex" style={{ border: `1px solid ${tokens.muted}` }}>
      {/* Main drawing */}
      <div className="flex-1 p-4 flex items-center justify-center" style={{ borderRight: `1px solid ${tokens.muted}` }}>
        {mainImg
          ? <ImageBlock block={mainImg} tokens={tokens} onChange={p => patchBlock(mainImg.id, p)} aspect="h-full" />
          : <div className="text-xs" style={{ color: tokens.muted }}>Add a drawing →</div>}
      </div>
      {/* Right title block */}
      <div className="w-[34%] flex flex-col p-4" style={{ background: tokens.background }}>
        {title && <div className="pb-3 mb-3 border-b" style={{ borderColor: tokens.accent }}><TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="sm" /></div>}
        {meta && <div className="mb-4"><MetaBlock block={meta} tokens={tokens} onChange={p => patchBlock(meta.id, p)} /></div>}
        {desc && <div className="mb-4"><DescriptionBlock block={desc} tokens={tokens} onChange={p => patchBlock(desc.id, p)} /></div>}
        {legend && <div className="mt-auto"><LegendBlock block={legend} tokens={tokens} onChange={p => patchBlock(legend.id, p)} /></div>}
      </div>
    </div>
  )
}

/* --------------------------- Layout: Plan + Legend ------------------------- */

function PlanLegend({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const meta = byType(page.blocks, 'meta')[0]
  const legend = byType(page.blocks, 'legend')[0]
  const plans = byType(page.blocks, 'plan')
  const mainPlan = plans[0] || allImages(page.blocks)[0]

  return (
    <div className="w-full h-full p-8 flex flex-col">
      <div className="flex items-end justify-between mb-4 pb-3 border-b" style={{ borderColor: tokens.accent }}>
        {title && <TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="lg" />}
        {meta && <div className="text-right"><MetaBlock block={meta} tokens={tokens} onChange={p => patchBlock(meta.id, p)} layout="inline" /></div>}
      </div>
      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 flex items-center justify-center">
          {mainPlan
            ? <ImageBlock block={mainPlan} tokens={tokens} onChange={p => patchBlock(mainPlan.id, p)} aspect="h-full" />
            : <div className="text-xs" style={{ color: tokens.muted }}>Add a floor plan</div>}
        </div>
        {legend && <div className="w-48 pt-2"><LegendBlock block={legend} tokens={tokens} onChange={p => patchBlock(legend.id, p)} /></div>}
      </div>
    </div>
  )
}

/* --------------------------- Layout: Section Study ------------------------- */

function SectionStudy({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const desc = byType(page.blocks, 'description')[0]
  const sections = byType(page.blocks, 'section')
  const main = sections[0] || allImages(page.blocks)[0]

  return (
    <div className="w-full h-full p-10 flex flex-col">
      {title && <div className="mb-3"><TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="lg" /></div>}
      <div className="flex-1 flex items-center my-4">
        {main
          ? <ImageBlock block={main} tokens={tokens} onChange={p => patchBlock(main.id, p)} aspect="aspect-[16/7]" />
          : <div className="text-xs" style={{ color: tokens.muted }}>Add a section drawing</div>}
      </div>
      {sections[1] && (
        <div className="mb-4"><ImageBlock block={sections[1]} tokens={tokens} onChange={p => patchBlock(sections[1].id, p)} aspect="aspect-[16/6]" /></div>
      )}
      {desc && <div className="max-w-2xl"><DescriptionBlock block={desc} tokens={tokens} onChange={p => patchBlock(desc.id, p)} /></div>}
    </div>
  )
}

/* --------------------------- Layout: Drawing Grid -------------------------- */

function DrawingGrid({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const drawings = [...byType(page.blocks, 'plan'), ...byType(page.blocks, 'section'), ...byType(page.blocks, 'diagram')]
  const legend = byType(page.blocks, 'legend')[0]

  return (
    <div className="w-full h-full p-8 flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: tokens.accent }}>
        {title && <TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="lg" />}
        <span className="text-[10px] uppercase tracking-widest" style={{ color: tokens.muted }}>{drawings.length} drawings</span>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-fr">
        {drawings.map(d => (
          <ImageBlock key={d.id} block={d} tokens={tokens} onChange={p => patchBlock(d.id, p)} aspect="aspect-[4/3]" />
        ))}
      </div>
      {legend && <div className="mt-4 pt-3 border-t" style={{ borderColor: tokens.muted }}><LegendBlock block={legend} tokens={tokens} onChange={p => patchBlock(legend.id, p)} /></div>}
    </div>
  )
}

/* -------------------------- Layout: Render Showcase ------------------------ */

function RenderShowcase({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const meta = byType(page.blocks, 'meta')[0]
  const desc = byType(page.blocks, 'description')[0]
  const renders = byType(page.blocks, 'render')
  const hero = renders[0] || allImages(page.blocks)[0]
  const supporting = (renders[0] ? renders.slice(1) : allImages(page.blocks).slice(1)).slice(0, 2)

  return (
    <div className="w-full h-full p-8 flex flex-col">
      {title && <div className="mb-1"><TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="lg" /></div>}
      {meta && <div className="mb-3"><MetaBlock block={meta} tokens={tokens} onChange={p => patchBlock(meta.id, p)} layout="inline" /></div>}
      <div className="flex-1 min-h-0 mb-3">
        {hero
          ? <ImageBlock block={hero} tokens={tokens} onChange={p => patchBlock(hero.id, p)} aspect="h-full" />
          : <div className="h-full flex items-center justify-center text-xs" style={{ color: tokens.muted }}>Add a hero render</div>}
      </div>
      {supporting.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3" style={{ height: '22%' }}>
          {supporting.map(s => <ImageBlock key={s.id} block={s} tokens={tokens} onChange={p => patchBlock(s.id, p)} aspect="h-full" />)}
        </div>
      )}
      {desc && <DescriptionBlock block={desc} tokens={tokens} onChange={p => patchBlock(desc.id, p)} />}
    </div>
  )
}

/* ------------------------- Layout: Split Render/Plan ----------------------- */

function SplitRenderPlan({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const desc = byType(page.blocks, 'description')[0]
  const render = byType(page.blocks, 'render')[0]
  const plan = byType(page.blocks, 'plan')[0]
  const imgs = allImages(page.blocks)
  const top = render || imgs[0]
  const bottom = plan || imgs[1]

  return (
    <div className="w-full h-full p-8 flex flex-col">
      {title && <div className="mb-3"><TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="lg" /></div>}
      <div className="flex-1 min-h-0 mb-3">
        {top ? <ImageBlock block={top} tokens={tokens} onChange={p => patchBlock(top.id, p)} aspect="h-full" /> : <Empty tokens={tokens} label="Add render" />}
      </div>
      <div className="flex-1 min-h-0 mb-3">
        {bottom ? <ImageBlock block={bottom} tokens={tokens} onChange={p => patchBlock(bottom.id, p)} aspect="h-full" /> : <Empty tokens={tokens} label="Add plan" />}
      </div>
      {desc && <DescriptionBlock block={desc} tokens={tokens} onChange={p => patchBlock(desc.id, p)} />}
    </div>
  )
}

/* ----------------------------- Layout: Statement --------------------------- */

function Statement({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const desc = byType(page.blocks, 'description')[0]
  const img = allImages(page.blocks)[0]

  return (
    <div className="w-full h-full p-14 flex flex-col justify-center">
      {title && <div className="mb-6"><TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="xl" /></div>}
      <div className="w-16 h-1 mb-6" style={{ background: tokens.accent }} />
      <div className="grid grid-cols-1 gap-8" style={{ gridTemplateColumns: img ? '1fr 1fr' : '1fr' }}>
        {desc && (
          <div className="text-lg" style={{ lineHeight: 1.7 }}>
            <DescriptionBlock block={desc} tokens={tokens} onChange={p => patchBlock(desc.id, p)} />
          </div>
        )}
        {img && <ImageBlock block={img} tokens={tokens} onChange={p => patchBlock(img.id, p)} aspect="aspect-[3/4]" />}
      </div>
    </div>
  )
}

/* ------------------------------ Layout: Contact ---------------------------- */

function ContactCenter({ page, ctx }: { page: Page; ctx: Ctx }) {
  const { tokens, patchBlock } = ctx
  const title = byType(page.blocks, 'title')[0]
  const desc = byType(page.blocks, 'description')[0]
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-16">
      {title && <div className="mb-6"><TitleBlock block={title} tokens={tokens} onChange={p => patchBlock(title.id, p)} size="xl" /></div>}
      {desc && (
        <div className="text-lg" style={{ color: tokens.text }}>
          <DescriptionBlock block={desc} tokens={tokens} onChange={p => patchBlock(desc.id, p)} />
        </div>
      )}
    </div>
  )
}

function Empty({ tokens, label }: { tokens: DesignTokens; label: string }) {
  return <div className="w-full h-full flex items-center justify-center text-xs border-2 border-dashed" style={{ color: tokens.muted, borderColor: tokens.muted }}>{label}</div>
}
