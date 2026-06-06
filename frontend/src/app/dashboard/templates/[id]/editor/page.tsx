'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import PageComposer, { LayoutThumb } from '@/components/composer/PageComposer'
import {
  type Page, type Block, type BlockType, type DesignTokens,
  createBlock, blockLabel, uid,
} from '@/components/composer/types'
import {
  seedPagesFromTemplate, getSpec, LAYOUT_CATALOG, LAYOUT_CATEGORIES, LAYOUT_COUNT,
  type LayoutCategory,
} from '@/components/composer/layoutSpecs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Template {
  id: string
  name: string
  description?: string
  category?: string
  colors?: Record<string, string>
  fonts?: Record<string, string>
  layouts?: any
  placeholders?: any
}

const ADD_BLOCKS: { type: BlockType; icon: string }[] = [
  { type: 'title', icon: 'T' }, { type: 'subtitle', icon: 't' }, { type: 'meta', icon: '#' },
  { type: 'description', icon: '¶' }, { type: 'legend', icon: '①' },
  { type: 'render', icon: '🖼️' }, { type: 'plan', icon: '📐' }, { type: 'section', icon: '📏' }, { type: 'diagram', icon: '◑' },
]

const HEADING_FONTS = ['Montserrat', 'Playfair Display', 'Roboto', 'Inter', 'Poppins', 'Georgia', 'Lora', 'Bebas Neue', 'Oswald', 'Arial']
const BODY_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro', 'Raleway', 'Georgia', 'Arial']

