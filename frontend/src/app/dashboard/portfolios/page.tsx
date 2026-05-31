'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface Portfolio {
  id: string
  title: string
  architect_name: string
  architect_bio?: string
  page_size: string
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export default function PortfoliosPage() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    architect_name: '',
    architect_bio: '',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    loadPortfolios()
  }, [isAuthenticated])

  const loadPortfolios = async () => {
    try {
      setLoading(true)
      setError(null)
      const savedToken = token || localStorage.getItem('auth_token')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/portfolios`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })

      if (res.ok) {
        const data = await res.json()
        setPortfolios(data)
      } else if (res.status === 401) {
        router.push('/signin')
      } else {
        setError('Failed to load portfolios')
      }
    } catch (e) {
      console.error('Error loading portfolios:', e)
      setError('Failed to load portfolios')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePortfolio = async () => {
    if (!newPortfolio.title || !newPortfolio.architect_name) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setCreating(true)
      const savedToken = token || localStorage.getItem('auth_token')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          title: newPortfolio.title,
          architect_name: newPortfolio.architect_name,
          architect_bio: newPortfolio.architect_bio || undefined,
          page_size: 'a4',
          page_orientation: 'portrait',
          margins: 'standard'
        })
      })

      if (res.ok) {
        const portfolio = await res.json()
        setPortfolios([portfolio, ...portfolios])
        setShowCreateDialog(false)
        setNewPortfolio({ title: '', architect_name: '', architect_bio: '' })
        setError(null)
        // Navigate to portfolio settings
        router.push(`/dashboard/portfolio/${portfolio.id}/settings`)
      } else {
        setError('Failed to create portfolio')
      }
    } catch (e) {
      console.error('Error creating portfolio:', e)
      setError('Failed to create portfolio')
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return

    try {
      const savedToken = token || localStorage.getItem('auth_token')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/portfolios/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${savedToken}` }
        }
      )

      if (res.ok) {
        setPortfolios(portfolios.filter(p => p.id !== id))
      } else {
        setError('Failed to delete portfolio')
      }
    } catch (e) {
      console.error('Error deleting portfolio:', e)
      setError('Failed to delete portfolio')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Portfolios</h1>
            <p className="text-sm text-gray-600 mt-1">Create and manage your architecture portfolios</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>✨</span> New Portfolio
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Create Portfolio Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Portfolio</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spring 2024 Portfolio"
                  value={newPortfolio.title}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Jane Doe"
                  value={newPortfolio.architect_name}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, architect_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  placeholder="Brief bio or tagline"
                  value={newPortfolio.architect_bio}
                  onChange={(e) => setNewPortfolio({ ...newPortfolio, architect_bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePortfolio}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {portfolios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No portfolios yet</h2>
            <p className="text-gray-600 mb-6">Create your first portfolio to get started</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <span>✨</span> Create Portfolio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{portfolio.title}</h3>
                  <p className="text-sm text-gray-600">{portfolio.architect_name}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {portfolio.is_published && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ✓ Published
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {portfolio.page_size.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(portfolio.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Views:</span>
                      <span className="font-medium">{portfolio.view_count}</span>
                    </div>
                  </div>

                  {portfolio.architect_bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{portfolio.architect_bio}</p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-6 py-3 border-t border-gray-100 flex gap-2">
                  <Link
                    href={`/dashboard/portfolio/${portfolio.id}/settings`}
                    className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    ⚙️ Settings
                  </Link>
                  <Link
                    href={`/dashboard/portfolio/${portfolio.id}/projects`}
                    className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                  >
                    📁 Projects
                  </Link>
                  <button
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
