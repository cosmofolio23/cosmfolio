'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'

interface Project {
  id: string
  title: string
  description?: string
  project_type: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [creatingType, setCreatingType] = useState<'portfolio' | 'sheet' | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    loadProjects()
  }, [isAuthenticated, router])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getProjects()
      setProjects(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectTitle.trim()) return

    try {
      // Create project with type
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newProjectTitle,
          project_type: creatingType || 'portfolio'
        })
      })

      if (res.ok) {
        const newProject = await res.json()
        setProjects([...projects, newProject])
        setNewProjectTitle('')
        setShowNewProject(false)
        setCreatingType(null)
        // Redirect directly to the newly created project
        router.push(`/dashboard/project/${newProject.id}`)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to create project:', errorData)
        alert(`Failed to create project: ${errorData.detail || res.statusText}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Please check your connection.')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure? This cannot be undone.')) {
      try {
        await apiClient.deleteProject(projectId)
        setProjects(projects.filter((p) => p.id !== projectId))
      } catch (error) {
        console.error('Failed to delete project:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg-subtle">
      {/* Header */}
      <header className="bg-white border-b border-border-light shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-6 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-charcoal">CosmoFolio</h1>
            <p className="text-stone-light mt-2">Welcome back, <span className="font-semibold text-slate">{user?.name || user?.email}</span></p>
          </div>
          <button
            onClick={() => router.push('/signin')}
            className="btn-tertiary text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-centered py-12 md:py-16">
        {/* What would you like to create? */}
        {!showNewProject && !creatingType && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-3">What would you like to create?</h2>
            <p className="text-stone-light mb-8 text-lg">Choose between a portfolio or presentation sheet</p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Portfolio Generator */}
              <div
                onClick={() => setCreatingType('portfolio')}
                className="card bg-white p-8 rounded-2xl cursor-pointer hover:shadow-elevation-3 hover:border-primary border border-border-light transition-all duration-200 group"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-200">📐</div>
                <h3 className="text-2xl font-bold text-charcoal mb-2">Portfolio Generator</h3>
                <p className="text-stone-light mb-6">
                  Create a professional architecture portfolio with your renders, plans, and projects.
                </p>
                <ul className="text-sm text-slate space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Upload renders & diagrams
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Multiple design themes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> AI-generated descriptions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Export as PDF or HTML
                  </li>
                </ul>
                <button className="btn-primary w-full">
                  Create Portfolio
                </button>
              </div>

              {/* Presentation Sheet Creator */}
              <div
                onClick={() => setCreatingType('sheet')}
                className="card bg-white p-8 rounded-2xl cursor-pointer hover:shadow-elevation-3 hover:border-primary border border-border-light transition-all duration-200 group"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-200">🎨</div>
                <h3 className="text-2xl font-bold text-charcoal mb-2">Presentation Sheet</h3>
                <p className="text-stone-light mb-6">
                  Create stunning presentation sheets for client pitches and competitions.
                </p>
                <ul className="text-sm text-slate space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> 6 professional templates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Image + text layouts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> AI descriptions & titles
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Multi-page exports
                  </li>
                </ul>
                <button className="btn-primary w-full">
                  Create Sheet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create New Project Section */}
        {creatingType && (
          <div className="mb-12">
            <div className="card p-8 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => {
                    setCreatingType(null)
                    setNewProjectTitle('')
                    setShowNewProject(false)
                  }}
                  className="text-stone-light hover:text-slate transition-colors flex items-center gap-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <h2 className="text-2xl font-semibold text-slate">
                  Create {creatingType === 'portfolio' ? 'Portfolio' : 'Presentation Sheet'}
                </h2>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder={creatingType === 'portfolio'
                      ? "e.g., Museum Redesign, Residential Tower"
                      : "e.g., Urban Park Proposal, Hotel Concept"}
                    className="input-field"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary">
                    Create {creatingType === 'portfolio' ? 'Portfolio' : 'Sheet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingType(null)
                      setNewProjectTitle('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects List */}
        {!creatingType && (
          <>
            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-block">
                  <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4"></div>
                  <p className="text-stone-light">Loading your projects...</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="card bg-white p-16 text-center">
                <div className="text-6xl mb-6 opacity-20">✨</div>
                <h3 className="text-2xl font-semibold text-slate mb-3">No projects yet</h3>
                <p className="text-stone-light mb-8 max-w-sm mx-auto">
                  Get started by creating your first portfolio or presentation sheet above.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold text-slate mb-8">
                  Your Projects
                  <span className="text-sm font-normal text-stone-light ml-2">({projects.length})</span>
                </h2>

                {/* Portfolio Projects */}
                {projects.filter((p) => p.project_type === 'portfolio').length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-lg font-semibold text-charcoal mb-6 flex items-center gap-2">
                      <span>📐</span> Portfolios
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects
                        .filter((p) => p.project_type === 'portfolio')
                        .map((project) => (
                          <Link key={project.id} href={`/dashboard/project/${project.id}`}>
                            <div className="card group bg-white overflow-hidden h-full hover:shadow-elevation-3 cursor-pointer">
                              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden relative">
                                <div className="text-5xl opacity-30">📐</div>
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-all duration-200"></div>
                              </div>
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-2 gap-3">
                                  <h3 className="text-lg font-semibold text-charcoal flex-1 group-hover:text-primary transition-colors">
                                    {project.title}
                                  </h3>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeleteProject(project.id)
                                    }}
                                    className="flex-shrink-0 text-stone-light hover:text-error transition-colors p-1 hover:bg-red-50 rounded"
                                    title="Delete project"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="badge badge-info">Portfolio</span>
                                  <span className="text-stone-light">
                                    {new Date(project.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {/* Sheet Projects */}
                {projects.filter((p) => p.project_type === 'sheet').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal mb-6 flex items-center gap-2">
                      <span>🎨</span> Presentation Sheets
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects
                        .filter((p) => p.project_type === 'sheet')
                        .map((project) => (
                          <Link key={project.id} href={`/dashboard/project/${project.id}`}>
                            <div className="card group bg-white overflow-hidden h-full hover:shadow-elevation-3 cursor-pointer">
                              <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center overflow-hidden relative">
                                <div className="text-5xl opacity-30">🎨</div>
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-all duration-200"></div>
                              </div>
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-2 gap-3">
                                  <h3 className="text-lg font-semibold text-charcoal flex-1 group-hover:text-primary transition-colors">
                                    {project.title}
                                  </h3>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeleteProject(project.id)
                                    }}
                                    className="flex-shrink-0 text-stone-light hover:text-error transition-colors p-1 hover:bg-red-50 rounded"
                                    title="Delete project"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="badge badge-success">Sheet</span>
                                  <span className="text-stone-light">
                                    {new Date(project.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
