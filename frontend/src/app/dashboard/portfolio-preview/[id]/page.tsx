'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { getSpec } from '@/components/composer/layoutSpecs'
import type { Page, DesignTokens } from '@/components/composer/types'

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
    description?: string
  }
}

export default function PortfolioPreviewPage() {
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

      // Get project title
      const projRes = await fetch(`${API_URL}/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      const project = projRes.ok ? await projRes.json() : { title: 'Portfolio' }

      setPortfolio({
        document: data.document,
        project,
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

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
          <p className="text-gray-600 mb-4">
            {error === 'No portfolio created yet'
              ? 'Start by editing to add content to your portfolio.'
              : error || 'The portfolio you are looking for does not exist.'}
          </p>
          <Link
            href={`/dashboard/templates/default/editor?project=${projectId}`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 mb-3"
          >
            ✏️ Create Content
          </Link>
          <br />
          <Link
            href="/dashboard/my-portfolios"
            className="text-blue-600 hover:underline"
          >
            ← Back to Portfolio List
          </Link>
        </div>
      </div>
    )
  }

  const { document, project } = portfolio
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
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/templates/default/editor?project=${projectId}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                ✏️ Edit
              </Link>
              <Link
                href="/dashboard/my-portfolios"
                className="text-gray-500 hover:text-gray-700"
              >
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
                {/* Render page content */}
                <div className="p-6 h-full overflow-y-auto flex flex-col">
                  <div className="flex-1">
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
                            {block.text || 'Untitled'}
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Page Counter */}
            <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
              Page {currentPageIdx + 1} of {pages.length} · Layout: {getSpec(currentPage.layoutId).name}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href={`/dashboard/templates/default/editor?project=${projectId}`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            ✏️ Edit Portfolio
          </Link>
          <button
            onClick={() => {
              const url = window.location.href.replace('/dashboard/portfolio-preview/', '/portfolio/')
              window.location.href = `/dashboard/my-portfolios`
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            ← Back to List
          </button>
        </div>
      </main>
    </div>
  )
}
