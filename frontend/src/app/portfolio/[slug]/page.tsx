'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getSpec } from '@/components/composer/layoutSpecs'
import PageComposer from '@/components/composer/PageComposer'
import type { Page, DesignTokens } from '@/components/composer/types'

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
  }
}

export default function PublicPortfolioPage() {
  const params = useParams()
  const slug = params.slug as string
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading portfolio…</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The portfolio you are looking for does not exist.'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { project, document } = portfolio
  const pages = document.pages || []
  const tokens = document.tokens || {}
  const currentPage = pages[currentPageIdx]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-blue-500/30 flex flex-col relative overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Toast Notification State */}
      {/* (We handle toast via alert currently, but we can improve it later if needed, stick to alert or add a simple toast state) */}

      {/* Sleek Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/70 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
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
            <a
              href={`${API_URL}/api/projects/${project.id}/document/export-pdf`}
              download={`${project.title || 'portfolio'}.pdf`}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center relative z-10">
        
        {/* Sleek Page Navigation Pill */}
        {pages.length > 1 && (
          <div className="mb-12 p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full inline-flex items-center shadow-2xl max-w-full overflow-x-auto">
            {pages.map((page, idx) => (
              <button
                key={page.id}
                onClick={() => setCurrentPageIdx(idx)}
                className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  currentPageIdx === idx
                    ? 'text-black bg-white shadow-md scale-100'
                    : 'text-white/60 hover:text-white hover:bg-white/10 scale-95 hover:scale-100'
                }`}
              >
                <span className="capitalize">{page.type}</span>
              </button>
            ))}
          </div>
        )}

        {/* Portfolio Canvas */}
        {currentPage && (
          <div className="relative w-full max-w-[850px] mx-auto group">
            {/* Decorative subtle shadow/glow for the canvas */}
            <div className="absolute -inset-4 bg-white/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative aspect-[8.5/11] bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10 transition-transform duration-500 group-hover:-translate-y-1">
              <div
                className="w-full h-full bg-white"
                style={{
                  backgroundColor: tokens.background || '#FFFFFF',
                  color: tokens.text || '#000000',
                  fontFamily: `${tokens.bodyFont || 'system-ui'}, sans-serif`,
                }}
              >
                {/* Render page content */}
                <div className="p-8 md:p-12 h-full overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {currentPage.blocks.map((block) => (
                      <div key={block.id} className="mb-6 last:mb-0">
                        {block.type === 'title' && (
                          <h1
                            className="text-4xl md:text-5xl font-bold mb-3 tracking-tight leading-tight"
                            style={{
                              fontFamily: `${tokens.headingFont || 'Georgia'}, serif`,
                              color: tokens.primary || tokens.text,
                            }}
                          >
                            {block.text}
                          </h1>
                        )}
                        {block.type === 'subtitle' && (
                          <p
                            className="text-xl md:text-2xl mb-4 font-medium"
                            style={{ color: tokens.accent || tokens.text }}
                          >
                            {block.text}
                          </p>
                        )}
                        {block.type === 'description' && (
                          <p className="text-base leading-relaxed whitespace-pre-wrap opacity-90">
                            {block.text}
                          </p>
                        )}
                        {block.type === 'meta' && block.fields && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 my-6 p-5 bg-black/5 rounded-lg border border-black/5">
                            {block.fields.map((field, idx) => (
                              <div key={idx}>
                                <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">{field.label}</div>
                                <div className="text-sm font-medium">{field.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {(block.type === 'render' ||
                          block.type === 'plan' ||
                          block.type === 'section' ||
                          block.type === 'diagram') &&
                          block.imageUrl && (
                            <div className="my-6">
                              <img
                                src={block.imageUrl}
                                alt={block.label || block.type}
                                className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-sm"
                              />
                              {block.label && (
                                <p className="text-xs opacity-60 mt-3 italic text-center">{block.label}</p>
                              )}
                            </div>
                          )}
                        {block.type === 'legend' && block.legendItems && (
                          <div className="my-6 p-5 bg-black/5 rounded-lg">
                            <p className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70">
                              {block.label || 'Legend'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium">
                              {block.legendItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <span
                                    className="inline-block w-4 h-4 rounded-full shadow-sm"
                                    style={{ backgroundColor: tokens.accent || '#999' }}
                                  />
                                  <span className="opacity-90">{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Page indicator floating at bottom right (visible on large screens) */}
            <div className="absolute -right-12 bottom-12 text-white/30 text-sm font-bold -rotate-90 origin-bottom-right tracking-[0.3em] hidden xl:block">
              {String(currentPageIdx + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-white/50">
            Powered by <a href="/" className="text-white hover:text-blue-400 transition-colors font-bold">CosmoFolio</a>
          </p>
          <div className="text-xs text-white/40 font-medium">
            Published {new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </footer>

      {/* Add custom scrollbar styling globally for the canvas */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.2);
        }
      `}} />
    </div>
  )
}
