'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Portfolio Not Found</h1>
        <p className="text-gray-600">This portfolio doesn't exist or has been deleted.</p>
      </div>
    </div>
  )
}

export default function PublicPortfolioViewer() {
  const params = useParams()
  const projectId = params?.id as string
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/portfolios/${projectId}`)
        if (res.status === 404) {
          setNotFound(true)
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setPortfolio(data)
      } catch (error) {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    loadPortfolio()
  }, [projectId])

  if (loading) return <LoadingSpinner />
  if (notFound) return <NotFound />
  if (!portfolio) return <NotFound />

  const ds = portfolio.design_system_config
  const pages = portfolio.pages || []
  const page = pages[currentPage]

  return (
    <div className="min-h-screen" style={{ backgroundColor: ds?.bg || '#fff', color: ds?.text || '#000' }}>
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: ds?.accent || '#ccc' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{portfolio.title}</h1>
            <p className="text-sm opacity-70">by {portfolio.architect_name}</p>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="px-4 py-2 rounded text-sm font-medium text-white"
              style={{ backgroundColor: ds?.accent || '#0057FF' }}
            >
              {copied ? '✅ Copied!' : '🔗 Share'}
            </button>
            <div className="relative group">
              <button className="px-4 py-2 rounded text-sm font-medium border" style={{ borderColor: ds?.accent || '#0057FF', color: ds?.accent || '#0057FF' }}>
                📥 Download
              </button>
              <div className="absolute right-0 top-full hidden group-hover:block bg-white border rounded shadow-lg mt-2 z-50">
                <a href={`${API_URL}/api/public/portfolios/${projectId}/export?format=pdf`} className="block w-full px-4 py-2 text-sm hover:bg-gray-100">📄 PDF</a>
                <a href={`${API_URL}/api/public/portfolios/${projectId}/export?format=html`} className="block w-full px-4 py-2 text-sm hover:bg-gray-100">🌐 HTML</a>
                <a href={`${API_URL}/api/public/portfolios/${projectId}/export?format=zip`} className="block w-full px-4 py-2 text-sm hover:bg-gray-100">📦 ZIP</a>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ds?.secondary || '#f0f0f0' }} title="Share on LinkedIn">💼</button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ds?.secondary || '#f0f0f0' }} title="Share on Twitter">🐦</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {page && (
          <div className="min-h-screen p-8 flex flex-col justify-center">
            <h2 className="text-5xl font-bold mb-4" style={{ fontFamily: ds?.headerFont || 'Georgia' }}>
              {page.page_name}
            </h2>
            {page.content?.description && (
              <div className="prose max-w-none mb-12 text-lg" style={{ fontFamily: ds?.bodyFont || 'Inter' }}>
                {page.content.description}
              </div>
            )}
          </div>
        )}
      </main>

      {pages.length > 1 && (
        <footer className="sticky bottom-0 border-t" style={{ borderColor: ds?.accent || '#ccc' }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 rounded disabled:opacity-50 text-white"
              style={{ backgroundColor: currentPage > 0 ? ds?.accent : ds?.secondary }}
            >
              ← Previous
            </button>
            <div className="text-sm">Page {currentPage + 1} of {pages.length}</div>
            <button
              onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
              disabled={currentPage === pages.length - 1}
              className="px-4 py-2 rounded disabled:opacity-50 text-white"
              style={{ backgroundColor: currentPage < pages.length - 1 ? ds?.accent : ds?.secondary }}
            >
              Next →
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
