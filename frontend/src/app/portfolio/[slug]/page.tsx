'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getSpec } from '@/components/composer/layoutSpecs'
import PageComposer from '@/components/composer/PageComposer'
import type { Page, DesignTokens } from '@/components/composer/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ('https://cosmfolio-backend.onrender.com')

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                {project.view_count} views
              </span>
              <button
                onClick={() => {
                  const url = window.location.href
                  navigator.clipboard.writeText(url)
                  alert('Link copied to clipboard!')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                📋 Share
              </button>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Navigation */}
        {pages.length > 1 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-4">
              {pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIdx(idx)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition ${
                    currentPageIdx === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{page.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Canvas */}
        {currentPage && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* A4 Canvas */}
            <div className="aspect-[8.5/11] bg-gray-100 flex items-center justify-center p-8">
              <div
                className="w-full h-full bg-white shadow-lg overflow-hidden"
                style={{
                  backgroundColor: tokens.background || '#FFFFFF',
                  color: tokens.text || '#000000',
                  fontFamily: `${tokens.bodyFont || 'system-ui'}, sans-serif`,
                }}
              >
                {/* Render page content with minimal container padding */}
                <div className="p-6 h-full overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    {currentPage.blocks.map((block) => (
                      <div key={block.id} className="mb-4">
                        {block.type === 'title' && (
                          <h1
                            className="text-4xl font-bold mb-2"
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
                            className="text-xl mb-2"
                            style={{ color: tokens.accent || tokens.text }}
                          >
                            {block.text}
                          </p>
                        )}
                        {block.type === 'description' && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {block.text}
                          </p>
                        )}
                        {block.type === 'meta' && block.fields && (
                          <div className="grid grid-cols-2 gap-4 text-xs my-4 p-3 bg-gray-50 rounded">
                            {block.fields.map((field, idx) => (
                              <div key={idx}>
                                <div className="font-semibold text-gray-600 uppercase">{field.label}</div>
                                <div className="mt-1">{field.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {(block.type === 'render' ||
                          block.type === 'plan' ||
                          block.type === 'section' ||
                          block.type === 'diagram') &&
                          block.imageUrl && (
                            <div className="my-4">
                              <img
                                src={block.imageUrl}
                                alt={block.label || block.type}
                                className="w-full h-auto max-h-96 object-cover rounded border border-gray-200"
                              />
                              {block.label && (
                                <p className="text-xs text-gray-500 mt-2 italic">{block.label}</p>
                              )}
                            </div>
                          )}
                        {block.type === 'legend' && block.legendItems && (
                          <div className="my-4 p-3 bg-gray-100 rounded">
                            <p className="text-xs font-semibold text-gray-700 uppercase mb-2">
                              {block.label || 'Legend'}
                            </p>
                            <div className="space-y-1 text-xs">
                              {block.legendItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span
                                    className="inline-block w-3 h-3 rounded"
                                    style={{ backgroundColor: tokens.accent || '#999' }}
                                  />
                                  <span>{item.label}</span>
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

            {/* Page Counter */}
            <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
              Page {currentPageIdx + 1} of {pages.length}
            </div>
          </div>
        )}

        {/* Download PDF */}
        <div className="mt-8 flex justify-center">
          <a
            href={`${API_URL}/api/projects/${project.id}/document/export-pdf`}
            download={`${project.title || 'portfolio'}.pdf`}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            📥 Download as PDF
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Created with <span className="text-red-500">❤️</span> using CosmoFolio
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
