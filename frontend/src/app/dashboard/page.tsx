'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth'
import { useEntitlements } from '@/store/entitlements'
import { apiClient } from '@/lib/api'
import Logo from '@/components/Logo'
import DashboardHeader from '@/components/DashboardHeader'

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
  const { loaded, fetch: fetchEntitlements, has } = useEntitlements()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [creatingType, setCreatingType] = useState<'portfolio' | 'sheet' | null>(null)
  const router = useRouter()

  // MVP Launch Admin Check
  const isAdmin = user?.email === 'boseraj001@gmail.com'

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }

    fetchEntitlements()
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
      let currentToken = localStorage.getItem('auth_token')
      if (auth.currentUser) {
        currentToken = await auth.currentUser.getIdToken(true)
        useAuthStore.getState().setToken(currentToken)
      }

      // Create project with type
      const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
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
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary relative overflow-hidden">
      {/* Floating Elements for Glassmorphism Background */}
      <div className="fixed top-20 -left-20 w-96 h-96 bg-accent-primary/10 dark:bg-accent-gold/10 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-20 -right-20 w-80 h-80 bg-accent-gold/10 dark:bg-accent-primary/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="container-centered py-12 md:py-16">
        {/* Quick Access */}
        <div className="mb-12 flex gap-3 flex-wrap">
          <Link
            href="/dashboard/templates"
            className="inline-block bg-gradient-to-br from-[#D4AF37] to-[#9C7416] rounded-xl px-6 py-4 text-white hover:shadow-lg hover:brightness-105 transition font-semibold text-sm"
          >
            🎨 Portfolio Using Preset Templates →
          </Link>
          <Link
            href="/dashboard/my-portfolios"
            className="inline-block glass-gold px-6 py-4 text-text-primary dark:text-dark-text-primary hover:shadow-lg hover:brightness-105 transition font-semibold text-sm"
          >
            📚 My Portfolios →
          </Link>
          {isAdmin ? (
            <Link
              href="/dashboard/sheets"
              className="inline-block glass-gold px-6 py-4 text-text-primary dark:text-dark-text-primary hover:shadow-lg hover:brightness-105 transition font-semibold text-sm"
            >
              📄 Sheet Composer →
            </Link>
          ) : (
            <button
              onClick={() => alert("Sheet Composer is launching very soon! Stay tuned.")}
              className="inline-block glass-gold px-6 py-4 text-text-primary dark:text-dark-text-primary opacity-80 hover:opacity-100 transition font-semibold text-sm cursor-pointer"
            >
              📄 Sheet Composer <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#FBE7A1]/50 text-[#9C7416] font-medium">Coming Soon</span>
            </button>
          )}
          {loaded && has('library') && (
            <Link
              href="/dashboard/library"
              className="inline-block glass-gold px-6 py-4 text-text-primary dark:text-dark-text-primary hover:shadow-lg hover:brightness-105 transition font-semibold text-sm"
            >
              🗂️ Project Library →
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/analytics"
              className="inline-block glass-gold px-6 py-4 text-text-primary dark:text-dark-text-primary hover:shadow-lg hover:brightness-105 transition font-semibold text-sm"
            >
              📊 Analytics →
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              className="inline-block bg-accent-gold/20 border border-accent-gold/50 rounded-xl px-6 py-4 text-text-primary dark:text-dark-text-primary hover:shadow-lg hover:bg-accent-gold/30 transition font-semibold text-sm"
            >
              🔑 Admin Dashboard →
            </Link>
          )}
        </div>

        {/* Student Tools - Hidden for MVP Launch */}
        {isAdmin && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              🛠️ Student Tools
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBE7A1]/50 text-[#9C7416] font-medium">New</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { href: '/dashboard/drawing-processor', icon: '🖌️', name: 'Drawing Processor', desc: 'Style CAD exports — no Photoshop' },
                { href: '/dashboard/tools/entourage', icon: '🌳', name: 'Entourage Studio', desc: 'People, trees, cars at true scale' },
                { href: '/dashboard/tools/site-analysis', icon: '🗺️', name: 'Site Analysis', desc: 'Sun, wind, land use sheets' },
                { href: '/dashboard/tools/concept-diagram', icon: '💭', name: 'Concept Diagrams', desc: 'Bubbles, zoning, circulation' },
                { href: '/dashboard/tools/scale-north', icon: '🧭', name: 'Scale & North', desc: 'Perfect bars + 25 arrows' },
                { href: '/dashboard/tools/cv', icon: '📄', name: 'CV Generator', desc: 'CV that matches your portfolio' },
              ].map(t => (
                <Link key={t.href} href={t.href}
                  className="glass-card rounded-xl p-4 hover:shadow-lg transition group">
                  <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">{t.icon}</div>
                  <div className="text-sm font-bold text-text-primary dark:text-dark-text-primary">{t.name}</div>
                  <div className="text-[11px] text-text-secondary dark:text-dark-text-secondary mt-0.5 leading-tight">{t.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* What would you like to create? - Hidden for MVP Launch */}
        {isAdmin && !showNewProject && !creatingType && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-charcoal mb-3">What would you like to create?</h2>
            <p className="text-stone-light mb-8 text-lg">Choose between a portfolio or presentation sheet</p>

            <div className="grid md:grid-cols-2 gap-8 relative z-10">
              {/* Portfolio Generator */}
              <div
                onClick={() => setCreatingType('portfolio')}
                className="glass-card p-8 rounded-2xl cursor-pointer transition-all duration-300 group"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-200">📐</div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Portfolio Generator</h3>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-6">
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
                className="glass-card p-8 rounded-2xl cursor-pointer transition-all duration-300 group"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-200">🎨</div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Presentation Sheet</h3>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-6">
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
          <div className="mb-12 relative z-10">
            <div className="glass-card rounded-2xl p-8">
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
              <div className="glass-card rounded-2xl p-16 text-center relative z-10">
                <div className="text-6xl mb-6 opacity-40">✨</div>
                <h3 className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary mb-3">No projects yet</h3>
                <p className="text-text-secondary dark:text-dark-text-secondary mb-8 max-w-sm mx-auto">
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
                          <div 
                            key={project.id} 
                            onClick={() => router.push(`/dashboard/templates/saved/editor?project=${project.id}`)}
                            className="glass-card rounded-2xl group overflow-hidden h-full cursor-pointer relative z-10"
                          >
                            <div className="h-48 bg-gradient-to-br from-blue-100/50 to-blue-200/50 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center overflow-hidden relative">
                              <div className="text-5xl opacity-40">📐</div>
                              <div className="absolute inset-0 bg-white/20 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                            </div>
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-2 gap-3">
                                <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary flex-1 group-hover:text-accent-gold transition-colors">
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
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    router.push(`/dashboard/templates/saved/editor?project=${project.id}`)
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition relative z-20"
                                >
                                  ✏️ Edit
                                </button>
                              </div>
                            </div>
                          </div>
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
                          <Link key={project.id} href={`/dashboard/project/${project.id}/sheet`}>
                            <div className="glass-card rounded-2xl group overflow-hidden h-full cursor-pointer relative z-10">
                              <div className="h-48 bg-gradient-to-br from-amber-100/50 to-amber-200/50 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center overflow-hidden relative">
                                <div className="text-5xl opacity-40">🎨</div>
                                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                              </div>
                              <div className="p-6">
                                <div className="flex items-start justify-between mb-2 gap-3">
                                  <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary flex-1 group-hover:text-accent-gold transition-colors">
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
