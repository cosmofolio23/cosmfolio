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

  const isPro = user?.is_pro || user?.plan_type === 'pro'
  const isAdmin = user?.email?.trim().toLowerCase() === 'boseraj001@gmail.com'

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
      const res = await fetch(`${(typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? '/backend-proxy' : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app'))}/api/projects`, {
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
        // Redirect directly to the editor for portfolios, or sheet creator for sheets
        router.push(creatingType === 'portfolio' ? `/dashboard/templates/default/editor?project=${newProject.id}` : `/dashboard/project/${newProject.id}/sheet`)
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
        
        {/* Premium Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-stone-light/20 pb-8 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-2 font-montserrat">
              👋 Welcome back, {user?.name?.split(' ')[0] || 'Designer'}
            </h1>
            <p className="text-text-secondary dark:text-dark-text-secondary text-lg">
              Portfolio Workspace
            </p>
            <div className="flex flex-wrap gap-4 mt-6 text-sm text-text-secondary dark:text-dark-text-secondary font-medium font-inter">
              <span className="flex items-center gap-1.5 bg-stone-light/5 px-3 py-1 rounded-full">
                <strong className="text-text-primary dark:text-dark-text-primary text-base">{projects.length}</strong> Portfolios
              </span>
              <span className="flex items-center gap-1.5 bg-stone-light/5 px-3 py-1 rounded-full">
                <strong className="text-text-primary dark:text-dark-text-primary text-base">3</strong> Published
              </span>
              <span className="flex items-center gap-1.5 bg-stone-light/5 px-3 py-1 rounded-full">
                <strong className="text-text-primary dark:text-dark-text-primary text-base">{projects.length > 3 ? projects.length - 3 : projects.length}</strong> Drafts
              </span>
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                Last Edited Today
              </span>
            </div>
          </div>
          
          {/* Upgrade Card */}
          {!isPro ? (
             <div className="p-[1px] bg-gradient-to-br from-[#D4AF37] via-[#F3E5AB] to-[#9C7416] rounded-2xl w-full md:w-72 shadow-lg hover:shadow-xl hover:-translate-y-1 transition duration-300 group cursor-pointer" onClick={() => window.location.href='/pricing'}>
                <div className="bg-bg-primary dark:bg-dark-bg-primary rounded-[15px] p-5 h-full flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl group-hover:bg-accent-gold/20 transition duration-500"></div>
                   <div>
                     <h3 className="text-[#D4AF37] font-bold text-lg flex items-center gap-2 mb-3 font-montserrat">✨ Upgrade to Pro</h3>
                     <ul className="text-xs text-text-secondary dark:text-dark-text-secondary space-y-2 mb-5 font-inter">
                       <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Premium Templates</li>
                       <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> 30 Pages per Portfolio</li>
                       <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Priority Exports</li>
                     </ul>
                   </div>
                   <button className="w-full py-2 bg-gradient-to-r from-[#D4AF37] to-[#9C7416] text-white rounded-lg text-sm font-semibold transition hover:brightness-110 flex items-center justify-center gap-2">
                      Upgrade Now <span>→</span>
                   </button>
                </div>
             </div>
          ) : (
             <div className="p-[1px] bg-gradient-to-br from-[#4F46E5] via-[#818CF8] to-[#312E81] rounded-2xl w-full md:w-72 shadow-lg hover:shadow-xl hover:-translate-y-1 transition duration-300 group cursor-pointer" onClick={() => window.location.href='/pricing'}>
                <div className="bg-bg-primary dark:bg-dark-bg-primary rounded-[15px] p-5 h-full flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition duration-500"></div>
                   <div>
                     <h3 className="text-indigo-600 dark:text-indigo-400 font-bold text-lg flex items-center gap-2 mb-3 font-montserrat">🚀 Boost Pack</h3>
                     <ul className="text-xs text-text-secondary dark:text-dark-text-secondary space-y-2 mb-5 font-inter">
                       <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">✓</span> +10 Portfolio Pages</li>
                       <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">✓</span> +2 PDF Exports</li>
                       <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">✓</span> Stack Multiple Packs</li>
                     </ul>
                   </div>
                   <button className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-lg text-sm font-semibold transition hover:brightness-110 flex items-center justify-center gap-2">
                      Get Boost Pack <span>→</span>
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* Feature Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          <Link href="/dashboard/templates" className="p-[1px] bg-gradient-to-br from-[#D4AF37]/40 to-[#9C7416]/20 rounded-2xl group hover:shadow-xl hover:-translate-y-1 transition duration-300 block">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[15px] p-6 h-full border border-stone-light/5 relative overflow-hidden">
               <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left duration-300">📚</div>
               <h3 className="font-montserrat font-bold text-text-primary dark:text-dark-text-primary mb-1.5 text-lg">Portfolio Builder</h3>
               <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4 font-inter leading-relaxed">Create professional portfolios with smart layouts.</p>
               <div className="text-[#D4AF37] font-bold text-sm group-hover:translate-x-1 transition-transform inline-block">Create new →</div>
            </div>
          </Link>
          
          <Link href="/dashboard/my-portfolios" className="p-[1px] bg-gradient-to-br from-blue-400/40 to-blue-600/20 rounded-2xl group hover:shadow-xl hover:-translate-y-1 transition duration-300 block">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-[15px] p-6 h-full border border-blue-500/10 relative overflow-hidden">
               <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left duration-300">✨</div>
               <h3 className="font-montserrat font-bold text-blue-700 dark:text-blue-400 mb-1.5 text-lg">My Portfolios</h3>
               <p className="text-xs text-blue-600/70 dark:text-blue-300/70 mb-4 font-inter leading-relaxed">Continue editing your recent projects.</p>
               <div className="text-blue-700 dark:text-blue-400 font-bold text-sm group-hover:translate-x-1 transition-transform inline-block">View all →</div>
            </div>
          </Link>

          {loaded && isAdmin ? (
            <Link href="/dashboard/sheets" className="p-[1px] bg-stone-light/20 rounded-2xl group hover:shadow-lg hover:-translate-y-1 transition duration-300 block">
              <div className="bg-white dark:bg-[#1A1A1A] rounded-[15px] p-6 h-full border border-stone-light/10 relative overflow-hidden">
                 <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left duration-300">📄</div>
                 <h3 className="font-montserrat font-bold text-text-primary dark:text-dark-text-primary mb-1.5 text-lg">Sheet Composer</h3>
                 <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4 font-inter leading-relaxed">Generate presentation sheets for juries.</p>
                 <div className="text-text-primary dark:text-dark-text-primary font-bold text-sm group-hover:translate-x-1 transition-all inline-block">Open composer →</div>
              </div>
            </Link>
          ) : (
            <div className="p-[1px] bg-stone-light/20 rounded-2xl group block opacity-80 cursor-not-allowed">
              <div className="bg-white dark:bg-[#1A1A1A] rounded-[15px] p-6 h-full border border-stone-light/10 relative overflow-hidden">
                 <div className="text-4xl mb-4 grayscale opacity-70">📄</div>
                 <h3 className="font-montserrat font-bold text-text-primary dark:text-dark-text-primary mb-1.5 text-lg opacity-70">Sheet Composer</h3>
                 <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4 font-inter leading-relaxed opacity-70">Generate presentation sheets for juries.</p>
                 <div className="absolute top-5 right-5 text-[9px] font-bold tracking-wider uppercase px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full">Coming Soon</div>
              </div>
            </div>
          )}

          {loaded && has('library') ? (
            <Link href="/dashboard/library" className="p-[1px] bg-stone-light/20 rounded-2xl group hover:shadow-lg hover:-translate-y-1 transition duration-300 block">
              <div className="bg-white dark:bg-[#1A1A1A] rounded-[15px] p-6 h-full border border-stone-light/10 relative overflow-hidden">
                 <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left duration-300">🗂️</div>
                 <h3 className="font-montserrat font-bold text-text-primary dark:text-dark-text-primary mb-1.5 text-lg">Project Library</h3>
                 <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4 font-inter leading-relaxed">Store and manage your reusable assets.</p>
                 <div className="text-text-primary dark:text-dark-text-primary font-bold text-sm opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all inline-block">Browse library →</div>
              </div>
            </Link>
          ) : (
            <div className="p-[1px] bg-stone-light/10 rounded-2xl block opacity-50">
              <div className="bg-stone-50 dark:bg-[#151515] rounded-[15px] p-6 h-full border border-stone-light/5 relative overflow-hidden">
                 <div className="text-4xl mb-4 grayscale">🗂️</div>
                 <h3 className="font-montserrat font-bold text-text-primary dark:text-dark-text-primary mb-1.5 text-lg">Project Library</h3>
                 <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-4 font-inter leading-relaxed">Store and manage your reusable assets.</p>
              </div>
            </div>
          )}
        </div>

        {/* Admin Tools - Only visible to admin */}
        {isAdmin && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              🔑 Admin Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Link href="/dashboard/admin" className="p-[1px] bg-gradient-to-br from-red-500/40 to-orange-500/20 rounded-2xl group hover:shadow-xl hover:-translate-y-1 transition duration-300 block">
                <div className="bg-red-50/50 dark:bg-red-900/10 rounded-[15px] p-6 h-full border border-red-500/10 relative overflow-hidden">
                   <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left duration-300">🔑</div>
                   <h3 className="font-montserrat font-bold text-red-700 dark:text-red-400 mb-1.5 text-lg">Admin Dashboard</h3>
                   <p className="text-xs text-red-600/70 dark:text-red-300/70 mb-4 font-inter leading-relaxed">Manage users, coupons, and platform settings.</p>
                   <div className="text-red-700 font-bold text-sm group-hover:translate-x-1 transition-transform inline-block">Enter Admin →</div>
                </div>
              </Link>
              <Link href="/dashboard/analytics" className="p-[1px] bg-gradient-to-br from-purple-500/40 to-blue-500/20 rounded-2xl group hover:shadow-xl hover:-translate-y-1 transition duration-300 block">
                <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-[15px] p-6 h-full border border-purple-500/10 relative overflow-hidden">
                   <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left duration-300">📊</div>
                   <h3 className="font-montserrat font-bold text-purple-700 dark:text-purple-400 mb-1.5 text-lg">Analytics</h3>
                   <p className="text-xs text-purple-600/70 dark:text-purple-300/70 mb-4 font-inter leading-relaxed">View platform usage and user metrics.</p>
                   <div className="text-purple-700 font-bold text-sm group-hover:translate-x-1 transition-transform inline-block">View Analytics →</div>
                </div>
              </Link>
            </div>
          </div>
        )}

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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <h2 className="text-2xl font-bold font-montserrat text-text-primary dark:text-dark-text-primary">
                    Continue Working
                    <span className="text-sm font-normal text-stone-light ml-3 font-inter">({projects.length})</span>
                  </h2>
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto">
                     <button className="px-4 py-1.5 bg-stone-light/10 hover:bg-stone-light/20 text-text-primary dark:text-dark-text-primary text-sm font-semibold rounded-full transition whitespace-nowrap">All</button>
                     <button className="px-4 py-1.5 bg-transparent border border-stone-light/20 hover:bg-stone-light/10 text-text-secondary dark:text-dark-text-secondary text-sm font-medium rounded-full transition whitespace-nowrap">Recent</button>
                     <button className="px-4 py-1.5 bg-transparent border border-stone-light/20 hover:bg-stone-light/10 text-text-secondary dark:text-dark-text-secondary text-sm font-medium rounded-full transition whitespace-nowrap">Published</button>
                     <button className="px-4 py-1.5 bg-transparent border border-stone-light/20 hover:bg-stone-light/10 text-text-secondary dark:text-dark-text-secondary text-sm font-medium rounded-full transition whitespace-nowrap">Drafts</button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {projects.map((project) => {
                    const isPortfolio = project.project_type === 'portfolio'
                    return (
                      <div 
                        key={project.id} 
                        className="bg-white dark:bg-[#1A1A1A] rounded-[16px] group overflow-hidden cursor-pointer relative shadow-sm border border-stone-light/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                        onClick={() => router.push(isPortfolio ? `/dashboard/templates/default/editor?project=${project.id}` : `/dashboard/project/${project.id}/sheet`)}
                      >
                        {/* Thumbnail Placeholder (To be replaced with auto-thumbnails) */}
                        <div className="h-56 bg-[#f8f9fa] dark:bg-[#111111] overflow-hidden relative border-b border-stone-light/10">
                          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-5 font-bold text-slate-800 dark:text-white group-hover:scale-110 transition-transform duration-700 font-montserrat">
                            {project.title.substring(0, 2).toUpperCase()}
                          </div>
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full text-[10px] font-bold font-inter text-stone-500 shadow-sm border border-stone-light/20 flex items-center gap-1.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${isPortfolio ? 'bg-yellow-400' : 'bg-blue-400'}`}></div> {isPortfolio ? 'Draft' : 'Editing'}
                          </div>
                          
                          {/* Hover Action Menu */}
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-300 flex justify-end gap-2">
                            <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 transition"
                              onClick={(e) => { e.stopPropagation(); router.push(isPortfolio ? `/dashboard/templates/default/editor?project=${project.id}` : `/dashboard/project/${project.id}/sheet`) }}>
                              ✏️ Edit
                            </button>
                            <div className="relative group/menu">
                              <button className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white transition"
                                onClick={(e) => e.stopPropagation()}>
                                ⋮
                              </button>
                              <div className="absolute bottom-full right-0 mb-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-stone-light/10 overflow-hidden opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all origin-bottom-right">
                                <button className="w-full text-left px-4 py-2 text-xs font-medium text-text-primary dark:text-dark-text-primary hover:bg-stone-light/10 transition">🌍 Share</button>
                                <button className="w-full text-left px-4 py-2 text-xs font-medium text-text-primary dark:text-dark-text-primary hover:bg-stone-light/10 transition">📄 Export PDF</button>
                                <div className="h-px bg-stone-light/10 w-full"></div>
                                <button 
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-base font-bold font-montserrat text-text-primary dark:text-dark-text-primary mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {project.title}
                              </h3>
                              <div className="text-[11px] font-inter text-text-secondary dark:text-dark-text-secondary mb-4 flex items-center justify-between">
                                <span>{isPortfolio ? 'Minimal White Template' : 'Presentation Sheet'}</span>
                                <span>Edited {new Date(project.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>
                              </div>
                            </div>
                            
                            {/* Progress Bar (Only for portfolios) */}
                            {isPortfolio && (
                              <div className="mt-auto pt-2 border-t border-stone-light/10">
                                 <div className="flex justify-between items-center text-[10px] font-bold text-stone-light mb-2 font-inter">
                                    <span>Portfolio Complete</span>
                                    <span className="text-blue-600 dark:text-blue-400">78%</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-stone-light/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 w-[78%] rounded-full relative">
                                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 skew-x-12 animate-progress-shimmer"></div>
                                    </div>
                                 </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => {
            router.push('/dashboard/templates')
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-montserrat font-bold py-3.5 px-6 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.6)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
        >
          <span className="text-xl leading-none">＋</span> Create Portfolio
        </button>
      </div>
    </div>
  )
}
