'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { PRESET_PACKS, StylePack } from '@/components/design-system/StylePackGallery'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Page {
  id: string
  type: string
  name: string
  html: string
}

export default function PortfolioFlipbookPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [headHtml, setHeadHtml] = useState<string>('')
  const [spreadIndex, setSpreadIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPack, setSelectedPack] = useState<StylePack>(PRESET_PACKS[0])
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
  const [isFlipping, setIsFlipping] = useState(false)
  const [showPacks, setShowPacks] = useState(false)
  const [showJump, setShowJump] = useState(false)

  // Total spreads: cover is single, then pairs, last might be single
  // Spread 0 = [cover, page-1]
  // Spread 1 = [page-2, page-3]
  // etc.
  const totalSpreads = Math.max(1, Math.ceil((pages.length + 1) / 2))

  // Get pages for current spread
  const getSpreadPages = (spread: number): { left: Page | null; right: Page | null } => {
    if (spread === 0) {
      // First spread: only right (cover)
      return { left: null, right: pages[0] || null }
    }
    const leftIdx = spread * 2 - 1
    const rightIdx = spread * 2
    return {
      left: pages[leftIdx] || null,
      right: pages[rightIdx] || null,
    }
  }

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
        const currentPack = PRESET_PACKS.find(p => p.id === meta.style_pack) || PRESET_PACKS[0]
        setSelectedPack(currentPack)
      }

      // Get paged data (new endpoint - may not be deployed yet)
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
          setHeadHtml(data.head_html || '')
          gotPages = true
        }
      } catch (e) { console.warn('Pages endpoint unavailable, falling back to preview') }

      // FALLBACK: use /preview endpoint and parse pages client-side
      if (!gotPages) {
        const previewRes = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/preview`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
        if (previewRes.ok) {
          const data = await previewRes.json()
          const html = data.html || ''
          // Parse pages from full HTML
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const sections = Array.from(doc.querySelectorAll('section.page'))
          const head = doc.head?.innerHTML || ''
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
          setHeadHtml(`<head>${head}<style>* {margin:0; padding:0; box-sizing:border-box;} body{background:white;} .page{width:100%;min-height:100vh;} img{display:block;max-width:100%;}</style></head>`)
        } else {
          setError(`Failed to render: ${previewRes.status}`)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally { setIsLoading(false) }
  }

  // Re-fetch pages with a new pack
  const switchPack = async (pack: StylePack) => {
    setSelectedPack(pack)
    setShowPacks(false)
    setIsRendering(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')

      // Try new pages endpoint
      let gotPages = false
      try {
        const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ style_pack_data: pack }),
        })
        if (res.ok) {
          const data = await res.json()
          setPages(data.pages || [])
          setHeadHtml(data.head_html || '')
          gotPages = true
        }
      } catch {}

      // Fallback: render-with-pack returns full HTML, parse pages
      if (!gotPages) {
        const res = await fetch(`${API_URL}/api/portfolios/${params.portfolioId}/render-with-pack`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ style_pack_data: pack }),
        })
        if (res.ok) {
          const data = await res.json()
          const html = data.html || ''
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const sections = Array.from(doc.querySelectorAll('section.page'))
          const head = doc.head?.innerHTML || ''
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
          setHeadHtml(`<head>${head}<style>* {margin:0; padding:0; box-sizing:border-box;} body{background:white;} .page{width:100%;min-height:100vh;} img{display:block;max-width:100%;}</style></head>`)
        }
      }
    } catch (e) {
      console.error('Switch pack failed:', e)
    } finally {
      setIsRendering(false)
    }
  }

  const flipTo = useCallback((targetSpread: number) => {
    if (isFlipping) return
    if (targetSpread < 0 || targetSpread >= totalSpreads) return
    setFlipDirection(targetSpread > spreadIndex ? 'next' : 'prev')
    setIsFlipping(true)
    setTimeout(() => {
      setSpreadIndex(targetSpread)
      setTimeout(() => setIsFlipping(false), 50)
    }, 300)
  }, [spreadIndex, totalSpreads, isFlipping])

  const next = () => flipTo(spreadIndex + 1)
  const prev = () => flipTo(spreadIndex - 1)

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spreadIndex, totalSpreads])

  const handlePrint = () => {
    // Build full HTML with all pages for print
    const allPagesHtml = pages.map(p => p.html).join('\n')
    const printDoc = `<!DOCTYPE html><html>${headHtml}<body>${allPagesHtml}<style>
      @media print { .page { page-break-after: always; } }
    </style></body></html>`
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(printDoc)
      w.document.close()
      setTimeout(() => w.print(), 500)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-white/70">Opening your portfolio book...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-lg">
        <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ Error</h2>
        <pre className="text-sm bg-red-50 p-4 rounded text-red-800 overflow-auto">{error}</pre>
        <button onClick={loadPortfolio} className="btn-primary mt-4">Retry</button>
      </div>
    </div>
  )

  const { left, right } = getSpreadPages(spreadIndex)
  const isFirstSpread = spreadIndex === 0
  const isLastSpread = spreadIndex === totalSpreads - 1

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-800 via-slate-900 to-black overflow-hidden">

      {/* Top Toolbar */}
      <div className="bg-black/40 backdrop-blur-lg border-b border-white/10 flex-shrink-0 z-50 px-4 py-2.5 flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/dashboard/project/${params.id}/generate`}
            className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1 whitespace-nowrap"
          >
            ← Back
          </Link>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="text-sm font-bold">📖 Portfolio Book</span>
        </div>

        <div className="flex gap-2 items-center">
          {isRendering && (
            <span className="text-xs text-blue-300 flex items-center gap-1">
              <span className="animate-spin">⟳</span> Updating style...
            </span>
          )}

          {/* Jump to page */}
          <div className="relative">
            <button
              onClick={() => setShowJump(!showJump)}
              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition flex items-center gap-1"
            >
              📑 Spread {spreadIndex + 1} / {totalSpreads}
            </button>
            {showJump && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-2xl p-2 w-64 max-h-80 overflow-y-auto z-50">
                {pages.map((p, idx) => {
                  const targetSpread = idx === 0 ? 0 : Math.floor((idx + 1) / 2)
                  return (
                    <button
                      key={p.id}
                      onClick={() => { flipTo(targetSpread); setShowJump(false) }}
                      className="w-full text-left px-3 py-2 rounded text-charcoal text-sm hover:bg-bg-subtle transition flex items-center gap-2"
                    >
                      <span>{
                        p.type === 'cover' ? '🏠' :
                        p.type === 'about' ? '👤' :
                        p.type === 'contents' ? '📋' :
                        p.type === 'end' ? '📞' : '🏗️'
                      }</span>
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto text-xs text-stone-light">p.{idx + 1}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Style picker */}
          <div className="relative">
            <button
              onClick={() => setShowPacks(!showPacks)}
              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition flex items-center gap-1"
              title="Change design pack"
            >
              <div className="flex h-3 w-12 rounded overflow-hidden">
                <div style={{ background: selectedPack.colors.primary, width: '30%' }} />
                <div style={{ background: selectedPack.colors.accent, width: '20%' }} />
                <div style={{ background: selectedPack.colors.background, width: '50%' }} />
              </div>
              <span className="ml-1">🎨</span>
            </button>
            {showPacks && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-2xl p-2 w-72 max-h-96 overflow-y-auto z-50">
                <div className="text-xs font-bold text-stone uppercase tracking-wider mb-2 px-2">Design Packs</div>
                {PRESET_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => switchPack(pack)}
                    className={`w-full text-left rounded mb-1 overflow-hidden border ${selectedPack.id === pack.id ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-border-light'}`}
                  >
                    <div className="flex h-6">
                      <div style={{ background: pack.colors.primary, width: '30%' }} />
                      <div style={{ background: pack.colors.secondary, width: '20%' }} />
                      <div style={{ background: pack.colors.accent, width: '15%' }} />
                      <div style={{ background: pack.colors.background, width: '35%' }} />
                    </div>
                    <div className="p-2 bg-white">
                      <div className="text-xs font-bold text-charcoal truncate" style={{ fontFamily: pack.typography.heading_font }}>
                        {pack.name}
                      </div>
                      <div className="text-[10px] text-stone-light truncate">{pack.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handlePrint}
            className="bg-white text-charcoal px-3 py-1.5 rounded text-xs font-semibold hover:bg-white/90"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Book Stage */}
      <div className="flex-1 relative flex items-center justify-center px-4 py-6 overflow-hidden">

        {/* Previous Edge */}
        {!isFirstSpread && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white text-2xl flex items-center justify-center transition group"
            title="Previous spread (←)"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">‹</span>
          </button>
        )}

        {/* Next Edge */}
        {!isLastSpread && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white text-2xl flex items-center justify-center transition group"
            title="Next spread (→)"
          >
            <span className="group-hover:translate-x-0.5 transition-transform">›</span>
          </button>
        )}

        {/* The Book */}
        <div
          className={`book-container ${isFlipping ? `flipping flip-${flipDirection}` : ''}`}
          style={{
            display: 'flex',
            maxWidth: '95%',
            maxHeight: '92%',
            aspectRatio: isFirstSpread || isLastSpread ? '0.707/1' : '1.414/1',
            background: '#1a1a1a',
            borderRadius: '4px',
            boxShadow: '0 30px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            position: 'relative',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Center spine shadow */}
          {!isFirstSpread && !isLastSpread && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '40px',
                marginLeft: '-20px',
                background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.25) 50%, transparent)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          )}

          {/* LEFT PAGE */}
          {left && (
            <div style={{ width: '50%', height: '100%', background: 'white', overflow: 'hidden', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
              <iframe
                srcDoc={`<!DOCTYPE html><html>${headHtml}<body>${left.html}</body></html>`}
                sandbox="allow-same-origin"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={left.name}
              />
            </div>
          )}

          {/* RIGHT PAGE (always shows on first spread = cover) */}
          {right && (
            <div style={{
              width: isFirstSpread || isLastSpread ? '100%' : '50%',
              height: '100%',
              background: 'white',
              overflow: 'hidden',
            }}>
              <iframe
                srcDoc={`<!DOCTYPE html><html>${headHtml}<body>${right.html}</body></html>`}
                sandbox="allow-same-origin"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={right.name}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom indicator */}
      <div className="bg-black/40 backdrop-blur-lg border-t border-white/10 flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2 text-white/60 text-xs">
        <span>← →</span>
        <span>Keyboard arrows to navigate</span>
        <span className="mx-3">·</span>
        <span>Click the edges to flip pages</span>
      </div>

      {/* Backdrop for dropdowns */}
      {(showPacks || showJump) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowPacks(false); setShowJump(false) }}
        />
      )}

      {/* Animations */}
      <style jsx>{`
        .book-container {
          transform-style: preserve-3d;
          transform-origin: center center;
        }
        .book-container.flipping.flip-next {
          animation: flipNext 0.5s ease-out;
        }
        .book-container.flipping.flip-prev {
          animation: flipPrev 0.5s ease-out;
        }
        @keyframes flipNext {
          0% { transform: rotateY(0deg) scale(1); opacity: 1; }
          50% { transform: rotateY(-12deg) scale(0.97); opacity: 0.85; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes flipPrev {
          0% { transform: rotateY(0deg) scale(1); opacity: 1; }
          50% { transform: rotateY(12deg) scale(0.97); opacity: 0.85; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
