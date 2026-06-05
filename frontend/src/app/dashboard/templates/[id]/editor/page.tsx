'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Template {
  id: string
  name: string
  description: string
  category: string
  colors?: { [key: string]: string }
  fonts?: { [key: string]: string }
  layouts?: any
  preview_image?: string
  style_notes?: string
}

interface PortfolioPage {
  id: string
  type: 'cover' | 'about' | 'project' | 'contact'
  title: string
  content: string
  layout: string
  images: string[]
  customStyles?: { [key: string]: string }
}

const defaultPages: PortfolioPage[] = [
  {
    id: 'page-1',
    type: 'cover',
    title: 'Portfolio',
    content: 'Architecture & Design 2026',
    layout: 'centered',
    images: []
  },
  {
    id: 'page-2',
    type: 'about',
    title: 'About Me',
    content: 'Architect specializing in sustainable, contemporary design. With 5+ years of experience designing residential, commercial, and public spaces, I focus on creating environments that harmonize with their surroundings while pushing the boundaries of modern architectural language.',
    layout: 'text-left',
    images: []
  },
  {
    id: 'page-3',
    type: 'project',
    title: 'Project 01: Modern Villa',
    content: 'A 450 sqm residential project featuring open-plan living spaces, natural materials, and floor-to-ceiling windows that blur the boundary between indoor and outdoor.',
    layout: 'image-text-split',
    images: ['placeholder-1']
  },
  {
    id: 'page-4',
    type: 'project',
    title: 'Project 02: Urban Tower',
    content: 'A 35-story mixed-use development combining residential apartments, retail spaces, and public amenities. Sustainable design with green facade.',
    layout: 'image-grid',
    images: ['placeholder-2', 'placeholder-3', 'placeholder-4']
  },
  {
    id: 'page-5',
    type: 'contact',
    title: 'Get In Touch',
    content: 'email@example.com\n+1 (555) 123-4567\nwww.yourwebsite.com',
    layout: 'centered',
    images: []
  }
]

