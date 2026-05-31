'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ====== LIVE SHEET PREVIEW COMPONENT ======
function SheetPreview({ sheetType, sheetTitle, caption, theme, size, orientation, assets, sheetTypes, themes }: any) {
  const themeData = themes.find((t: any) => t.id === theme)
  const [bg, text, accent] = themeData?.colors || ['#fff', '#111', '#0057FF']
  const allImages: string[] = Object.values(assets).flat().map((a: any) => a.file_url).filter((u: any) => u?.startsWith('http'))
  const isLandscape = orientation === 'landscape'

  const gridLayouts: Record<string, any> = {
    concept: { cols: 2, main: 1, thumbs: 3 },
    renders: { cols: 3, main: 2, thumbs: 4 },
    floor_plans: { cols: 3, main: 3, thumbs: 0 },
    site_analysis: { cols: 2, main: 1, thumbs: 2 },
    details: { cols: 4, main: 4, thumbs: 0 },
    process: { cols: 4, main: 2, thumbs: 4 },
    final: { cols: 3, main: 2, thumbs: 3 },
  }
  const layout = gridLayouts[sheetType || 'renders'] || gridLayouts.renders

  return (
    <div className={`relative overflow-hidden`}
      style={{
        backgroundColor: bg,
        color: text,
        width: '100%',
        aspectRatio: isLandscape ? '841/594' : '594/841',
        fontFamily: 'sans-serif',
        border: `1px solid ${accent}20`,
      }}>

      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: accent, color: '#fff' }}>
        <div>
          <p className="font-bold text-sm tracking-wide">{sheetTitle || 'Architecture Project'}</p>
          <p className="text-xs opacity-80">{sheetTypes?.find((s: any) => s.id === sheetType)?.name || 'Presentation Sheet'}</p>
        </div>
        <div className="text-right text-xs opacity-80">
          <p>{size} • {orientation}</p>
          <p>{themeData?.name}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="absolute inset-0 pt-14 pb-8 px-4">
        {allImages.length === 0 ? (
          // No images - show layout skeleton
          <div className="h-full flex flex-col gap-2">
            <div className="flex gap-2 flex-1">
              {Array.from({ length: layout.cols }).map((_: any, i: number) => (
                <div key={i} className="flex-1 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${accent}15`, border: `1px dashed ${accent}40` }}>
                  🖼️
                </div>
              ))}
            </div>
            <div className="h-12 rounded-lg flex items-center px-4 text-xs"
              style={{ backgroundColor: `${text}08` }}>
              {caption || 'Your images will appear here after upload'}
            </div>
          </div>
        ) : sheetType === 'concept' ? (
          // Concept: large image left + text right
          <div className="h-full flex gap-3">
            <div className="flex-1 rounded-lg overflow-hidden" style={{ flex: 2 }}>
              <img src={allImages[0]} alt="main" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-2" style={{ flex: 1 }}>
              {allImages.slice(1, 4).map((url: string, i: number) => (
                <div key={i} className="flex-1 rounded-lg overflow-hidden">
                  <img src={url} alt={`img${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="p-3 rounded-lg text-xs leading-relaxed"
                style={{ backgroundColor: `${accent}10`, borderLeft: `3px solid ${accent}` }}>
                {caption || 'Design concept & philosophy statement goes here'}
              </div>
            </div>
          </div>
        ) : sheetType === 'renders' ? (
          // Renders: masonry/grid
          <div className="h-full flex flex-col gap-2">
            <div className="flex gap-2" style={{ flex: 2 }}>
              <div className="rounded-lg overflow-hidden" style={{ flex: 2 }}>
                <img src={allImages[0]} alt="main" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                {allImages.slice(1, 3).map((url: string, i: number) => (
                  <div key={i} className="flex-1 rounded-lg overflow-hidden">
                    <img src={url} alt={`r${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2" style={{ flex: 1 }}>
              {allImages.slice(3, 6).map((url: string, i: number) => (
                <div key={i} className="flex-1 rounded-lg overflow-hidden">
                  <img src={url} alt={`r${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : sheetType === 'floor_plans' ? (
          // Floor plans: equal 3-col grid
          <div className="h-full flex flex-col gap-2">
            <div className="flex gap-2" style={{ flex: 2 }}>
              {allImages.slice(0, 3).map((url: string, i: number) => (
                <div key={i} className="flex-1 rounded-lg overflow-hidden border" style={{ borderColor: `${accent}30` }}>
                  <img src={url} alt={`p${i}`} className="w-full h-full object-contain bg-white p-1" />
                </div>
              ))}
            </div>
            <div className="flex gap-2" style={{ flex: 1 }}>
              {allImages.slice(3, 6).map((url: string, i: number) => (
                <div key={i} className="flex-1 rounded-lg overflow-hidden border" style={{ borderColor: `${accent}30` }}>
                  <img src={url} alt={`p${i}`} className="w-full h-full object-contain bg-white p-1" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Default: uniform grid
          <div className="h-full grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(layout.cols, Math.max(allImages.length, 1))}, 1fr)` }}>
            {allImages.slice(0, layout.cols * 2).map((url: string, i: number) => (
              <div key={i} className="rounded-lg overflow-hidden">
                <img src={url} alt={`img${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 text-xs"
        style={{ borderTop: `1px solid ${accent}30`, color: `${text}60` }}>
        <p>{caption}</p>
        <p style={{ color: accent }}>CosmoFolio</p>
      </div>
    </div>
  )
}

const SHEET_TYPES = [
  { id: 'concept', name: 'Concept Sheet', icon: '💡', desc: 'Design concept & philosophy', layout: '2-col text + image' },
  { id: 'site_analysis', name: 'Site Analysis', icon: '🗺️', desc: 'Site context, maps & analysis', layout: 'Full spread' },
  { id: 'floor_plans', name: 'Floor Plans', icon: '📐', desc: 'Plans, sections & elevations', layout: '3-col technical' },
  { id: 'renders', name: 'Render Sheet', icon: '🖼️', desc: 'Interior & exterior renders', layout: 'Grid gallery' },
  { id: 'details', name: 'Detail Sheet', icon: '🔍', desc: 'Construction details & materials', layout: '4-col details' },
  { id: 'process', name: 'Process Sheet', icon: '⚙️', desc: 'Design process & iterations', layout: 'Timeline' },
  { id: 'final', name: 'Final Portfolio', icon: '📋', desc: 'Complete project overview', layout: 'Full spread' },
]

const SHEET_SIZES = [
  { id: 'A1', label: 'A1', desc: '841 × 594 mm', icon: '📰' },
  { id: 'A2', label: 'A2', desc: '594 × 420 mm', icon: '📄' },
  { id: 'A3', label: 'A3', desc: '420 × 297 mm', icon: '📃' },
]

const ORIENTATIONS = [
  { id: 'landscape', label: 'Landscape', icon: '▬' },
  { id: 'portrait', label: 'Portrait', icon: '▮' },
]

const THEMES = [
  { id: 'minimal_white', name: 'Minimal White', colors: ['#FFFFFF', '#1A1A1A', '#0057FF'] },
  { id: 'dark_architect', name: 'Dark Architect', colors: ['#1A1A1A', '#FFFFFF', '#FFD700'] },
  { id: 'warm_earth', name: 'Warm Earth', colors: ['#F5F0EB', '#3D2B1F', '#C4A882'] },
  { id: 'nordic_blue', name: 'Nordic Blue', colors: ['#F0F4F8', '#1B2A4A', '#4A90D9'] },
]

export default function SheetPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [step, setStep] = useState<'type' | 'upload' | 'design' | 'export'>('type')
  const [project, setProject] = useState<any>(null)
  const [selectedSheetType, setSelectedSheetType] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState('A1')
  const [selectedOrientation, setSelectedOrientation] = useState('landscape')
  const [selectedTheme, setSelectedTheme] = useState('minimal_white')
  const [assets, setAssets] = useState<Record<string, any[]>>({})
  const [uploadProgress, setUploadProgress] = useState('')
  const [activeUploadCat, setActiveUploadCat] = useState('render')
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [sheetTitle, setSheetTitle] = useState('')
  const [sheetCaption, setSheetCaption] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '')

  useEffect(() => {
    if (!isAuthenticated) { router.push('/signin'); return }
    fetch(`${API_URL}/api/projects/${params.id}`, { headers: { 'Authorization': `Bearer ${savedToken}` } })
      .then(r => r.json()).then(d => { setProject(d); setSheetTitle(d.title || '') }).catch(console.error)
    loadAssets()
  }, [isAuthenticated])

  const loadAssets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/assets/${params.id}/list`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      if (res.ok) setAssets(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleUpload = async (files: FileList) => {
    if (!files.length) return
    setUploadProgress(`Uploading ${files.length} file(s)...`)
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('files', f))
    try {
      const res = await fetch(`${API_URL}/api/assets/${params.id}/upload?asset_type=${activeUploadCat}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${savedToken}` }, body: formData
      })
      if (res.ok) {
        setUploadProgress('✅ Uploaded!')
        await loadAssets()
        setTimeout(() => setUploadProgress(''), 2000)
      } else setUploadProgress('❌ Upload failed')
    } catch { setUploadProgress('❌ Error') }
  }

  const generateAICaption = async () => {
    setAiLoading(true)
    try {
      const sheetInfo = SHEET_TYPES.find(s => s.id === selectedSheetType)
      const res = await fetch(`${API_URL}/api/ai/generate-text`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a concise, professional caption for a ${sheetInfo?.name} presentation sheet for the project "${sheetTitle}". Keep it under 50 words.`,
          tone: 'academic', project_id: params.id, content_type: 'caption'
        })
      })
      if (res.ok) {
        const d = await res.json()
        setSheetCaption(d.generated_text || d.text || '')
      }
    } catch (e) { console.error(e) }
    finally { setAiLoading(false) }
  }

  const generateSheet = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`${API_URL}/api/sheets/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: params.id,
          sheet_type: selectedSheetType,
          size: selectedSize,
          orientation: selectedOrientation,
          theme: selectedTheme,
          title: sheetTitle,
          caption: sheetCaption,
        })
      })
      if (res.ok) {
        const d = await res.json()
        setSheetId(d.id || d.sheet_id)
        setStep('export')
      } else {
        // fallback - go to export anyway
        setSheetId('preview')
        setStep('export')
      }
    } catch { setSheetId('preview'); setStep('export') }
    finally { setGenerating(false) }
  }

  const totalAssets = Object.values(assets).reduce((s: number, a: any) => s + (a?.length || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <span className="text-gray-200">|</span>
            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-sm">📄</div>
            <span className="font-semibold text-gray-900">{project?.title || 'Sheet Creator'}</span>
          </div>
          <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">Presentation Sheet Creator</span>
        </div>

        {/* Progress Steps */}
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-2">
          {[
            { key: 'type', label: 'Sheet Type', icon: '📋' },
            { key: 'upload', label: 'Add Assets', icon: '📁' },
            { key: 'design', label: 'Design', icon: '🎨' },
            { key: 'export', label: 'Export', icon: '⬇️' },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <button onClick={() => setStep(s.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  step === s.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                {s.icon} {s.label}
              </button>
              {i < arr.length - 1 && <span className="text-gray-300 text-xs">›</span>}
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* STEP 1: SHEET TYPE */}
        {step === 'type' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose Sheet Type</h2>
            <p className="text-gray-500 mb-6">Select what kind of presentation sheet you want to create</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {SHEET_TYPES.map(sheet => (
                <div key={sheet.id} onClick={() => setSelectedSheetType(sheet.id)}
                  className={`bg-white rounded-xl p-5 cursor-pointer border-2 transition-all hover:shadow-md ${
                    selectedSheetType === sheet.id ? 'border-purple-500 shadow-md' : 'border-gray-200 hover:border-purple-300'
                  }`}>
                  <div className="text-3xl mb-3">{sheet.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{sheet.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{sheet.desc}</p>
                  <p className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded-full inline-block">{sheet.layout}</p>
                  {selectedSheetType === sheet.id && (
                    <p className="text-xs text-purple-600 font-medium mt-2">✓ Selected</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep('upload')} disabled={!selectedSheetType}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-40 hover:bg-purple-700">
                Next: Add Assets →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD */}
        {step === 'upload' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Add Assets to Sheet</h2>
            <p className="text-gray-500 mb-2">Upload images for your {SHEET_TYPES.find(s => s.id === selectedSheetType)?.name}</p>

            <div className="flex gap-2 flex-wrap mb-5">
              {['render', 'plan', 'section', 'diagram', 'material', 'detail'].map(cat => (
                <button key={cat} onClick={() => setActiveUploadCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all border ${
                    activeUploadCat === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 hover:shadow-sm'
                  }`}>
                  {cat}
                  {(assets as any)[cat]?.length > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 rounded-full ${activeUploadCat === cat ? 'bg-purple-500' : 'bg-gray-200 text-gray-600'}`}>
                      {(assets as any)[cat].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center mb-5 hover:border-purple-400 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#9333EA' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB' }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#D1D5DB'; handleUpload(e.dataTransfer.files) }}>
              <div className="text-4xl mb-3">📤</div>
              <h3 className="font-semibold text-gray-700 mb-1">Drop images here or click to upload</h3>
              <p className="text-sm text-gray-400">PNG, JPG, PDF supported</p>
              {uploadProgress && <p className="mt-3 text-sm font-medium text-purple-600">{uploadProgress}</p>}
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" className="hidden"
                onChange={e => e.target.files && handleUpload(e.target.files)} />
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
              {((assets as any)[activeUploadCat] || []).map((a: any) => (
                <div key={a.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {a.file_url?.startsWith('http')
                    ? <img src={a.file_url} alt={a.file_name} className="w-full h-full object-cover" />
                    : <span className="text-2xl flex items-center justify-center h-full opacity-30">📄</span>}
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('type')} className="border px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50">← Back</button>
              <button onClick={() => setStep('design')} className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700">
                Next: Design →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DESIGN */}
        {step === 'design' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Design Your Sheet</h2>
            <p className="text-gray-500 mb-6">Configure layout, size, and style</p>

            {/* Sheet Details */}
            <div className="bg-white rounded-xl p-5 border mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Sheet Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Sheet Title</label>
                  <input value={sheetTitle} onChange={e => setSheetTitle(e.target.value)}
                    placeholder="e.g., Housing Complex - Concept Sheet"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-gray-600">Caption / Subtitle</label>
                    <button onClick={generateAICaption} disabled={aiLoading}
                      className="text-xs text-purple-600 hover:underline disabled:opacity-40">
                      {aiLoading ? '⏳ Generating...' : '🤖 Generate with AI'}
                    </button>
                  </div>
                  <textarea value={sheetCaption} onChange={e => setSheetCaption(e.target.value)}
                    placeholder="Short description for this sheet..."
                    className="w-full border rounded-lg px-3 py-2 text-sm h-16 resize-none focus:outline-none focus:border-purple-400" />
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="bg-white rounded-xl p-5 border mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Sheet Size</h3>
              <div className="flex gap-3">
                {SHEET_SIZES.map(size => (
                  <button key={size.id} onClick={() => setSelectedSize(size.id)}
                    className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                      selectedSize === size.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}>
                    <div className="text-xl mb-1">{size.icon}</div>
                    <div className="font-bold text-sm">{size.label}</div>
                    <div className="text-xs text-gray-400">{size.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div className="bg-white rounded-xl p-5 border mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Orientation</h3>
              <div className="flex gap-3">
                {ORIENTATIONS.map(o => (
                  <button key={o.id} onClick={() => setSelectedOrientation(o.id)}
                    className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                      selectedOrientation === o.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                    }`}>
                    <div className="text-2xl mb-1">{o.icon}</div>
                    <div className="font-medium text-sm capitalize">{o.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="bg-white rounded-xl p-5 border mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Color Theme</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {THEMES.map(theme => (
                  <div key={theme.id} onClick={() => setSelectedTheme(theme.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedTheme === theme.id ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300'
                    }`}>
                    <div className="flex gap-1 mb-2">
                      {theme.colors.map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded border border-gray-100" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-gray-700">{theme.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('upload')} className="border px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50">← Back</button>
              <button onClick={generateSheet} disabled={generating}
                className="bg-purple-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                {generating ? '⏳ Creating Sheet...' : '📄 Create Sheet →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EXPORT */}
        {step === 'export' && (
          <div>
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sheet Created Successfully!</h2>
              <p className="text-gray-500">Your {SHEET_TYPES.find(s => s.id === selectedSheetType)?.name} is ready</p>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden mb-5">
              <div className="bg-gray-100 p-3 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-500">Sheet Preview — {selectedSize} {selectedOrientation}</span>
              </div>
                <SheetPreview
                  sheetType={selectedSheetType}
                  sheetTitle={sheetTitle}
                  caption={sheetCaption}
                  theme={selectedTheme}
                  size={selectedSize}
                  orientation={selectedOrientation}
                  assets={assets}
                  sheetTypes={SHEET_TYPES}
                  themes={THEMES}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { format: 'PDF', icon: '📄', desc: 'Print-ready PDF' },
                { format: 'PNG', icon: '🖼️', desc: 'High-res image' },
                { format: 'HTML', icon: '🌐', desc: 'Web version' },
              ].map(dl => (
                <button key={dl.format}
                  onClick={async () => {
                    if (!sheetId || sheetId === 'preview') { alert('Sheet export coming soon!'); return }
                    const res = await fetch(`${API_URL}/api/sheets/${sheetId}/export`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ format: dl.format.toLowerCase() })
                    })
                    if (res.ok) { const d = await res.json(); window.open(d.download_url, '_blank') }
                  }}
                  className="bg-white border rounded-xl p-5 text-center hover:border-purple-400 hover:shadow-sm transition-all">
                  <div className="text-3xl mb-2">{dl.icon}</div>
                  <div className="font-semibold text-gray-900">{dl.format}</div>
                  <div className="text-xs text-gray-500 mt-1">{dl.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStep('type'); setSelectedSheetType(null); setSheetId(null) }}
                className="border px-6 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50">
                Create Another Sheet
              </button>
              <Link href="/dashboard"
                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
