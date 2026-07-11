'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import HTMLFlipBookRaw from 'react-pageflip'
import type { Page, DesignTokens, Block } from '@/components/composer/types'
import PageComposer from '@/components/composer/PageComposer'
import SpreadComposer from '@/components/composer/SpreadComposer'

// Error Boundary to catch react-pageflip crashes
class FlipbookErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Flipbook crashed:", error, errorInfo); }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Dynamically import react-pageflip with ssr: false to prevent "window is not defined" errors during server-side rendering
const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false }) as any

const API_URL = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? '/backend-proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app'))

interface PortfolioData {
  project: {
    id: string
    title: string
    description?: string
    slug: string
    created_at: string
    updated_at: string
    view_count: number
  }
  document: {
    title: string
    pages: Page[]
    tokens: DesignTokens
    templateId?: string
    publishing?: { pageSize?: any; [key: string]: any }
    pageSize?: any
  }
}

// Separate component for the flipbook page to use forwardRef
const PageCover = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page page-cover bg-white overflow-hidden shadow-sm" ref={ref} data-density="hard">
      {props.children}
    </div>
  )
})
PageCover.displayName = 'PageCover'

const BookPage = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return (
    <div className="page bg-white overflow-hidden shadow-sm border-r border-gray-100" ref={ref}>
      {props.children}
    </div>
  )
})
BookPage.displayName = 'BookPage'

