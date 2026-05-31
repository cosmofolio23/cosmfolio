'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

interface Asset {
  id: string
  asset_type: string
  file_name: string
  file_url: string
  file_size: number
  created_at: string
}

interface Project {
  id: string
  title: string
  description?: string
  project_type: string
  status: string
  created_at: string
}

const ASSET_CATEGORIES = [
  { key: 'render', label: 'Renders', description: 'Exterior & interior renders', icon: '🖼️' },
  { key: 'plan', label: 'Plans', description: 'Floor plans & site plans', icon: '📐' },
  { key: 'section', label: 'Sections', description: 'Building sections & elevations', icon: '📏' },
  { key: 'diagram', label: 'Diagrams', description: 'Concept & analysis diagrams', icon: '📊' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [assets, setAssets] = useState<Record<string, Asset[]>>({
    render: [], plan: [], section: [], diagram: []
  })
  const [activeTab, setActiveTab] = useState('render')
  const [_isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    loadProject()
    loadAssets()
  }, [isAuthenticated])

  const loadProject = async () => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setProject(await res.json())
    } catch (e) { console.error(e) }
  }

  const loadAssets = async () => {
    try {
      setIsLoading(true)
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/assets/${params.id}/list`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAssets({
          render: data.render || [],
          plan: data.plan || [],
          section: data.section || [],
          diagram: data.diagram || [],
        })
      } else {
        console.error('Load assets failed:', await res.text())
      }
    } catch (e) { console.error('Load assets error:', e) }
    finally { setIsLoading(false) }
  }

  const handleUpload = async (files: FileList) => {
    if (!files.length) return
    setIsUploading(true)
    setUploadProgress(`Uploading ${files.length} file(s)...`)

    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('files', f))

    try {
      const savedToken = token || localStorage.getItem('auth_token')
      const res = await fetch(
        `${API_URL}/api/assets/${params.id}/upload?asset_type=${activeTab}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${savedToken}` },
          body: formData,
        }
      )
      if (res.ok) {
        setUploadProgress('✅ Uploaded successfully!')
        await loadAssets()
        setTimeout(() => setUploadProgress(''), 2000)
      } else {
        const err = await res.json()
        setUploadProgress(`❌ Error: ${err.detail}`)
      }
    } catch (e: any) {
      setUploadProgress(`❌ Upload failed: ${e.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await fetch(`${API_URL}/api/assets/${params.id}/assets/${assetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      await loadAssets()
    } catch (e) { console.error(e) }
  }

  const totalAssets = Object.values(assets).reduce((sum, arr) => sum + arr.length, 0)
  const activeCategory = ASSET_CATEGORIES.find(c => c.key === activeTab)

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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-charcoal">{project?.title || 'Loading...'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-stone-light font-medium">{totalAssets} assets uploaded</span>
            {totalAssets > 0 && (
              <Link
                href={`/dashboard/project/${params.id}/generate`}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Generate Portfolio
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container-centered py-8 md:py-12">
        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            {ASSET_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === cat.key
                    ? 'bg-primary text-white shadow-elevation-2'
                    : 'bg-white text-slate border border-border-light hover:shadow-elevation-1'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                {cat.label}
                {assets[cat.key]?.length > 0 && (
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === cat.key
                      ? 'bg-blue-400 text-white'
                      : 'bg-gray-200 text-slate'
                  }`}>
                    {assets[cat.key].length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {activeCategory && (
            <p className="text-sm text-stone-light mt-3">{activeCategory.description}</p>
          )}
        </div>

        {/* Upload Area */}
        <div
          className="card bg-white border-2 border-dashed border-border-light rounded-2xl p-12 text-center mb-8 hover:border-primary hover:shadow-elevation-2 transition-all duration-200 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add('border-primary', 'bg-blue-50')
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-primary', 'bg-blue-50')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('border-primary', 'bg-blue-50')
            handleUpload(e.dataTransfer.files)
          }}
        >
          <div className="text-6xl mb-4 opacity-50">{activeCategory?.icon}</div>
          <h3 className="text-xl font-semibold text-charcoal mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-stone-light mb-6">
            Supports PNG, JPG, TIFF, PDF and other image formats
          </p>
          {uploadProgress && (
            <div className="mb-6">
              <p className={`text-sm font-medium ${
                uploadProgress.includes('successfully')
                  ? 'text-success'
                  : uploadProgress.includes('Error')
                  ? 'text-error'
                  : 'text-info'
              }`}>
                {uploadProgress}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>

        {/* Asset Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-border-light border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-stone-light">Loading assets...</p>
            </div>
          </div>
        ) : assets[activeTab]?.length === 0 ? (
          <div className="card bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4 opacity-20">📁</div>
            <h3 className="text-xl font-semibold text-slate mb-2">No {activeTab}s uploaded yet</h3>
            <p className="text-stone-light">Use the upload area above to add your files</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets[activeTab].map(asset => (
              <div key={asset.id} className="card bg-white overflow-hidden group hover:shadow-elevation-2">
                <div className="aspect-square bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {asset.file_url && asset.file_url.startsWith('http') ? (
                    <img
                      src={asset.file_url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display='none' }}
                    />
                  ) : (
                    <div className="text-4xl opacity-40">📄</div>
                  )}
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="absolute top-2 right-2 bg-error text-white w-8 h-8 rounded-lg text-sm hidden group-hover:flex items-center justify-center hover:bg-red-700 transition-colors"
                    title="Delete asset"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs text-charcoal font-medium truncate" title={asset.file_name}>{asset.file_name}</p>
                  <p className="text-xs text-stone-light">
                    {asset.file_size ? `${(asset.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate CTA */}
        {totalAssets > 0 && (
          <div className="mt-12 card-elevated bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to generate your portfolio?</h2>
            <p className="text-blue-100 mb-8 text-lg">
              You have <span className="font-semibold">{totalAssets} assets</span> across <span className="font-semibold">{Object.values(assets).filter(a => a.length > 0).length} categories</span>. Let AI create stunning variations.
            </p>
            <Link
              href={`/dashboard/project/${params.id}/generate`}
              className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Generate Portfolio Variants
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
