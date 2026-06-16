'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import Logo from '@/components/Logo'

interface Project {
  id: string
  title: string
  description?: string
  project_type: string
  status: string
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || ('https://cosmfolio-backend.onrender.com')

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadProject()
  }, [isAuthenticated])

  const loadProject = async () => {
    try {
      const savedToken = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/projects/${params.id}`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) setProject(await res.json())
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-subtle">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-light">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-subtle">
      {/* Header */}
      <header className="bg-white border-b border-border-light shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-4 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-stone-light hover:text-slate transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="divider h-6"></div>
            <Logo size="sm" variant="gold" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-charcoal">{project?.title || 'Loading...'}</h1>
            </div>
          </div>
          <Link
            href={`/dashboard/project/${params.id}/portfolio`}
            className="btn-primary flex items-center gap-2"
          >
            <span>✨</span>
            Create Portfolio
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-centered py-12 md:py-16">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-stone-light">Loading project...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Project Info Card */}
            <div className="bg-white rounded-2xl p-8 shadow-elevation-1 mb-8">
              <h2 className="text-2xl font-bold text-charcoal mb-4">📋 Project Overview</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-stone uppercase tracking-wide">Project Type</label>
                  <p className="text-lg text-charcoal mt-1">{project?.project_type || 'N/A'}</p>
                </div>
                {project?.description && (
                  <div>
                    <label className="text-sm font-semibold text-stone uppercase tracking-wide">Description</label>
                    <p className="text-charcoal mt-1">{project.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-stone uppercase tracking-wide">Created</label>
                  <p className="text-charcoal mt-1">{new Date(project?.created_at || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-white text-center">
              <h2 className="text-3xl font-bold mb-3">Ready to create your portfolio?</h2>
              <p className="text-blue-100 mb-8">
                Use the wizard to configure your portfolio, upload images, and customize pages.
              </p>
              <Link
                href={`/dashboard/project/${params.id}/portfolio`}
                className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              >
                ✨ Start Portfolio Wizard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
