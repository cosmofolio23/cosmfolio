'use client'

/** Renders a TitleBlockStyle with editable-looking content. Palette + fonts come
 *  from the template so a block matches the portfolio it lands in. */

import type { TitleBlockStyle } from './titleBlocks'
import type { DemoPalette } from './demoArt'

export interface TitleBlockContent {
  number?: string   // "PROJECT 01" / "01"
  title?: string    // "CULTURAL CENTER"
  subline?: string  // "Cultural / Civic · 2026"
}

const pickFg = (fill: string, p: DemoPalette) => (fill === 'dark' ? '#fff' : fill === 'accent' ? '#fff' : p.primary)

export function TitleBlockView({
  style, p, fonts, content, override,
}: {
  style: TitleBlockStyle
  p: DemoPalette
  fonts: { heading: string; body: string }
  content: TitleBlockContent
  /** Per-block user overrides from the title editor (colour / font / size). */
  override?: { color?: string; fontFamily?: string; scale?: number }
}) {
  const num = content.number ?? 'PROJECT 01'
  const title = content.title ?? 'CULTURAL CENTER'
  const sub = content.subline ?? 'Cultural / Civic · 2026'
  const fg = pickFg(style.fill, p)
  const subColor = style.fill === 'dark' || style.fill === 'accent' ? 'rgba(255,255,255,0.8)' : p.accent

  const align = style.align
  const items: React.CSSProperties = { textAlign: align, alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }

  const bg = style.fill === 'accent' ? p.accent : style.fill === 'dark' ? p.primary : style.fill === 'tint' ? `${p.accent}1f` : 'transparent'

  // number element
  const numberEl = () => {
    if (style.numberStyle === 'none') return null
    const base: React.CSSProperties = { fontFamily: fonts.body, color: style.fill === 'none' || style.fill === 'tint' ? p.accent : fg, lineHeight: 1, paddingBottom: '0.1em' }
    switch (style.numberStyle) {
      case 'big': return <div style={{ ...base, fontFamily: fonts.heading, fontSize: '3.4em', fontWeight: 800, color: `${p.accent}`, opacity: 0.9 }}>{num.replace(/\D/g, '') || '01'}</div>
      case 'chip': return <span style={{ ...base, background: p.accent, color: '#fff', padding: '0.15em 0.5em', fontSize: '0.62em', fontWeight: 700, letterSpacing: '0.12em', borderRadius: 2 }}>{num}</span>
      case 'slash': return <div style={{ ...base, fontSize: '0.62em', letterSpacing: '0.1em', fontWeight: 600 }}>{num.replace(/\s+/, ' / ')}</div>
      case 'outline': return <div style={{ ...base, fontFamily: fonts.heading, fontSize: '2.6em', fontWeight: 800, color: 'transparent', WebkitTextStroke: `1px ${p.accent}` } as any}>{num.replace(/\D/g, '') || '01'}</div>
      case 'dot': return <div style={{ ...base, fontSize: '0.6em', letterSpacing: '0.14em', fontWeight: 600, display: 'flex', gap: '0.4em', alignItems: 'center', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}><span style={{ width: '0.4em', height: '0.4em', borderRadius: '50%', background: p.accent, display: 'inline-block' }} />{num}</div>
      case 'prefix': return <div style={{ ...base, fontSize: '0.58em', letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>{num}</div>
    }
  }

  const ruleColor = style.fill === 'dark' || style.fill === 'accent' ? 'rgba(255,255,255,0.55)' : p.accent
  const Rule = ({ w = '2.4em' }: { w?: string }) => <div style={{ height: 2, width: w, background: ruleColor, marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' || align === 'right' ? 'auto' : 0 }} />
  const showRuleOver = style.rule === 'over' || style.rule === 'double' || style.rule === 'split'
  const showRuleUnder = style.rule === 'under' || style.rule === 'double'

  const titleStyle: React.CSSProperties = {
    fontFamily: override?.fontFamily || fonts.heading,
    color: override?.color || fg,
    fontWeight: style.weight,
    letterSpacing: `${style.tracking}em`, textTransform: style.caps ? 'uppercase' : 'none',
    fontSize: `${1.6 * (override?.scale || 1)}em`, lineHeight: 1.04,
    paddingBottom: '0.1em', // Prevent html2canvas clipping
  }

  return (
    <div
      style={{
        background: bg, color: fg, padding: style.fill === 'none' ? '0.2em 0' : '0.8em 0.9em',
        borderLeft: style.rule === 'left' ? `3px solid ${ruleColor}` : undefined,
        border: style.rule === 'box' ? `1.5px solid ${ruleColor}` : undefined,
        position: 'relative', width: '100%', containerType: 'inline-size' as any,
      }}
    >
      {style.rule === 'corner' && (
        <>
          <span style={{ position: 'absolute', top: 0, left: 0, width: '1.2em', height: 2, background: ruleColor }} />
          <span style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '1.2em', background: ruleColor }} />
        </>
      )}
      <div className="flex flex-col gap-[0.35em]" style={items}>
        {numberEl()}
        {style.accentBar && <div style={{ width: '2.6em', height: 4, background: p.accent }} />}
        {showRuleOver && <Rule w={style.rule === 'split' ? '1.6em' : '2.8em'} />}
        <div style={titleStyle}>{title}</div>
        {showRuleUnder && <Rule />}
        {sub && (
          <div style={{
            color: subColor, fontFamily: fonts.body,
            fontSize: '0.56em',
            letterSpacing: style.subline === 'spaced' ? '0.22em' : style.subline === 'caps' ? '0.14em' : '0.02em',
            textTransform: style.subline === 'caps' || style.subline === 'spaced' ? 'uppercase' : 'none',
            fontWeight: 600, marginTop: '0.1em',
            paddingBottom: '0.15em', // Prevent html2canvas clipping
            display: 'flex', gap: '0.5em', alignItems: 'center',
            justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
          }}>
            {style.subline === 'divider' && <span style={{ width: '1.4em', height: 1, background: subColor, display: 'inline-block' }} />}
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
