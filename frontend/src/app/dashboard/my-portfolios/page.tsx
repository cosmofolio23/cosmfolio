'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Project {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  is_published?: boolean
  slug?: string
  view_count?: number
  status?: string
}

export default function MyPortfoliosPage() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    loadProjects()
  }, [isAuthenticated])

  const authToken = () => token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (e) {
      console.error('Failed to load projects:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewPortfolio = async () => {
    if (!newTitle.trim()) {
      alert('Please enter a portfolio title')
      return
    }
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          project_type: 'portfolio',
        }),
      })
      if (res.ok) {
        const newProject = await res.json()
        setProjects([newProject, ...projects])
        setShowNewModal(false)
        setNewTitle('')
        setNewDescription('')
        // Redirect to editor
        router.push(`/dashboard/templates/default/editor?project=${newProject.id}`)
      }
    } catch (e) {
      alert('Failed to create portfolio')
    }
  }

  const publishPortfolio = async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, is_published: true, slug: data.slug }
              : p
          )
        )
        alert(`✓ Published! Share URL: /portfolio/${data.slug}`)
      }
    } catch (e) {
      alert('Failed to publish')
    }
  }

  const unpublishPortfolio = async (projectId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/unpublish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      if (res.ok) {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, is_published: false, slug: undefined }
              : p
          )
        )
        alert('✓ Unpublished')
      }
    } catch (e) {
      alert('Failed to unpublish')
    }
  }

  const deletePortfolio = async (projectId: string) => {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken()}` },
      })
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== projectId))
        alert('✓ Deleted')
      }
    } catch (e) {
      alert('Failed to delete')
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="md" variant="gold" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Portfolios</h1>
                <p className="text-gray-600 mt-1">Create, edit, and share your portfolios</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              + New Portfolio
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading portfolios…</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No portfolios yet</h3>
            <p className="text-gray-600 mb-6">Create your first portfolio to get started</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Create Portfolio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {project.is_published ? (
                      <>
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs font-medium text-green-700">Published</span>
                        <span className="text-xs text-gray-500">
                          ({project.view_count || 0} views)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-xs font-medium text-gray-700">Draft</span>
                      </>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500">
                    <p>Created {new Date(project.created_at).toLocaleDateString()}</p>
                    <p>Updated {new Date(project.updated_at).toLocaleDateString()}</p>
                  </div>

                  {/* Share URL */}
                  {project.is_published && project.slug && (
                    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Share URL:</p>
                      <code className="text-xs text-blue-700 font-mono break-all">
                        /portfolio/{project.slug}
                      </code>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t space-y-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/templates/default/editor?project=${project.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 text-center"
                    >
                      ✏️ Edit
                    </Link>
                    {project.is_published && project.slug ? (
                      <button
                        onClick={() => unpublishPortfolio(project.id)}
                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300"
                      >
                        🔒 Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => publishPortfolio(project.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                      >
                        🌐 Publish
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {project.is_published && project.slug && (
                      <Link
                        href={`/portfolio/${project.slug}`}
                        className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 text-xs font-medium rounded hover:bg-indigo-200 text-center"
                      >
                        👁️ View
                      </Link>
                    )}
                    <button
                      onClick={() => deletePortfolio(project.id)}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Portfolio Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Portfolio</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Residential Projects 2024"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && createNewPortfolio()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., My best residential architecture work"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && createNewPortfolio()}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={createNewPortfolio}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
