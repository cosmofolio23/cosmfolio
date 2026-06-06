'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Page {
  id: string
  type: string
  name: string
  html: string
  current_layout?: string
  available_layouts?: string[]
}

const LAYOUT_OPTIONS = [
  { id: 'project-hero-image', name: 'Hero Image', icon: '🖼️', desc: 'Big image, text below' },
  { id: 'project-grid-3col', name: '3-Col Grid', icon: '⊞', desc: 'Six images in grid' },
  { id: 'project-plan-section', name: 'Plan + Sections', icon: '📐', desc: 'Floor plan focus' },
  { id: 'project-asymmetric', name: 'Asymmetric', icon: '◱', desc: 'Magazine-style' },
  { id: 'project-masonry', name: 'Masonry', icon: '▦', desc: 'Pinterest-style' },
  { id: 'project-fullbleed', name: 'Full-bleed', icon: '🎬', desc: 'Cinematic with overlay' },
  { id: 'project-two-col-text', name: 'Two Column', icon: '⫾', desc: 'Text + image stack' },
  { id: 'project-gallery-wall', name: 'Gallery Wall', icon: '◧', desc: 'Mosaic varied sizes' },
  { id: 'project-blueprint', name: 'Blueprint', icon: '📋', desc: 'Technical drawings' },
  { id: 'project-story-timeline', name: 'Story', icon: '⟶', desc: 'Process narrative' },
]

export default function PortfolioEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()

  const [portfolio, setPortfolio] = useState<any>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [rightTab, setRightTab] = useState<'layout'>('layout')
  const [error, setError] = useState<string | null>(null)
  const [pageLayouts, setPageLayouts] = useState<Record<string, string>>({})

  const currentPage = pages[currentIdx]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadPortfolio()
  }, [isAuthenticated, token])

  const loadPortfolio = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const savedToken = token || localStorage.getItem('auth_token')
      if (!savedToken) { setError('Not authenticated'); setIsLoading(false); return }

      // Get portfolio metadata
      const metaRes = await fetch(`${API_URL}/api/portfolios/view/${params.portfolioId}`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (metaRes.ok) {
        const meta = await metaRes.json()
        setPortfolio(meta)
        // Restore per-page layouts
        const ps = meta.page_structure || {}
        const savedLayouts = ps.page_layouts || {}
        if (Object.keys(savedLayouts).length > 0) {
          setPageLayouts(savedLayouts)
        }
      }

      // Get paged data
      let gotPages = false
      try {
        const pagesRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
        if (pagesRes.ok) {
          const data = await pagesRes.json()
          setPages(data.pages || [])
          gotPages = true
        }
      } catch (e) { console.warn('Pages endpoint unavailable, falling back to preview') }

      // FALLBACK: use /preview endpoint
      if (!gotPages) {
        const previewRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/preview`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        if (previewRes.ok) {
          const data = await previewRes.json()
          const html = data.html || ''
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const sections = Array.from(doc.querySelectorAll('section.page'))
          const parsedPages = sections.map((sec, idx) => {
            const heading = sec.querySelector('h1, h2')?.textContent?.trim() || `Page ${idx + 1}`
            const cls = sec.className || ''
            const type = cls.includes('cover') ? 'cover'
              : cls.includes('about') ? 'about'
              : cls.includes('contents') ? 'contents'
              : cls.includes('end') ? 'end'
              : 'project'
            return {
              id: `${type}-${idx}`,
              type,
              name: heading.slice(0, 30),
              html: sec.outerHTML,
            }
          })
          setPages(parsedPages)
        } else {
          setError(`Failed to render: ${previewRes.status}`)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  const switchPageLayout = async (pageId: string, newLayoutId: string) => {
    const nextLayouts = { ...pageLayouts, [pageId]: newLayoutId }
    setPageLayouts(nextLayouts)

    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_layouts: nextLayouts,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages || [])
      }
    } catch (e) {
      console.error('Layout switch failed:', e)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-56 bg-white border-r p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-gray-600 text-sm">Loading portfolio…</p>
          </div>
        </main>
        <aside className="w-80 bg-white border-l p-4">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg">
        <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ Error</h2>
        <pre className="text-sm bg-red-50 p-4 rounded text-red-800 overflow-auto">{error}</pre>
        <button onClick={loadPortfolio} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Retry</button>
      </div>
    </div>
  )

  if (!portfolio || pages.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Portfolio not found</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/project/${params.id}/generate`} className="text-gray-500 hover:text-gray-900 text-sm">← Back</Link>
            <div>
              <h1 className="text-base font-semibold">{portfolio?.name || 'Portfolio'}</h1>
              <p className="text-[11px] text-gray-400">Generated · Variant Preview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400">Page {currentIdx + 1}/{pages.length}</span>
          </div>
        </div>
      </header>

      <div className={`flex flex-1 min-h-0 ${isMobile ? 'flex-col' : ''}`}>
        {/* Left: pages list */}
        <aside className={`${isMobile ? 'w-full h-24 border-b' : 'w-56 border-r'} bg-white overflow-y-auto flex-shrink-0`}>
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pages ({pages.length})</h3>
            <div className="space-y-1.5">
              {pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-full text-left p-2.5 rounded-lg border-2 transition ${
                    currentIdx === idx ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-xs font-medium flex-shrink-0">{idx + 1}.</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-gray-400 uppercase">{page.type}</div>
                      <div className="text-xs font-medium truncate">{page.name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: canvas preview */}
        <main className={`${isMobile ? 'flex-1' : 'flex-1'} overflow-y-auto ${isMobile ? 'p-2' : 'p-8'} bg-gray-300/40`}>
          {currentPage && (
            <div className="max-w-[760px] mx-auto">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <iframe
                  srcDoc={`<!DOCTYPE html><html><body>${currentPage.html}</body></html>`}
                  sandbox="allow-same-origin"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title={currentPage.name}
                />
              </div>
              <div className={`mt-3 text-center ${isMobile ? 'text-[9px]' : 'text-[11px]'} text-gray-400`}>
                {currentPage.name} · {currentPage.type}
              </div>
            </div>
          )}
        </main>

        {/* Right: inspector */}
        {isMobile && (
          <button onClick={() => {}} className="fixed bottom-4 right-4 z-40 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg">
            ⚙️ Layout
          </button>
        )}
        <aside className={`${isMobile ? 'hidden' : 'w-80'} bg-white ${isMobile ? '' : 'border-l'} overflow-y-auto flex-shrink-0`}>
          {/* Tab header */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <button
              onClick={() => setRightTab('layout')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${rightTab === 'layout' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
              Layout
            </button>
          </div>

          <div className="p-4">
            {/* LAYOUT TAB */}
            {rightTab === 'layout' && (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-400">{LAYOUT_OPTIONS.length} layouts · click to apply</p>
                <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                  {LAYOUT_OPTIONS.map(layout => {
                    const isActive = (pageLayouts[currentPage?.id] || currentPage?.current_layout) === layout.id
                    return (
                      <button
                        key={layout.id}
                        onClick={() => currentPage && switchPageLayout(currentPage.id, layout.id)}
                        className={`text-left rounded-lg p-2 border-2 transition ${isActive ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="text-2xl mb-1">{layout.icon}</div>
                        <div className="text-[10px] font-semibold text-gray-700">{layout.name}</div>
                        <div className="text-[9px] text-gray-400">{layout.desc}</div>
                        {isActive && (
                          <div className="text-xs text-blue-600 font-semibold mt-1">✓ Active</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