export default function PublicPortfolioPage() {
  const params = useParams()
  const slug = params.slug as string
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [defaultZoom, setDefaultZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<any>(null)
  const pageFlipRef = useRef<any>(null)
  const handleInit = (ev: any) => {
    if (ev && ev.object) {
      pageFlipRef.current = ev.object
    } else {
      pageFlipRef.current = ev
    }
  }

  // Determine if portfolio is landscape or portrait safely at hook-level
  const savedPageSize = portfolio?.document?.publishing?.pageSize || portfolio?.document?.pageSize;
  const isLandscape = savedPageSize ? (savedPageSize.preset.includes('landscape') || savedPageSize.width > savedPageSize.height) : true;
  const pageSizeProp = savedPageSize || (isLandscape ? { width: 297, height: 210, preset: 'a4-landscape', name: 'A4 Landscape' } : { width: 210, height: 297, preset: 'a4-portrait', name: 'A4 Portrait' });
  const pageW = isLandscape ? 1080 : 760;
  const pageH = Math.round(pageW * (pageSizeProp.height / pageSizeProp.width));

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/public/${slug}`)
        if (!res.ok) throw new Error('Portfolio not found')
        const data = await res.json()
        setPortfolio(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadPortfolio()
  }, [slug])

  // Automatically calculate responsive zoom on mount and window resize
  useEffect(() => {
    if (isLoading || error || !portfolio) return
    const calcDefaultZoom = () => {
      if (containerRef.current) {
        const availableW = containerRef.current.offsetWidth - 64 // subtract padding
        const targetW = pageW * 2
        const fit = Math.min(availableW / targetW, 1)
        setDefaultZoom(fit)
        setZoom(fit)
      }
    }
    calcDefaultZoom()
    window.addEventListener('resize', calcDefaultZoom)
    return () => window.removeEventListener('resize', calcDefaultZoom)
  }, [isLoading, error, portfolio, pageW])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading portfolio…</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h1>
          <p className="text-white/60 mb-4">{error || 'The portfolio you are looking for does not exist.'}</p>
          <Link href="/dashboard" className="text-blue-400 hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { project, document } = portfolio
  const rawPages = document.pages || []
  const tokens = document.tokens || {}

  // Build physical book slots for react-pageflip
  type BookSlot = { id: string; page?: Page; isBlank?: boolean; part?: 'full' | 'left' | 'right' };
  let bookPages: BookSlot[] = [];

  
  // Portrait mode (side-by-side) logic - now applies to BOTH Portrait and Landscape!
  // Physical books are always side-by-side regardless of whether individual pages are portrait or landscape.
  let virtualPageNum = 1;
  for (let i = 0; i < rawPages.length; i++) {
    const p = rawPages[i];
    if (p.isSpread) {
      // A spread must start on an even virtual page number (left side of the book)
      if (virtualPageNum % 2 !== 0) {
        bookPages.push({ id: `blank-${p.id}-left-pad`, isBlank: true });
        virtualPageNum += 1;
      }
      bookPages.push({ id: `${p.id}-left`, page: p, part: 'left' });
      bookPages.push({ id: `${p.id}-right`, page: p, part: 'right' });
      virtualPageNum += 2;
    } else {
      bookPages.push({ id: p.id, page: p, part: 'full' });
      virtualPageNum += 1;
    }
  }
  // Pad to even length so the book has a proper back cover
  if (bookPages.length % 2 !== 0) {
    bookPages.push({ id: 'blank-pad-end', isBlank: true });
  }

  

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2.5))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25))
  const handleZoomFit = () => setZoom(defaultZoom)

  return (
    <div className="h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30 flex flex-col relative overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Sleek Header */}
      <header className="relative z-40 bg-[#0A0A0A]/40 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {project.title}
            </h1>
            {project.description && (
              <span className="hidden md:inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-white/50 border border-white/5">
                {project.description}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5" title="Total Views">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {project.view_count || 0}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copied to clipboard!')
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            {/* Download PDF button has been removed based on user request */}
          </div>
        </div>
      </header>

      {/* Main Content - Flipbook Canvas */}
      <main 
        ref={containerRef}
        className="flex-1 w-full max-w-[95vw] mx-auto relative z-10 pt-4 pb-24 overflow-auto custom-scrollbar"
      >
        <div className="min-h-full min-w-full w-fit mx-auto p-8">
          {bookPages.length > 0 ? (
            <div 
              className="relative shadow-2xl ring-1 ring-white/10 mx-auto transition-all duration-300 overflow-hidden"
              style={{
                 width: `${pageW * 2 * zoom}px`,
                 height: `${pageH * zoom}px`
              }}
            >
              <div
                style={{
                  width: `${pageW * 2}px`,
                  height: `${pageH}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              >
              <FlipbookErrorBoundary fallback={
                <div className="w-[850px] max-w-full bg-white rounded-xl overflow-hidden shadow-2xl mx-auto flex flex-col h-[1100px] max-h-[80vh] overflow-y-auto">
                  <div className="p-8 text-center bg-red-50 text-red-600 font-medium">
                    The 3D flipbook could not be loaded for this portfolio. Displaying standard view.
                  </div>
                  {bookPages.map((bookPage, idx) => (
                    <div key={bookPage.id} className="w-full bg-white border-b border-gray-100 p-8">
                       <h2 className="text-xl text-black font-bold mb-4 opacity-50">Slot {idx + 1}</h2>
                             <div className="w-full h-full relative">
                               {bookPage.isBlank ? (
                                  <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">Blank Page</div>
                               ) : (
                                  <PageComposer page={bookPage.page!} tokens={tokens} readonly={true} pageSize={pageSizeProp} showWatermark={false} onChange={() => {}} />
                               )}
                             </div>
                    </div>
                  ))}
                </div>
              }>
              <HTMLFlipBook
                ref={bookRef}
                onInit={handleInit}
                width={pageW}
                height={pageH}
                size="stretch"
                usePortrait={false}
                minWidth={315}
                maxWidth={5000}
                minHeight={400}
                maxHeight={5000}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className="demo-book"
                style={{ margin: '0 auto' }}
              >
                {bookPages.map((bookPage, idx) => {
                  const PageWrapper = (idx === 0 || idx === bookPages.length - 1) ? PageCover : BookPage;
                  if (bookPage.isBlank) {
                     return (
                       <PageWrapper key={bookPage.id}>
                         <div className="w-full h-full relative overflow-hidden bg-[#e0e0e0]" />
                       </PageWrapper>
                     )
                  }

                  if (bookPage.part === 'left' || bookPage.part === 'right') {
                     return (
                       <PageWrapper key={bookPage.id}>
                         <div className="w-full h-full relative overflow-hidden bg-white">
                           <div style={{ 
                             width: '200%', 
                             height: '100%', 
                             position: 'absolute', 
                             left: bookPage.part === 'right' ? '-100%' : '0', 
                             top: 0 
                           }}>
                             <SpreadComposer page={bookPage.page!} tokens={tokens} readonly={true} editMode={false} pageSize={pageSizeProp} showWatermark={false} onChange={() => {}} />
                           </div>
                         </div>
                       </PageWrapper>
                     )
                  }

                  return (
                    <PageWrapper key={bookPage.id}>
                      <div className="w-full h-full relative overflow-hidden bg-white">
                        {bookPage.page!.isSpread ? (
                           <SpreadComposer page={bookPage.page!} tokens={tokens} readonly={true} editMode={false} pageSize={pageSizeProp} showWatermark={false} onChange={() => {}} />
                        ) : (
                           <PageComposer page={bookPage.page!} tokens={tokens} readonly={true} pageSize={pageSizeProp} showWatermark={false} onChange={() => {}} />
                        )}
                      </div>
                    </PageWrapper>
                  )

                })}
              </HTMLFlipBook>
              </FlipbookErrorBoundary>
            </div>
              </div>
          ) : (
            <div className="text-white/50">No pages found in this portfolio.</div>
          )}
        </div>
      </main>

      {/* Floating Zoom Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
        <button 
          onClick={handleZoomOut}
          className="p-2 hover:bg-white/10 text-white rounded-full transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        
        <button 
          onClick={handleZoomFit}
          className="px-4 py-2 hover:bg-white/10 text-white text-xs font-bold tracking-wider uppercase rounded-full transition-colors"
          title="Fit to Screen"
        >
          {Math.round(zoom * 100)}%
        </button>
        
        <button 
          onClick={handleZoomIn}
          className="p-2 hover:bg-white/10 text-white rounded-full transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
      </div>

      {/* Fixed Page Navigation Overlay */}
      {bookPages.length > 0 && (
        <>
          <button 
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              pageFlipRef.current?.flipPrev();
            }}
            className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all shadow-lg hover:scale-110"
            title="Previous Page"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              pageFlipRef.current?.flipNext();
            }}
            className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all shadow-lg hover:scale-110"
            title="Next Page"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.3);
        }
      `}} />
    </div>
  )
}
