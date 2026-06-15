'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import type { Page, DesignTokens } from '@/components/composer/types'
import { BackgroundLayers, MasterElements } from '@/components/composer/PublishingLayers'
import { FreeCanvas } from '@/components/composer/FreeCanvas'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PortfolioData {
  document: {
    title: string
    pages: Page[]
    tokens: DesignTokens
  }
  project: {
    id: string
    title: string
  }
}

export default function PortfolioBookPage() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, token } = useAuthStore()
  const projectId = params.id as string

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const authToken = () => token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    loadPortfolio()
  }, [isAuthenticated])

  const loadPortfolio = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/document`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      if (!res.ok) throw new Error('Portfolio not found')
      const data = await res.json()
      if (!data.exists || !data.document) throw new Error('No portfolio created yet')

      const projRes = await fetch(`${API_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      const project = projRes.ok ? await projRes.json() : { title: 'Portfolio' }

      setPortfolio({
        document: data.document,
        project,
      })
      // Auto-open the print dialog when opened as a PDF fallback (?print=1)
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1') {
        window.setTimeout(() => window.print(), 800)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading portfolio…</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h1>
          <p className="text-gray-400 mb-4">
            {error === 'No portfolio created yet' ? 'Create content first' : error || 'Not found'}
          </p>
          <Link href="/dashboard/my-portfolios" className="text-blue-400 hover:underline">
            ← Back to Portfolios
          </Link>
        </div>
      </div>
    )
  }

  const { document, project } = portfolio
  const pages = document.pages || []
  const tokens = document.tokens || {}
  const currentPage = pages[currentPageIdx]
  const totalPages = pages.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/my-portfolios" className="text-gray-400 hover:text-white text-sm">
              ← Back
            </Link>
            <h1 className="text-white font-semibold">📖 {project.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-300 text-sm">{currentPageIdx + 1}/{totalPages}</span>
            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-white text-xs">
              {Math.round(((currentPageIdx + 1) / totalPages) * 100)}%
            </div>
            <button
              onClick={() => {
                const url = `/portfolio/${project.id}`
                window.open(url, '_blank')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Share
            </button>
            <button
              onClick={async () => {
                const res = await fetch(`${API_URL}/api/projects/${projectId}/document/export-pdf`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${authToken()}` },
                })
                if (res.ok) {
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  if (typeof window !== 'undefined') {
                    const a = window.document.createElement('a')
                    a.href = url
                    a.download = `${project.title}.pdf`
                    a.click()
                  }
                }
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
            >
              PDF
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewer */}
      <main className="flex-1 flex items-center justify-center p-8">
        {currentPage && (
          <div className="w-full max-w-2xl">
            {/* Book/Card Style View */}
            <div
              className="relative bg-white rounded-lg shadow-2xl overflow-hidden aspect-[8.5/11] flex flex-col"
              style={{
                backgroundColor: tokens.background || '#FFFFFF',
                color: tokens.text || '#000000',
                fontFamily: `${tokens.bodyFont || 'system-ui'}, sans-serif`,
              }}
            >
              {/* Publishing layers from the document */}
              <BackgroundLayers backgrounds={(document as any).publishing?.backgrounds} />
              <MasterElements
                elements={(document as any).publishing?.masterPages?.flatMap((m: any) => m.elements)}
                ctx={{ pageNumber: currentPageIdx + 1, totalPages, projectTitle: project.title, projectNumber: String(currentPageIdx + 1).padStart(2, '0') }}
                tokens={tokens as DesignTokens}
              />
              {currentPage.freeElements?.length ? (
                <FreeCanvas elements={currentPage.freeElements} onChange={() => {}} tokens={tokens as DesignTokens} editable={false} />
              ) : null}
              <div className="relative z-10 p-12 h-full overflow-y-auto flex flex-col justify-start">
                {currentPage.blocks.map((block) => (
                  <div key={block.id} className="mb-6">
                    {block.type === 'title' && (
                      <h1
                        className="text-5xl font-bold mb-4"
                        style={{
                          fontFamily: `${tokens.headingFont || 'Georgia'}, serif`,
                          color: tokens.primary || tokens.text,
                        }}
                      >
                        {block.text || 'Untitled'}
                      </h1>
                    )}
                    {block.type === 'subtitle' && (
                      <p
                        className="text-2xl mb-4"
                        style={{ color: tokens.accent || tokens.text }}
                      >
                        {block.text}
                      </p>
                    )}
                    {block.type === 'description' && (
                      <p className="text-base leading-relaxed whitespace-pre-wrap">
                        {block.text}
                      </p>
                    )}
                    {block.type === 'meta' && block.fields && (
                      <div className="grid grid-cols-2 gap-6 text-sm my-6 p-4 bg-gray-50 rounded">
                        {block.fields.map((field, idx) => (
                          <div key={idx}>
                            <div className="font-semibold text-gray-700 uppercase text-xs">{field.label}</div>
                            <div className="mt-2 text-gray-900">{field.value}</div>
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
                            className="w-full h-auto max-h-96 object-cover rounded border border-gray-300"
                          />
                          {block.label && (
                            <p className="text-xs text-gray-600 mt-3 italic">{block.label}</p>
                          )}
                        </div>
                      )}
                    {block.type === 'legend' && block.legendItems && (
                      <div className="my-6 p-4 bg-gray-100 rounded">
                        <p className="text-xs font-semibold text-gray-800 uppercase mb-3">
                          {block.label || 'Legend'}
                        </p>
                        <div className="space-y-2 text-sm">
                          {block.legendItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span
                                className="inline-block w-4 h-4 rounded"
                                style={{ backgroundColor: tokens.accent || '#999' }}
                              />
                              <span className="text-gray-700">{item.label}</span>
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
        )}
      </main>

      {/* Navigation */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentPageIdx(Math.max(0, currentPageIdx - 1))}
            disabled={currentPageIdx === 0}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPageIdx(idx)}
                className={`w-2 h-2 rounded-full transition ${
                  idx === currentPageIdx ? 'bg-blue-500 w-4' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPageIdx(Math.min(totalPages - 1, currentPageIdx + 1))}
            disabled={currentPageIdx === totalPages - 1}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            Next →
          </button>
        </div>
      </footer>
    </div>
  )
}
