'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import type { Page, DesignTokens } from '@/components/composer/types'
import PageComposer from '@/components/composer/PageComposer'

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
    slug?: string
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
        window.setTimeout(() => window.print(), 1000)
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
  const publishing = (document as any).publishing || {}
  const pageSize = publishing.pageSize
  const currentPage = pages[currentPageIdx]
  const totalPages = pages.length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col print:bg-white print:bg-none print:min-h-0 print:block">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 print:hidden">
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
                const url = `/portfolio/${project.slug || project.id || projectId}`
                window.open(url, '_blank')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Share
            </button>
            <Link
              href={`/dashboard/portfolio-web/${projectId}`}
              className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              🌐 Web
            </Link>
            <button
              onClick={() => window.print()}
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
      <main className="flex-1 flex flex-col items-center justify-start p-8 print:p-0">
        
        {/* Screen View (Single Page) */}
        {currentPage && (
          <div className="w-full max-w-4xl print:hidden flex justify-center">
            <PageComposer
              page={currentPage}
              tokens={tokens}
              onChange={() => {}}
              onUploadImage={() => Promise.resolve('')}
              backgrounds={publishing.backgrounds?.filter((b: any) => b.appliesTo === 'entire-project' || !b.pageId || b.pageId === currentPage.id)}
              masterElements={publishing.masterPages?.flatMap((m: any) => m.elements)}
              pageContext={{ pageNumber: currentPageIdx + 1, totalPages, projectTitle: project.title, projectNumber: String(currentPageIdx + 1).padStart(2, '0') }}
              grid={publishing.grid}
              editableFree={false}
              onFreeChange={() => {}}
              onApplyScope={() => {}}
              pages={pages}
              onUpdateGlobalPages={() => {}}
              overflowVisible={true}
              onUpdateMasterElement={() => {}}
              pageSize={pageSize}
            />
          </div>
        )}

        {/* Print View (All Pages) */}
        <div className="hidden print:flex flex-col w-full items-center m-0 p-0">
          {pages.map((p, idx) => (
            <div key={p.id} className="w-full relative" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
              <PageComposer
                page={p}
                tokens={tokens}
                onChange={() => {}}
                onUploadImage={() => Promise.resolve('')}
                backgrounds={publishing.backgrounds?.filter((b: any) => b.appliesTo === 'entire-project' || !b.pageId || b.pageId === p.id)}
                masterElements={publishing.masterPages?.flatMap((m: any) => m.elements)}
                pageContext={{ pageNumber: idx + 1, totalPages, projectTitle: project.title, projectNumber: String(idx + 1).padStart(2, '0') }}
                grid={publishing.grid}
                editableFree={false}
                onFreeChange={() => {}}
                onApplyScope={() => {}}
                pages={pages}
                onUpdateGlobalPages={() => {}}
                overflowVisible={false}
                onUpdateMasterElement={() => {}}
                pageSize={pageSize}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Navigation */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 print:hidden">
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
