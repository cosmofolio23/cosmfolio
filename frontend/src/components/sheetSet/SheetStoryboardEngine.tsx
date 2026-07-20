import React, { useState } from 'react'
import {
  Sparkles,
  Upload,
  LayoutGrid,
  Palette,
  FileDown,
  ChevronRight,
  Layers,
  Wand2,
  RefreshCw,
  CheckCircle2,
  Plus,
  Eye,
  SlidersHorizontal,
  ArrowRight,
  Sun,
  Wind,
  Compass,
  FileText,
  Image as ImageIcon,
  Check
} from 'lucide-react'
import type { SheetSet, Sheet, SheetElement } from './sheetSetTypes'
import { TitleBlockRenderer } from './TitleBlockEngine'
import { SHEET_SIZES, mmToPx } from './sheetSetTypes'

interface SheetStoryboardEngineProps {
  sheetSet: SheetSet
  currentSheetId: string
  onUpdateSheetSet: (updates: Partial<SheetSet>) => void
  onUpdateSheet: (sheetId: string, updates: Partial<Sheet>) => void
  onAddSheet: (title?: string) => void
  onDeleteSheet: (sheetId: string) => void
  onSelectSheet: (sheetId: string) => void
  onExportPdf: () => void
  onSwitchToCanvasMode: () => void
}

// ─────────────────────────────────────────────────────────────
// STORYBOARD ARCHETYPES & STYLE DNA
// ─────────────────────────────────────────────────────────────

interface Archetype {
  id: string
  name: string
  subtitle: string
  icon: string
  description: string
  recommendedSize: string
  previewSvg: React.ReactNode
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'competition-hero',
    name: 'Competition Hero Spread',
    subtitle: '1 Hero Visual + 3 Technical Drawings',
    icon: '🏆',
    description: 'Designed to capture jury attention immediately. Massive top visual focal area with 3 crisp technical plan & section columns below.',
    recommendedSize: 'A1 Horizontal',
    previewSvg: (
      <svg className="w-full h-24 text-gray-400" viewBox="0 0 160 100" fill="none">
        <rect x="5" y="5" width="150" height="45" rx="3" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1" />
        <text x="80" y="30" textAnchor="middle" fontSize="9" fill="#4338CA" fontWeight="bold">Hero 3D Render</text>
        <rect x="5" y="55" width="46" height="40" rx="2" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="0.8" />
        <rect x="57" y="55" width="46" height="40" rx="2" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="0.8" />
        <rect x="109" y="55" width="46" height="40" rx="2" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="0.8" />
        <text x="28" y="77" textAnchor="middle" fontSize="6" fill="#6B7280">Plan 1:100</text>
        <text x="80" y="77" textAnchor="middle" fontSize="6" fill="#6B7280">Section A-A</text>
        <text x="132" y="77" textAnchor="middle" fontSize="6" fill="#6B7280">Elevation</text>
      </svg>
    )
  },
  {
    id: 'thesis-continuous',
    name: 'Continuous Thesis Jury Lineup',
    subtitle: '4 Horizontal A1 Boards Flow',
    icon: '🎓',
    description: 'For university thesis reviews. Aligns site plan, floor plans, structural details, and environmental diagrams seamlessly across 4 boards.',
    recommendedSize: 'A1 Landscape (4-Board Set)',
    previewSvg: (
      <svg className="w-full h-24 text-gray-400" viewBox="0 0 160 100" fill="none">
        <rect x="5" y="10" width="34" height="80" rx="2" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.8" />
        <rect x="43" y="10" width="34" height="80" rx="2" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.8" />
        <rect x="81" y="10" width="34" height="80" rx="2" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.8" />
        <rect x="119" y="10" width="34" height="80" rx="2" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.8" />
        <path d="M 5 50 L 153 50" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3,3" />
        <text x="80" y="46" textAnchor="middle" fontSize="6" fill="#7C3AED" fontWeight="bold">Continuous Ground Datum Line</text>
      </svg>
    )
  },
  {
    id: 'site-environmental',
    name: 'Site & Environmental Analysis',
    subtitle: 'Sun Path + Wind Rose + Keyplan Focus',
    icon: '☀️',
    description: 'Dedicated site analysis spread. Integrates sun path solar arcs, prevailing wind rose, climate bar graphs, and contextual key plans.',
    recommendedSize: 'A2 / A1 Board',
    previewSvg: (
      <svg className="w-full h-24 text-gray-400" viewBox="0 0 160 100" fill="none">
        <circle cx="45" cy="50" r="30" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
        <path d="M 20 40 A 25 25 0 0 1 70 40" stroke="#D97706" strokeWidth="1.5" fill="none" />
        <text x="45" y="52" textAnchor="middle" fontSize="6" fill="#B45309" fontWeight="bold">Sun Path</text>
        <rect x="90" y="15" width="65" height="32" rx="2" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="0.8" />
        <text x="122" y="33" textAnchor="middle" fontSize="6" fill="#1D4ED8">Wind Rose Chart</text>
        <rect x="90" y="53" width="65" height="32" rx="2" fill="#ECFDF5" stroke="#10B981" strokeWidth="0.8" />
        <text x="122" y="71" textAnchor="middle" fontSize="6" fill="#047857">Monthly Climate</text>
      </svg>
    )
  },
  {
    id: 'technical-minimalist',
    name: 'Swiss Architectural Grid',
    subtitle: 'Precise 12-Column Technical Grid',
    icon: '📐',
    description: 'Ultra-clean Swiss minimalist layout with strict 12-column gutters, precise drawing tags, scale bars, and crisp architectural typography.',
    recommendedSize: 'A1 / A2 Landscape',
    previewSvg: (
      <svg className="w-full h-24 text-gray-400" viewBox="0 0 160 100" fill="none">
        {[10, 22, 34, 46, 58, 70, 82, 94, 106, 118, 130, 142].map(x => (
          <line key={x} x1={x} y1="10" x2={x} y2="90" stroke="#E5E7EB" strokeWidth="0.5" />
        ))}
        <rect x="22" y="20" width="56" height="50" fill="#FFFFFF" stroke="#111827" strokeWidth="1" />
        <rect x="82" y="20" width="56" height="50" fill="#FFFFFF" stroke="#111827" strokeWidth="1" />
        <text x="50" y="48" textAnchor="middle" fontSize="6" fill="#111827" fontWeight="bold">Plan 1:50</text>
        <text x="110" y="48" textAnchor="middle" fontSize="6" fill="#111827" fontWeight="bold">Section 1:50</text>
      </svg>
    )
  }
]