export default function TemplateEditor() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, token } = useAuthStore()
  const templateId = params.id as string

  const [template, setTemplate] = useState<Template | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [portfolioTitle, setPortfolioTitle] = useState('')
  const [rightTab, setRightTab] = useState<'layout' | 'blocks' | 'style'>('layout')
  const [layoutSearch, setLayoutSearch] = useState('')
  const [layoutCat, setLayoutCat] = useState<'All' | LayoutCategory>('All')

  const [tokens, setTokens] = useState<DesignTokens>({
    background: '#FFFFFF', text: '#1a1a1a', primary: '#111111', accent: '#888888', muted: '#dddddd',
    headingFont: 'Montserrat', bodyFont: 'Inter',
  })

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    fetchTemplate()
  }, [isAuthenticated, templateId])

  const fetchTemplate = async () => {
    try {
      let data: Template | null = null
      const res = await fetch(`${API_URL}/api/templates/portfolios/${templateId}`)
      if (res.ok) data = await res.json()
      else {
        const sres = await fetch(`${API_URL}/api/templates/sheets/${templateId}`)
        if (sres.ok) data = await sres.json()
      }
      if (data) {
        setTemplate(data)
        setPortfolioTitle(`${data.name} Portfolio`)
        const c = data.colors || {}
        setTokens({
          background: c.background || '#FFFFFF',
          text: c.text || '#1a1a1a',
          primary: c.primary || c.text || '#111111',
          accent: c.accent || '#888888',
          muted: c.muted || '#dddddd',
          headingFont: data.fonts?.heading || 'Montserrat',
          bodyFont: data.fonts?.body || 'Inter',
        })
        setPages(seedPagesFromTemplate(data))
      }
    } catch (e) {
      console.error('Error loading template:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const currentPage = pages[currentIdx]
  const updatePage = (p: Page) => setPages(prev => prev.map((x, i) => i === currentIdx ? p : x))

  const setLayout = (layoutId: string) => { if (currentPage) updatePage({ ...currentPage, layoutId }) }

  const addBlock = (type: BlockType) => {
    if (!currentPage) return
    updatePage({ ...currentPage, blocks: [...currentPage.blocks, createBlock(type)] })
  }

  const removeBlock = (blockId: string) => {
    if (!currentPage) return
    updatePage({ ...currentPage, blocks: currentPage.blocks.filter(b => b.id !== blockId) })
  }

  const moveBlock = (blockId: string, dir: -1 | 1) => {
    if (!currentPage) return
    const idx = currentPage.blocks.findIndex(b => b.id === blockId)
    const swap = idx + dir
    if (idx < 0 || swap < 0 || swap >= currentPage.blocks.length) return
    const next = [...currentPage.blocks]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    updatePage({ ...currentPage, blocks: next })
  }

  const addPage = (type: Page['type']) => {
    const layoutId: string = type === 'cover' ? 'cover.minimal' : type === 'about' ? 'text.statement' : type === 'contact' ? 'contact.center' : 'twoThirdsStack.titleMetaInline'
    const blocks: Block[] = [{ ...createBlock('title'), text: type === 'project' ? `Project ${pages.filter(p => p.type === 'project').length + 1}` : 'New Page' }]
    if (type === 'project') { blocks.push(createBlock('meta'), createBlock('render'), createBlock('description')) }
    else { blocks.push(createBlock('description')) }
    const newPage: Page = { id: uid('p'), type, layoutId, blocks }
    setPages([...pages, newPage]); setCurrentIdx(pages.length)
  }

  const deletePage = (idx: number) => {
    if (pages.length <= 1) return
    setPages(pages.filter((_, i) => i !== idx))
    if (currentIdx >= idx && currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  const movePage = (idx: number, dir: -1 | 1) => {
    const swap = idx + dir
    if (swap < 0 || swap >= pages.length) return
    const next = [...pages]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setPages(next)
    setCurrentIdx(swap)
  }

  const savePortfolio = async () => {
    if (!portfolioTitle.trim()) { alert('Please enter a portfolio title'); return }
    setIsSaving(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: portfolioTitle, project_type: 'portfolio', description: `From template: ${template?.name}` }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || res.statusText) }
      const project = await res.json()
      localStorage.setItem(`portfolio_${project.id}`, JSON.stringify({ template_id: templateId, tokens, pages, title: portfolioTitle }))
      alert(`✅ Portfolio "${portfolioTitle}" saved!`)
      router.push(`/dashboard/project/${project.id}`)
    } catch (e: any) {
      alert(`Failed to save: ${e.message}`)
    } finally { setIsSaving(false) }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto" /><p className="text-gray-600">Loading template…</p></div></div>
  }
  if (!template || !currentPage) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><p className="text-gray-600 mb-4">Template not found</p><Link href="/dashboard/templates" className="text-blue-600 hover:underline">← Back to Templates</Link></div></div>
  }

  const filteredLayouts = useMemo(() => {
    let list = LAYOUT_CATALOG
    if (layoutCat !== 'All') list = list.filter(s => s.category === layoutCat)
    if (layoutSearch.trim()) {
      const q = layoutSearch.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
    }
    // surface layouts that suit the current page type first
    return [...list].sort((a, b) =>
      (b.suits.includes(currentPage.type) ? 1 : 0) - (a.suits.includes(currentPage.type) ? 1 : 0))
  }, [layoutCat, layoutSearch, currentPage.type])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/templates" className="text-gray-500 hover:text-gray-900 text-sm">← Back</Link>
            <div>
              <input value={portfolioTitle} onChange={e => setPortfolioTitle(e.target.value)} className="text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-0.5 rounded" placeholder="Untitled" />
              <p className="text-[11px] text-gray-400 px-2">Template: {template.name} · {template.category}</p>
            </div>
          </div>
          <button onClick={savePortfolio} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'Saving…' : '💾 Save Portfolio'}</button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left: pages */}
        <aside className="w-56 bg-white border-r overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages ({pages.length})</h3>
            <div className="space-y-1.5">
              {pages.map((page, idx) => (
                <div key={page.id} onClick={() => setCurrentIdx(idx)}
                  className={`group p-2.5 rounded-lg cursor-pointer border-2 transition ${currentIdx === idx ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-[10px] text-gray-400 uppercase">{idx + 1} · {page.type}</div>
                      <div className="text-xs font-medium truncate">{page.blocks.find(b => b.type === 'title')?.text || 'Untitled'}</div>
                      <div className="text-[10px] text-gray-400 truncate">{getSpec(page.layoutId).name}</div>
                    </div>
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition">
                      <button onClick={e => { e.stopPropagation(); movePage(idx, -1) }} className="text-gray-400 hover:text-gray-700 text-[10px] leading-none">▲</button>
                      <button onClick={e => { e.stopPropagation(); movePage(idx, 1) }} className="text-gray-400 hover:text-gray-700 text-[10px] leading-none">▼</button>
                      <button onClick={e => { e.stopPropagation(); deletePage(idx) }} className="text-gray-400 hover:text-red-500 text-[10px] leading-none mt-0.5">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Add page</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['project', 'about', 'cover', 'contact'] as const).map(t => (
                  <button key={t} onClick={() => addPage(t)} className="px-2 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 capitalize">+ {t}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Center: canvas */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-300/40">
          <PageComposer page={currentPage} tokens={tokens} onChange={updatePage} />
          <div className="max-w-[760px] mx-auto mt-3 text-center text-[11px] text-gray-400">
            Page {currentIdx + 1} of {pages.length} · Click any text or image to edit it directly
          </div>
        </main>

        {/* Right: inspector */}
        <aside className="w-80 bg-white border-l overflow-y-auto flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            {(['layout', 'blocks', 'style'] as const).map(t => (
              <button key={t} onClick={() => setRightTab(t)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${rightTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* LAYOUT TAB */}
            {rightTab === 'layout' && (
              <div className="space-y-3">
                <input
                  value={layoutSearch}
                  onChange={e => setLayoutSearch(e.target.value)}
                  placeholder={`Search ${LAYOUT_COUNT} layouts…`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1">
                  {(['All', ...LAYOUT_CATEGORIES] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setLayoutCat(cat as any)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition ${layoutCat === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-gray-400">{filteredLayouts.length} layouts · click to apply</div>
                <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                  {filteredLayouts.map(spec => {
                    const active = currentPage.layoutId === spec.id
                    return (
                      <button
                        key={spec.id}
                        onClick={() => setLayout(spec.id)}
                        className={`group text-left rounded-lg p-1.5 border-2 transition ${active ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <LayoutThumb spec={spec} tokens={tokens} active={active} />
                        <div className="mt-1 px-0.5">
                          <div className="text-[10px] font-semibold text-gray-700 truncate leading-tight">{spec.name}</div>
                          <div className="text-[9px] text-gray-400">{spec.category}{spec.imageCount > 0 ? ` · ${spec.imageCount} img` : ''}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* BLOCKS TAB */}
            {rightTab === 'blocks' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Add element</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {ADD_BLOCKS.map(b => (
                      <button key={b.type} onClick={() => addBlock(b.type)}
                        className="flex flex-col items-center gap-1 p-2.5 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition">
                        <span className="text-lg">{b.icon}</span>
                        <span className="text-[10px] font-medium capitalize">{blockLabel(b.type)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Elements on this page ({currentPage.blocks.length})</h4>
                  <div className="space-y-1.5">
                    {currentPage.blocks.map(b => (
                      <div key={b.id} className="group flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: tokens.accent, color: '#fff' }}>{blockLabel(b.type)}</span>
                        <span className="flex-1 text-xs text-gray-600 truncate">{b.text || b.label || (b.fields ? 'Metadata' : b.legendItems ? `${b.legendItems.length} items` : '—')}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => moveBlock(b.id, -1)} className="text-gray-400 hover:text-gray-700 text-xs">▲</button>
                          <button onClick={() => moveBlock(b.id, 1)} className="text-gray-400 hover:text-gray-700 text-xs">▼</button>
                          <button onClick={() => removeBlock(b.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STYLE TAB */}
            {rightTab === 'style' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Colors</h4>
                  <div className="space-y-2">
                    {(['background', 'text', 'primary', 'accent', 'muted'] as const).map(key => (
                      <div key={key} className="flex items-center gap-2">
                        <input type="color" value={tokens[key]} onChange={e => setTokens({ ...tokens, [key]: e.target.value })} className="w-9 h-9 rounded border border-gray-300 cursor-pointer" />
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-400 uppercase">{key}</label>
                          <input type="text" value={tokens[key]} onChange={e => setTokens({ ...tokens, [key]: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-mono" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Typography</h4>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Heading</label>
                  <select value={tokens.headingFont} onChange={e => setTokens({ ...tokens, headingFont: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-3">
                    {HEADING_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <label className="text-[10px] text-gray-400 uppercase block mb-1">Body</label>
                  <select value={tokens.bodyFont} onChange={e => setTokens({ ...tokens, bodyFont: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                    {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-[11px] text-blue-800">
                  Colors & fonts apply to every page instantly.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
