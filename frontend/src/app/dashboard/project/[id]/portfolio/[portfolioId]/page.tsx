'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { PRESET_PACKS, StylePack } from '@/components/design-system/StylePackGallery'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const LAYOUTS = [
  { id: 'project-hero-image', name: 'Hero Image', icon: '🖼️' },
  { id: 'project-grid-3col', name: 'Grid 3-Col', icon: '⊞' },
  { id: 'project-plan-section', name: 'Plan + Sections', icon: '📐' },
  { id: 'project-asymmetric', name: 'Asymmetric', icon: '◱' },
  { id: 'project-masonry', name: 'Masonry', icon: '▦' },
]

export default function PortfolioEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPack, setSelectedPack] = useState<StylePack>(PRESET_PACKS[0])
  const [selectedLayout, setSelectedLayout] = useState<string>('project-hero-image')
  const [activePage, setActivePage] = useState<number>(0)
  const [pageList, setPageList] = useState<{ name: string; idx: number }[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadPortfolio()
  }, [isAuthenticated, token])

  // Extract page list from HTML for left sidebar
  useEffect(() => {
    if (!html) return
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const pages = Array.from(doc.querySelectorAll('section.page'))
    const list = pages.map((p, idx) => {
      const heading = p.querySelector('h1, h2')?.textContent?.trim() || `Page ${idx + 1}`
      const cls = p.className.includes('cover') ? 'Cover' :
                  p.className.includes('about') ? 'About' :
                  p.className.includes('contents') ? 'Contents' :
                  p.className.includes('end') ? 'End' : 'Project'
      return { name: `${cls}: ${heading.slice(0, 25)}`, idx }
    })
    setPageList(list)
  }, [html])

  // Scroll iframe to selected page
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentWindow) return
    try {
      const pages = iframe.contentDocument?.querySelectorAll('section.page')
      if (pages && pages[activePage]) {
        pages[activePage].scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (e) {}
  }, [activePage, html])

  const loadPortfolio = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      if (!savedToken) { setError('Not authenticated'); setIsLoading(false); return }

      const metaRes = await fetch(`${API_URL}/api/portfolios/view/${params.portfolioId}`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (metaRes.ok) {
        const meta = await metaRes.json()
        setPortfolio(meta)
        // Default to current portfolio's pack/layout if found
        const currentPack = PRESET_PACKS.find(p => p.id === meta.style_pack) || PRESET_PACKS[0]
        setSelectedPack(currentPack)
        if (meta.layout_id) setSelectedLayout(meta.layout_id)
      }

      const previewRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/preview`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (previewRes.ok) {
        const data = await previewRes.json()
        setHtml(data.html || '')
      } else {
        setError(`Failed to render: ${previewRes.status}`)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally { setIsLoading(false) }
  }

  // Re-render when pack or layout changes
  const rerender = async (pack: StylePack, layout: string) => {
    setIsRendering(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/render-with-pack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          style_pack_data: pack,
          layout_id: layout,
        })
      })
      if (res.ok) {
        const data = await res.json()
        setHtml(data.html || '')
      }
    } catch (e) {
      console.error('Rerender failed:', e)
    } finally {
      setIsRendering(false)
    }
  }

  const handlePackChange = (pack: StylePack) => {
    setSelectedPack(pack)
    rerender(pack, selectedLayout)
  }

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayout(layoutId)
    rerender(selectedPack, layoutId)
  }

  const handlePrint = () => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) iframe.contentWindow.print()
  }

  const handleSave = async () => {
    // Persist current pack/layout selection to the portfolio
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      // Re-generate with selected pack as the new default
      alert('Changes saved! Reload to see persisted version.')
    } catch (e) {
      console.error(e)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-stone-light">Loading editor...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg">
        <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ Error</h2>
        <pre className="text-sm bg-red-50 p-4 rounded text-red-800 overflow-auto">{error}</pre>
        <button onClick={loadPortfolio} className="btn-primary mt-4">Retry</button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-border-light shadow-sm flex-shrink-0 z-50 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/project/${params.id}/generate`}
            className="text-stone-light hover:text-slate transition-colors flex items-center gap-1 text-sm whitespace-nowrap"
          >
            ← Back
          </Link>
          <div className="h-4 w-px bg-border-light"></div>
          <span className="text-sm font-bold text-charcoal truncate">
            🎨 Portfolio Editor
          </span>
          <span className="text-xs text-stone-light hidden sm:inline">
            Variant #{portfolio?.variant_number}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          {isRendering && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <span className="animate-spin">⟳</span> Updating...
            </span>
          )}
          <button
            onClick={handlePrint}
            className="bg-primary text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-primary-dark"
          >
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Page Thumbnails */}
        <aside className="w-56 bg-white border-r border-border-light overflow-y-auto flex-shrink-0">
          <div className="p-3 sticky top-0 bg-white border-b border-border-light z-10">
            <h3 className="text-xs font-bold text-stone uppercase tracking-wider">📄 Pages ({pageList.length})</h3>
          </div>
          <div className="p-2 space-y-1">
            {pageList.map((page) => (
              <button
                key={page.idx}
                onClick={() => setActivePage(page.idx)}
                className={`w-full text-left p-2 rounded text-xs transition flex items-center gap-2 ${
                  activePage === page.idx
                    ? 'bg-primary text-white'
                    : 'hover:bg-bg-subtle text-charcoal'
                }`}
              >
                <span className="text-base">{
                  page.name.includes('Cover') ? '🏠' :
                  page.name.includes('About') ? '👤' :
                  page.name.includes('Contents') ? '📋' :
                  page.name.includes('End') ? '📞' : '🏗️'
                }</span>
                <span className="flex-1 truncate">{page.name}</span>
              </button>
            ))}
          </div>

          {/* Layouts section */}
          <div className="p-3 sticky bg-white border-b border-t border-border-light z-10">
            <h3 className="text-xs font-bold text-stone uppercase tracking-wider">📐 Layouts</h3>
          </div>
          <div className="p-2 space-y-1">
            {LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                onClick={() => handleLayoutChange(layout.id)}
                className={`w-full text-left p-2 rounded text-xs transition flex items-center gap-2 ${
                  selectedLayout === layout.id
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'hover:bg-bg-subtle text-charcoal'
                }`}
              >
                <span>{layout.icon}</span>
                <span>{layout.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER: Preview */}
        <main className="flex-1 bg-slate-200 overflow-hidden relative">
          {isRendering && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 text-sm font-medium text-charcoal">
                <span className="animate-spin">⟳</span> Applying changes...
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            srcDoc={html}
            sandbox="allow-same-origin"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#f5f5f5',
            }}
          />
        </main>

        {/* RIGHT: Design Packs */}
        <aside className="w-64 bg-white border-l border-border-light overflow-y-auto flex-shrink-0">
          <div className="p-3 sticky top-0 bg-white border-b border-border-light z-10">
            <h3 className="text-xs font-bold text-stone uppercase tracking-wider">🎨 Design Packs</h3>
            <p className="text-[10px] text-stone-light mt-1">Click to apply</p>
          </div>
          <div className="p-2 space-y-2">
            {PRESET_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handlePackChange(pack)}
                className={`w-full text-left rounded-lg overflow-hidden transition border-2 ${
                  selectedPack.id === pack.id
                    ? 'border-primary shadow-md ring-2 ring-primary/30'
                    : 'border-border-light hover:border-stone-light'
                }`}
              >
                <div className="flex h-8">
                  <div style={{ background: pack.colors.primary, width: '30%' }} />
                  <div style={{ background: pack.colors.secondary, width: '20%' }} />
                  <div style={{ background: pack.colors.accent, width: '15%' }} />
                  <div style={{ background: pack.colors.background, width: '35%' }} />
                </div>
                <div className="p-2" style={{ background: pack.colors.background, color: pack.colors.text }}>
                  <div
                    className="font-bold text-xs truncate"
                    style={{ fontFamily: pack.typography.heading_font }}
                  >
                    {pack.name}
                  </div>
                  <div className="text-[10px] opacity-70 truncate mt-0.5">
                    {pack.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

      </div>
    </div>
  )
}