interface StylePreset {
  id: string
  name: string
  studioName: string
  primaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  titleBlockTemplate: any
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'big-style',
    name: 'BIG (Bjarke Ingels)',
    studioName: 'Vibrant & Modern',
    primaryColor: '#FF4B4B',
    backgroundColor: '#F9F9FB',
    textColor: '#111111',
    fontFamily: 'Outfit, sans-serif',
    titleBlockTemplate: 'minimal-corner'
  },
  {
    id: 'zaha-style',
    name: 'Zaha Hadid Studio',
    studioName: 'Dark Fluid Contrast',
    primaryColor: '#8B5CF6',
    backgroundColor: '#0F172A',
    textColor: '#F8FAFC',
    fontFamily: 'Space Grotesk, sans-serif',
    titleBlockTemplate: 'modern-sidebar'
  },
  {
    id: 'foster-style',
    name: 'Foster + Partners',
    studioName: 'Swiss Minimalist',
    primaryColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    textColor: '#0F172A',
    fontFamily: 'Inter, sans-serif',
    titleBlockTemplate: 'classic-bottom'
  },
  {
    id: 'blueprint-style',
    name: 'Technical Blueprint',
    studioName: 'Cyan Technical Line',
    primaryColor: '#38BDF8',
    backgroundColor: '#0B2A66',
    textColor: '#F0F9FF',
    fontFamily: 'Courier New, monospace',
    titleBlockTemplate: 'classic-bottom'
  }
]

