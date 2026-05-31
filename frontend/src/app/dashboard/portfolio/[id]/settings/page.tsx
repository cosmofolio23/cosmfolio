'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface Portfolio {
  id: string
  title: string
  description?: string
  architect_name: string
  architect_bio?: string
  page_size: string
  page_orientation: string
  margins: string
  is_published: boolean
}

const PAGE_SIZES = ['a4', 'a3', 'letter', 'tabloid', 'custom']
const ORIENTATIONS = ['portrait', 'landscape']
const MARGINS = ['compact', 'standard', 'generous', 'custom']

export default function PortfolioSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const portfolioId = params.id as string
  const { isAuthenticated, token } = useAuthStore()

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    architect_name: '',
    architect_bio: '',
    page_size: 'a4',
    page_orientation: 'portrait',
    margins: 'standard',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    loadPortfolio()
  }, [isAuthenticated])

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      setError(null)
      const savedToken = token || localStorage.getItem('auth_token')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/portfolios/${portfolioId}/settings`,
        {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        }
      )

      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
        setFormData({
          title: data.title || '',
          description: data.description || '',
          architect_name: data.architect_name || '',
          architect_bio: data.architect_bio || '',
          page_size: data.page_size || 'a4',
          page_orientation: data.page_orientation || 'portrait',
          margins: data.margins || 'standard',
        })
      } else if (res.status === 401) {
        router.push('/signin')
      } else if (res.status === 403) {
        setError('You do not have permission to edit this portfolio')
      } else {
        setError('Failed to load portfolio settings')
      }
    } catch (e) {
      console.error('Error loading portfolio:', e)
      setError('Failed to load portfolio settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.architect_name) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      const savedToken = token || localStorage.getItem('auth_token')

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/portfolios/${portfolioId}/settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${savedToken}`
          },
          body: JSON.stringify(formData)
        }
      )

      if (res.ok) {
        setSuccess('Portfolio settings saved successfully!')
        setPortfolio(await res.json())
        setTimeout(() => setSuccess(null), 3000)
      } else if (res.status === 401) {
        router.push('/signin')
      } else if (res.status === 403) {
        setError('You do not have permission to edit this portfolio')
      } else {
        setError('Failed to save portfolio settings')
      }
    } catch (e) {
      console.error('Error saving settings:', e)
      setError('Failed to save portfolio settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Portfolio not found</p>
          <Link href="/dashboard/portfolios" className="text-blue-600 hover:underline">
            Back to portfolios
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/portfolios" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Settings</h1>
              <p className="text-sm text-gray-600 mt-1">{portfolio.title}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Portfolio Information */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Portfolio Information</h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Spring 2024 Portfolio"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">The main title of your portfolio</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this portfolio"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Architect Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.architect_name}
                  onChange={(e) => setFormData({ ...formData, architect_name: e.target.value })}
                  placeholder="e.g., Jane Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Architect Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={formData.architect_bio}
                  onChange={(e) => setFormData({ ...formData, architect_bio: e.target.value })}
                  placeholder="Brief bio or professional tagline"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Page Settings */}
          <section className="mb-8 pb-8 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Page Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Size
                </label>
                <select
                  value={formData.page_size}
                  onChange={(e) => setFormData({ ...formData, page_size: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size.toUpperCase()}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Standard export page size</p>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select
                  value={formData.page_orientation}
                  onChange={(e) => setFormData({ ...formData, page_orientation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ORIENTATIONS.map((orient) => (
                    <option key={orient} value={orient}>
                      {orient.charAt(0).toUpperCase() + orient.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Page orientation</p>
              </div>

              {/* Margins */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margins
                </label>
                <select
                  value={formData.margins}
                  onChange={(e) => setFormData({ ...formData, margins: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {MARGINS.map((margin) => (
                    <option key={margin} value={margin}>
                      {margin.charAt(0).toUpperCase() + margin.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Page margins</p>
              </div>
            </div>
          </section>

          {/* Page Settings Preview */}
          <section className="mb-8 pb-8 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
              <div className="max-w-2xl mx-auto" style={{
                aspectRatio: formData.page_orientation === 'portrait' ? '210/297' : '297/210',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '4px',
              }}>
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">
                      {formData.page_size.toUpperCase()} - {formData.page_orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Margins: {formData.margins}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-8 flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href={`/dashboard/portfolio/${portfolioId}/projects`}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">📁</div>
            <div className="text-sm font-medium text-gray-900">Projects</div>
            <div className="text-xs text-gray-500">Manage projects</div>
          </Link>

          <Link
            href={`/dashboard/portfolio/${portfolioId}/pages`}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm font-medium text-gray-900">Pages</div>
            <div className="text-xs text-gray-500">Configure pages</div>
          </Link>

          <Link
            href={`/dashboard/portfolio/${portfolioId}/styles`}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">🎨</div>
            <div className="text-sm font-medium text-gray-900">Styles</div>
            <div className="text-xs text-gray-500">Design system</div>
          </Link>

          <Link
            href={`/dashboard/portfolio/${portfolioId}/export`}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition"
          >
            <div className="text-2xl mb-2">📥</div>
            <div className="text-sm font-medium text-gray-900">Export</div>
            <div className="text-xs text-gray-500">Download portfolio</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
