'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')

interface Page {
  id: string
  type: string
  name: string
  html: string
}

export default function PublicPortfolioPage() {
  const params = useParams()
  const [pages, setPages] = useState<Page[]>([])
  const [headHtml, setHeadHtml] = useState<string>('')
  const [meta, setMeta] = useState<{ title: string; author: string }>({ title: 'Portfolio', author: '' })
  const [spreadIndex, setSpreadIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
  const [isFlipping, setIsFlipping] = useState(false)

  const totalSpreads = Math.max(1, Math.ceil((pages.length + 1) / 2))

  const getSpreadPages = (spread: number): { left: Page | null; right: Page | null } => {
    if (spread === 0) return { left: null, right: pages[0] || null }
    return {
      left: pages[spread * 2 - 1] || null,
      right: pages[spread * 2] || null,
    }
  }

  useEffect(() => {
    loadPortfolio()
  }, [params.slug])

  // Set page title
  useEffect(() => {
    if (meta.title) {
      document.title = `${meta.title}${meta.author ? ` — ${meta.author}` : ''}`
    }
  }, [meta])

  const loadPortfolio = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/portfolios/public/p/${params.slug}/pages`, {
        method: 'POST',
      })
      if (!res.ok) {
        if (res.status === 404) {
          setError('This portfolio is not public, or the link is invalid.')
        } else {
          setError(`Failed to load: ${res.status}`)
        }
        setIsLoading(false)
        return
      }
      const data = await res.json()
      setPages(data.pages || [])
      setHeadHtml(data.head_html || '')
      if (data.meta) setMeta(data.meta)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  const flipTo = useCallback((target: number) => {
    if (isFlipping) return
    if (target < 0 || target >= totalSpreads) return
    setFlipDirection(target > spreadIndex ? 'next' : 'prev')
    setIsFlipping(true)
    setTimeout(() => {
      setSpreadIndex(target)
      setTimeout(() => setIsFlipping(false), 50)
    }, 300)
  }, [spreadIndex, totalSpreads, isFlipping])

  const next = () => flipTo(spreadIndex + 1)
  const prev = () => flipTo(spreadIndex - 1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spreadIndex, totalSpreads])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-white/70">Opening portfolio...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-black p-6 text-white">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4 opacity-30">📕</div>
        <h2 className="text-2xl font-bold mb-3">Portfolio unavailable</h2>
        <p className="text-white/70">{error}</p>
        <a href="https://cosmofolio.vercel.app" className="inline-block mt-6 text-white/80 underline text-sm">Create your own portfolio →</a>
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
          <span className="text-sm font-bold truncate">📖 {meta.title}</span>
          {meta.author && <>
            <span className="text-white/40">·</span>
            <span className="text-xs text-white/70 truncate">{meta.author}</span>
          </>}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-white/60">Spread {spreadIndex + 1} / {totalSpreads}</span>
        </div>
      </div>

      {/* Book Stage */}
      <div className="flex-1 relative flex items-center justify-center px-4 py-6 overflow-hidden">

        {!isFirstSpread && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white text-2xl flex items-center justify-center transition group"
            title="Previous spread (←)"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">‹</span>
          </button>
        )}

        {!isLastSpread && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white text-2xl flex items-center justify-center transition group"
            title="Next spread (→)"
          >
            <span className="group-hover:translate-x-0.5 transition-transform">›</span>
          </button>
        )}

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

      {/* Footer - watermark */}
      <div className="bg-black/40 backdrop-blur-lg border-t border-white/10 flex-shrink-0 px-4 py-2 flex items-center justify-between gap-3 text-white/50 text-xs">
        <span>← → arrows · click edges</span>
        <a
          href="https://cosmofolio.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/80 transition"
        >
          Made with Cosmofolio ✨
        </a>
      </div>

      <style jsx>{`
        .book-container { transform-style: preserve-3d; transform-origin: center center; }
        .book-container.flipping.flip-next { animation: flipNext 0.5s ease-out; }
        .book-container.flipping.flip-prev { animation: flipPrev 0.5s ease-out; }
        @keyframes flipNext { 0% { transform: rotateY(0deg) scale(1); opacity: 1; } 50% { transform: rotateY(-12deg) scale(0.97); opacity: 0.85; } 100% { transform: rotateY(0deg) scale(1); opacity: 1; } }
        @keyframes flipPrev { 0% { transform: rotateY(0deg) scale(1); opacity: 1; } 50% { transform: rotateY(12deg) scale(0.97); opacity: 0.85; } 100% { transform: rotateY(0deg) scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}