export const SheetStoryboardEngine: React.FC<SheetStoryboardEngineProps> = ({
  sheetSet,
  currentSheetId,
  onUpdateSheetSet,
  onUpdateSheet,
  onAddSheet,
  onDeleteSheet,
  onSelectSheet,
  onExportPdf,
  onSwitchToCanvasMode
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(2) // Default to step 2 for immediate visual selection
  const [selectedArchetype, setSelectedArchetype] = useState<string>('competition-hero')
  const [activeTab, setActiveTab] = useState<'boards' | 'styles'>('boards')

  // Find active sheet
  const activeSheet = sheetSet.sheets.find(s => s.id === currentSheetId) || sheetSet.sheets[0]

  // Calculate paper dimensions in mm and px
  const pageSize = SHEET_SIZES[sheetSet.sheetSize as keyof typeof SHEET_SIZES] || SHEET_SIZES.A1
  const isPortrait = sheetSet.orientation === 'portrait'
  const sheetWidthMm = isPortrait ? pageSize.width : pageSize.height
  const sheetHeightMm = isPortrait ? pageSize.height : pageSize.width

  // Apply archetype auto-layout
  const handleApplyArchetype = (archetypeId: string) => {
    setSelectedArchetype(archetypeId)
    
    // Auto generate elements for current sheet based on archetype
    if (!activeSheet) return

    let newElements: SheetElement[] = []

    if (archetypeId === 'competition-hero') {
      newElements = [
        {
          id: `elem-hero-${Date.now()}`,
          kind: 'diagram',
          x: 5,
          y: 5,
          w: 90,
          h: 42,
          z: 1,
          locked: false,
          visible: true,
          content: 'Hero 3D Perspective Render (Click to replace image)',
          fontSize: 16,
          color: '#4B5563',
          bgColor: '#F3F4F6'
        },
        {
          id: `elem-plan-${Date.now()}`,
          kind: 'diagram',
          x: 5,
          y: 52,
          w: 28,
          h: 36,
          z: 2,
          locked: false,
          visible: true,
          content: 'Ground Floor Plan 1:100',
          fontSize: 12,
          color: '#111827',
          bgColor: '#FFFFFF'
        },
        {
          id: `elem-sec-${Date.now()}`,
          kind: 'diagram',
          x: 36,
          y: 52,
          w: 28,
          h: 36,
          z: 3,
          locked: false,
          visible: true,
          content: 'Longitudinal Section A-A 1:100',
          fontSize: 12,
          color: '#111827',
          bgColor: '#FFFFFF'
        },
        {
          id: `elem-elev-${Date.now()}`,
          kind: 'diagram',
          x: 67,
          y: 52,
          w: 28,
          h: 36,
          z: 4,
          locked: false,
          visible: true,
          content: 'South Elevation 1:100',
          fontSize: 12,
          color: '#111827',
          bgColor: '#FFFFFF'
        }
      ]
    } else if (archetypeId === 'site-environmental') {
      newElements = [
        {
          id: `elem-sun-${Date.now()}`,
          kind: 'sitewidget',
          siteAnalysisType: 'sunpath',
          locationName: 'Latitude 13.08° N (Chennai)',
          x: 5,
          y: 10,
          w: 42,
          h: 40,
          z: 1,
          locked: false,
          visible: true
        },
        {
          id: `elem-wind-${Date.now()}`,
          kind: 'sitewidget',
          siteAnalysisType: 'windrose',
          locationName: 'Prevailing SW Wind (12.4 m/s)',
          x: 52,
          y: 10,
          w: 43,
          h: 40,
          z: 2,
          locked: false,
          visible: true
        },
        {
          id: `elem-climate-${Date.now()}`,
          kind: 'sitewidget',
          siteAnalysisType: 'climatology',
          locationName: 'Monthly Temp & Rainfall',
          x: 5,
          y: 54,
          w: 90,
          h: 35,
          z: 3,
          locked: false,
          visible: true
        }
      ]
    } else {
      // Technical Grid default
      newElements = [
        {
          id: `elem-tech1-${Date.now()}`,
          kind: 'diagram',
          x: 5,
          y: 10,
          w: 42,
          h: 75,
          z: 1,
          locked: false,
          visible: true,
          content: 'Master Floor Plan 1:50',
          fontSize: 14,
          bgColor: '#FFFFFF'
        },
        {
          id: `elem-tech2-${Date.now()}`,
          kind: 'diagram',
          x: 52,
          y: 10,
          w: 43,
          h: 75,
          z: 2,
          locked: false,
          visible: true,
          content: 'Transverse Section B-B 1:50',
          fontSize: 14,
          bgColor: '#FFFFFF'
        }
      ]
    }

    onUpdateSheet(activeSheet.id, { elements: newElements })
  }

  // Handle Style DNA selection
  const handleApplyStyle = (preset: StylePreset) => {
    onUpdateSheetSet({
      fontFamily: preset.fontFamily,
      backgroundColor: preset.backgroundColor,
      textColor: preset.textColor,
      primaryColor: preset.primaryColor,
      titleBlockTemplate: preset.titleBlockTemplate
    })
  }

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* TOP STEPPER & HEADER BAR */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Storyboard Engine</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI Auto-Flow
              </span>
            </h2>
            <p className="text-xs text-slate-400">Zero-effort architectural portfolio & jury board generator</p>
          </div>
        </div>

        {/* 3-Step Wizard Navigation */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/60 text-xs">
          <button
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition ${
              currentStep === 1 ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Asset Bucket</span>
          </button>

          <ChevronRight size={14} className="text-slate-600" />

          <button
            onClick={() => setCurrentStep(2)}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition ${
              currentStep === 2 ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Archetype & Style</span>
          </button>

          <ChevronRight size={14} className="text-slate-600" />

          <button
            onClick={() => setCurrentStep(3)}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition ${
              currentStep === 3 ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Live Boards Spread</span>
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportPdf}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs rounded-lg shadow-md transition flex items-center gap-1.5"
          >
            <FileDown size={15} />
            <span>Export PDF</span>
          </button>

          <button
            onClick={onSwitchToCanvasMode}
            className="px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-600 transition flex items-center gap-1.5"
            title="Switch to pixel canvas editor"
          >
            <SlidersHorizontal size={14} />
            <span>Canvas Mode</span>
          </button>
        </div>
      </div>

      {/* MAIN STEP CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* STEP 1: SMART ASSET BUCKET */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <span>📁 Drop Your Project Assets</span>
              </h3>
              <p className="text-sm text-slate-400">
                Upload your floor plans, renders, section drawings, and thesis text once. The Storyboard Engine auto-flows them into your boards.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div className="border-2 border-dashed border-purple-500/40 hover:border-purple-500 rounded-2xl p-10 bg-slate-800/40 hover:bg-slate-800/80 transition flex flex-col items-center justify-center text-center cursor-pointer group shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Drag & Drop All Drawings & Renders</h4>
              <p className="text-xs text-slate-400 mb-4 max-w-md">
                Supports PNG, JPG, SVG, CAD exports, and PDF drawings. Files are automatically tagged into Plans, Renders, and Diagrams.
              </p>
              <button className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition">
                Browse Files
              </button>
            </div>

            {/* Smart Categorized Asset Buckets */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon size={15} />
                    <span>Hero Visuals (0)</span>
                  </span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-200">3D Renders</span>
                </div>
                <div className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-700 rounded-lg">
                  Drop perspective renders & sketches here
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <Layers size={15} />
                    <span>Technical Plans (0)</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-200">CAD / Vector</span>
                </div>
                <div className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-700 rounded-lg">
                  Drop floor plans, sections, elevations
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Sun size={15} />
                    <span>Diagrams & Text (0)</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">Site & Meta</span>
                </div>
                <div className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-700 rounded-lg">
                  Drop sun path diagrams & project abstract
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <span>Continue to Step 2: Choose Archetype</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ARCHETYPE & STYLE DNA */}
        {currentStep === 2 && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🎨 Select Presentation Archetype & Style DNA</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pick a layout structure and office studio theme. The engine automatically lays out your boards with golden ratios.
                </p>
              </div>

              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setActiveTab('boards')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === 'boards' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏆 Board Archetypes
                </button>
                <button
                  onClick={() => setActiveTab('styles')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeTab === 'styles' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🎨 Office Style DNA
                </button>
              </div>
            </div>

            {/* ARCHETYPES SELECTION */}
            {activeTab === 'boards' && (
              <div className="grid grid-cols-2 gap-5">
                {ARCHETYPES.map(arch => {
                  const isSelected = selectedArchetype === arch.id
                  return (
                    <div
                      key={arch.id}
                      onClick={() => handleApplyArchetype(arch.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800 border-purple-500 ring-2 ring-purple-500/50 shadow-2xl scale-[1.01]'
                          : 'bg-slate-800/40 border-slate-700/70 hover:border-purple-500/50 hover:bg-slate-800/80'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                          <Check size={14} />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{arch.icon}</span>
                          <div>
                            <h4 className="text-base font-bold text-white">{arch.name}</h4>
                            <p className="text-xs text-purple-300 font-semibold">{arch.subtitle}</p>
                          </div>
                        </div>

                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/50">
                          {arch.previewSvg}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{arch.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Recommended: <strong className="text-slate-200">{arch.recommendedSize}</strong></span>
                        <span className={`font-bold px-2.5 py-1 rounded-md text-[10px] ${
                          isSelected ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {isSelected ? 'Active Archetype' : 'Click to Apply'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* STYLE DNA PRESETS */}
            {activeTab === 'styles' && (
              <div className="grid grid-cols-2 gap-5">
                {STYLE_PRESETS.map(preset => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyStyle(preset)}
                    className="p-5 rounded-2xl border border-slate-700/70 bg-slate-800/40 hover:bg-slate-800/80 hover:border-purple-500/50 transition-all cursor-pointer space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white">{preset.name}</h4>
                        <p className="text-xs text-slate-400">{preset.studioName}</p>
                      </div>
                      <div
                        className="w-7 h-7 rounded-full border border-slate-600 shadow-md"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                    </div>

                    <div
                      className="p-4 rounded-xl border shadow-inner font-sans space-y-2"
                      style={{
                        backgroundColor: preset.backgroundColor,
                        color: preset.textColor,
                        fontFamily: preset.fontFamily
                      }}
                    >
                      <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: `${preset.textColor}20` }}>
                        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: preset.primaryColor }}>
                          ARCHITECTURAL STUDIO SPREAD
                        </span>
                        <span className="text-[10px] opacity-60">SHEET 01/04</span>
                      </div>
                      <div className="text-sm font-bold truncate">RESIDENTIAL CUL-DE-SAC THESIS</div>
                      <div className="text-[10px] opacity-70 truncate">Scale 1:100 @ A1 • Chennai Latitude 13.08° N</div>
                    </div>

                    <button className="w-full py-2 bg-slate-700 hover:bg-purple-600 hover:text-white text-slate-200 text-xs font-bold rounded-lg transition">
                      Apply Style DNA
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Back to Asset Bucket
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm rounded-xl shadow-xl transition flex items-center gap-2"
              >
                <span>Generate Board Spreads</span>
                <Sparkles size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LIVE STORYBOARD BOARDS SPREAD */}
        {currentStep === 3 && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>✨ Live Presentation Boards</span>
                  <span className="text-xs font-normal text-slate-400">({sheetSet.sheets.length} Sheets in Portfolio)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hover any board section to swap layout variants in 1-click or replace drawings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddSheet(`Sheet ${sheetSet.sheets.length + 1}`)}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add A1 Board</span>
                </button>

                <button
                  onClick={() => handleApplyArchetype(selectedArchetype)}
                  className="px-3 py-1.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white text-xs font-bold rounded-lg border border-purple-500/30 transition flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  <span>Auto-Refine Layout</span>
                </button>
              </div>
            </div>

            {/* Render Area */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-950/80 rounded-3xl border border-slate-800 shadow-2xl min-h-[550px] overflow-auto relative">
              {activeSheet ? (
                <div className="space-y-4">
                  <div
                    className="relative shadow-2xl transition-all duration-300 rounded-sm overflow-hidden"
                    style={{
                      width: `${mmToPx(sheetWidthMm) * 0.75}px`,
                      height: `${mmToPx(sheetHeightMm) * 0.75}px`,
                      backgroundColor: sheetSet.backgroundColor || '#ffffff',
                      color: sheetSet.textColor || '#111111',
                      fontFamily: sheetSet.fontFamily || 'Inter'
                    }}
                  >
                    <TitleBlockRenderer sheetSet={sheetSet} sheet={activeSheet} />

                    <div className="absolute inset-0 p-6 pointer-events-auto">
                      {activeSheet.elements.map(elem => (
                        <div
                          key={elem.id}
                          className="absolute border border-purple-500/20 hover:border-purple-600 hover:ring-2 hover:ring-purple-500/40 rounded transition-all bg-white/80 flex items-center justify-center text-center p-3 group shadow-sm"
                          style={{
                            left: `${elem.x}%`,
                            top: `${elem.y}%`,
                            width: `${elem.w}%`,
                            height: `${elem.h}%`,
                            zIndex: elem.z
                          }}
                        >
                          <div className="text-xs font-semibold text-gray-800">
                            {elem.content || (elem.siteAnalysisType ? `Widget: ${elem.siteAnalysisType}` : 'Drawing Slot')}
                          </div>

                          <div className="absolute inset-0 bg-purple-900/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                            <button
                              onClick={() => {
                                const newW = elem.w === 90 ? 43 : 90
                                const newH = elem.h === 42 ? 75 : 42
                                onUpdateSheet(activeSheet.id, {
                                  elements: activeSheet.elements.map(e => e.id === elem.id ? { ...e, w: newW, h: newH } : e)
                                })
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded text-[10px] font-bold shadow flex items-center gap-1"
                            >
                              <RefreshCw size={12} />
                              <span>Swap Layout Variant</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4">
                    {sheetSet.sheets.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => onSelectSheet(s.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          s.id === activeSheet.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg scale-105'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        Board {s.sheetNumber || idx + 1}: {s.sheetName}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">No sheets found in portfolio</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