export default function TemplateEditor() {
  const router = useRouter()
  const params = useParams()
  const { isAuthenticated, token } = useAuthStore()
  const templateId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [template, setTemplate] = useState<Template | null>(null)
  const [pages, setPages] = useState<PortfolioPage[]>(defaultPages)
  const [currentPageIdx, setCurrentPageIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [portfolioTitle, setPortfolioTitle] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Customization state
  const [customColors, setCustomColors] = useState<{ [key: string]: string }>({})
  const [customFonts, setCustomFonts] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin')
      return
    }
    fetchTemplate()
  }, [isAuthenticated, templateId])

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/templates/portfolios/${templateId}`)
      if (res.ok) {
        const data = await res.json()
        setTemplate(data)
        setCustomColors(data.colors || {})
        setCustomFonts(data.fonts || {})
        setPortfolioTitle(`${data.name} Portfolio`)
      } else {
        // Try sheets endpoint as fallback
        const sheetRes = await fetch(`${API_URL}/api/templates/sheets/${templateId}`)
        if (sheetRes.ok) {
          const data = await sheetRes.json()
          setTemplate(data)
          setCustomColors(data.colors || {})
          setCustomFonts(data.fonts || {})
          setPortfolioTitle(`${data.name} Sheet`)
        }
      }
    } catch (e) {
      console.error('Error loading template:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePage = (idx: number, updates: Partial<PortfolioPage>) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p))
  }

  const addPage = (type: PortfolioPage['type'] = 'project') => {
    const newPage: PortfolioPage = {
      id: `page-${Date.now()}`,
      type,
      title: type === 'project' ? `Project ${pages.filter(p => p.type === 'project').length + 1}` : 'New Page',
      content: 'Edit this content...',
      layout: 'image-text-split',
      images: []
    }
    setPages([...pages, newPage])
    setCurrentPageIdx(pages.length)
  }

  const deletePage = (idx: number) => {
    if (pages.length <= 1) return
    setPages(pages.filter((_, i) => i !== idx))
    if (currentPageIdx >= idx && currentPageIdx > 0) {
      setCurrentPageIdx(currentPageIdx - 1)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    // For now, use object URL (will save to backend on save)
    const url = URL.createObjectURL(file)
    const currentPage = pages[currentPageIdx]
    updatePage(currentPageIdx, {
      images: [...currentPage.images, url]
    })
    setUploadingImage(false)
  }

  const savePortfolio = async () => {
    if (!portfolioTitle.trim()) {
      alert('Please enter a portfolio title')
      return
    }
    setIsSaving(true)
    try {
      const savedToken = token || localStorage.getItem('auth_token')

      // Create project
      const projectRes = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: portfolioTitle,
          project_type: 'portfolio',
          description: `Created from template: ${template?.name}`
        }),
      })

      if (!projectRes.ok) {
        const err = await projectRes.json().catch(() => ({}))
        throw new Error(err.detail || projectRes.statusText)
      }

      const project = await projectRes.json()

      // Save customizations
      localStorage.setItem(`portfolio_${project.id}`, JSON.stringify({
        template_id: templateId,
        template_name: template?.name,
        colors: customColors,
        fonts: customFonts,
        pages,
        title: portfolioTitle
      }))

      alert(`✅ Portfolio "${portfolioTitle}" saved!`)
      router.push(`/dashboard/project/${project.id}`)
    } catch (e: any) {
      console.error('Save error:', e)
      alert(`Failed to save: ${e.message || 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Template not found</p>
          <Link href="/dashboard/templates" className="text-blue-600 hover:underline">← Back to Templates</Link>
        </div>
      </div>
    )
  }

  const currentPage = pages[currentPageIdx]
  const bgColor = customColors.background || '#FFFFFF'
  const textColor = customColors.text || '#000000'
  const primaryColor = customColors.primary || '#000000'
  const accentColor = customColors.accent || '#888888'
  const headingFont = customFonts.heading || 'Montserrat'
  const bodyFont = customFonts.body || 'Inter'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Toolbar */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/templates" className="text-gray-600 hover:text-gray-900 text-sm">
              ← Back
            </Link>
            <div>
              <input
                type="text"
                value={portfolioTitle}
                onChange={e => setPortfolioTitle(e.target.value)}
                className="text-lg font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 rounded"
                placeholder="Untitled Portfolio"
              />
              <p className="text-xs text-gray-500 px-2">Using: {template.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showSidebar ? 'Hide' : 'Show'} Panel
            </button>
            <button
              onClick={savePortfolio}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '💾 Save Portfolio'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Sidebar - Pages */}
        <aside className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pages ({pages.length})</h3>
            <div className="space-y-2">
              {pages.map((page, idx) => (
                <div
                  key={page.id}
                  onClick={() => setCurrentPageIdx(idx)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    currentPageIdx === idx
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1 capitalize">{page.type}</div>
                      <div className="text-sm font-medium truncate">{page.title}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePage(idx) }}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500">Add New Page:</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addPage('project')} className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50">+ Project</button>
                <button onClick={() => addPage('about')} className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50">+ About</button>
                <button onClick={() => addPage('cover')} className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50">+ Cover</button>
                <button onClick={() => addPage('contact')} className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50">+ Contact</button>
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Live Preview/Editor */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-200">
          <div
            className="max-w-3xl mx-auto shadow-2xl"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              fontFamily: bodyFont,
              minHeight: '800px',
              aspectRatio: '210 / 297'
            }}
          >
            {/* Render Current Page based on layout */}
            {currentPage.type === 'cover' && (
              <div className="h-full flex flex-col items-center justify-center p-16 text-center">
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updatePage(currentPageIdx, { title: e.currentTarget.textContent || '' })}
                  className="text-6xl font-bold mb-6 focus:outline-none focus:bg-yellow-50 px-4 py-2 rounded transition"
                  style={{ fontFamily: headingFont, color: primaryColor }}
                >
                  {currentPage.title}
                </h1>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updatePage(currentPageIdx, { content: e.currentTarget.textContent || '' })}
                  className="text-xl focus:outline-none focus:bg-yellow-50 px-4 py-2 rounded transition"
                  style={{ color: accentColor }}
                >
                  {currentPage.content}
                </p>
                {currentPage.images.length > 0 && (
                  <div className="mt-8 w-full max-w-md">
                    <img src={currentPage.images[0]} alt="" className="w-full h-64 object-cover" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-8 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
                >
                  + Add Background Image
                </button>
              </div>
            )}

            {currentPage.type === 'about' && (
              <div className="h-full p-16">
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updatePage(currentPageIdx, { title: e.currentTarget.textContent || '' })}
                  className="text-5xl font-bold mb-8 focus:outline-none focus:bg-yellow-50 px-2 py-1 rounded transition"
                  style={{ fontFamily: headingFont, color: primaryColor }}
                >
                  {currentPage.title}
                </h1>
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updatePage(currentPageIdx, { content: e.currentTarget.textContent || '' })}
                      className="text-lg leading-relaxed focus:outline-none focus:bg-yellow-50 px-2 py-1 rounded transition"
                    >
                      {currentPage.content}
                    </p>
                  </div>
                  <div>
                    {currentPage.images.length > 0 ? (
                      <img src={currentPage.images[0]} alt="" className="w-full h-96 object-cover" />
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center"
                      >
                        + Add Profile Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentPage.type === 'project' && (
              <div className="h-full p-16">
                <div className="text-sm uppercase tracking-wider mb-4" style={{ color: accentColor }}>Project</div>
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updatePage(currentPageIdx, { title: e.currentTarget.textContent || '' })}
                  className="text-4xl font-bold mb-6 focus:outline-none focus:bg-yellow-50 px-2 py-1 rounded transition"
                  style={{ fontFamily: headingFont, color: primaryColor }}
                >
                  {currentPage.title}
                </h1>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updatePage(currentPageIdx, { content: e.currentTarget.textContent || '' })}
                  className="text-base mb-8 leading-relaxed focus:outline-none focus:bg-yellow-50 px-2 py-1 rounded transition"
                >
                  {currentPage.content}
                </p>

                {/* Images grid */}
                <div className={`grid gap-4 ${currentPage.images.length <= 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {currentPage.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt="" className="w-full h-64 object-cover" />
                      <button
                        onClick={() => updatePage(currentPageIdx, {
                          images: currentPage.images.filter((_, i) => i !== idx)
                        })}
                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-64 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center"
                  >
                    + Add Image
                  </button>
                </div>
              </div>
            )}

            {currentPage.type === 'contact' && (
              <div className="h-full flex flex-col items-center justify-center p-16 text-center">
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updatePage(currentPageIdx, { title: e.currentTarget.textContent || '' })}
                  className="text-5xl font-bold mb-8 focus:outline-none focus:bg-yellow-50 px-4 py-2 rounded transition"
                  style={{ fontFamily: headingFont, color: primaryColor }}
                >
                  {currentPage.title}
                </h1>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => updatePage(currentPageIdx, { content: e.currentTarget.textContent || '' })}
                  className="text-xl whitespace-pre-line focus:outline-none focus:bg-yellow-50 px-4 py-2 rounded transition"
                >
                  {currentPage.content}
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </main>

        {/* Right Sidebar - Customization */}
        {showSidebar && (
          <aside className="w-80 bg-white border-l overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Layout Selector */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Page Layout</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['centered', 'text-left', 'image-text-split', 'image-grid'].map(layout => (
                    <button
                      key={layout}
                      onClick={() => updatePage(currentPageIdx, { layout })}
                      className={`p-3 text-xs border rounded-lg transition ${
                        currentPage.layout === layout
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {layout.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Colors</h3>
                <div className="space-y-3">
                  {Object.entries(customColors).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color || '#000000'}
                        onChange={e => setCustomColors({ ...customColors, [key]: e.target.value })}
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 capitalize">{key}</label>
                        <input
                          type="text"
                          value={color || ''}
                          onChange={e => setCustomColors({ ...customColors, [key]: e.target.value })}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fonts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Typography</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Heading Font</label>
                    <select
                      value={customFonts.heading || ''}
                      onChange={e => setCustomFonts({ ...customFonts, heading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      {['Montserrat', 'Playfair Display', 'Roboto', 'Inter', 'Poppins', 'Georgia', 'Lora', 'Bebas Neue', 'Oswald'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Body Font</label>
                    <select
                      value={customFonts.body || ''}
                      onChange={e => setCustomFonts({ ...customFonts, body: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      {['Inter', 'Roboto', 'Open Sans', 'Lato', 'Source Sans Pro', 'Raleway', 'Georgia'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Click any text to edit it</li>
                  <li>• Click "+ Add Image" to upload</li>
                  <li>• Switch pages on the left</li>
                  <li>• Save when done</li>
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
