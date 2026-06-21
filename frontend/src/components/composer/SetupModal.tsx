'use client'

import { useState } from 'react'

export interface SetupSettings {
  orientation: 'portrait' | 'landscape' | 'square'
  size: 'a4' | 'a3' | '1920x1080' | 'website' | 'custom'
  customWidth?: number
  customHeight?: number
  purpose: 'internship' | 'university' | 'thesis' | 'professional'
  pages: number
  projects: number
}

interface Props {
  isOpen: boolean
  isPro?: boolean
  onClose: () => void
  onComplete: (settings: SetupSettings) => void
}

export default function SetupModal({ isOpen, isPro = false, onClose, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [orientation, setOrientation] = useState<SetupSettings['orientation']>('landscape')
  const [size, setSize] = useState<SetupSettings['size']>('a4')
  const [customWidth, setCustomWidth] = useState(297)
  const [customHeight, setCustomHeight] = useState(210)
  const [purpose, setPurpose] = useState<SetupSettings['purpose']>('university')
  const [pages, setPages] = useState(5)
  const [projects, setProjects] = useState(3)

  if (!isOpen) return null

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
    else {
      onComplete({
        orientation,
        size,
        customWidth: size === 'custom' ? customWidth : undefined,
        customHeight: size === 'custom' ? customHeight : undefined,
        purpose,
        pages,
        projects
      })
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350">Portfolio Setup Wizard</h3>
            <p className="text-[10px] text-slate-500">Step {step} of 4</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator Bars */}
        <div className="flex px-6 gap-1.5 pt-3">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-blue-500' : 'bg-slate-800'}`} 
            />
          ))}
        </div>

        {/* Body */}
        <div className="p-6 flex-1 min-h-[260px] flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-base font-bold text-white">Choose Layout Orientation</h4>
                <p className="text-[11px] text-slate-400 mt-1">Select the primary flow of your portfolio spreads</p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { id: 'portrait' as const, label: 'Portrait', desc: 'Vertical book flow', icon: '📄' },
                  { id: 'landscape' as const, label: 'Landscape', desc: 'Widescreen spread', icon: '📖' },
                  { id: 'square' as const, label: 'Square', desc: 'Modern balanced grid', icon: '⏹' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOrientation(item.id)}
                    className={`flex flex-col items-center p-4 rounded-xl border transition text-center hover:bg-slate-800/40 ${
                      orientation === item.id 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-slate-800 bg-slate-950/20 text-slate-400'
                    }`}
                  >
                    <span className="text-2xl mb-1.5">{item.icon}</span>
                    <span className="text-xs font-semibold block">{item.label}</span>
                    <span className="text-[9px] opacity-75 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-base font-bold text-white">Select Page Dimensions</h4>
                <p className="text-[11px] text-slate-400 mt-1">Choose your printing size or digital screen canvas</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {[
                  { id: 'a4' as const, label: 'A4 Format', desc: '297 × 210 mm (Standard)' },
                  { id: 'a3' as const, label: 'A3 Portfolio', desc: '420 × 297 mm (Large)' },
                  { id: '1920x1080' as const, label: 'Full HD Screen', desc: '16:9 Presentation Format' },
                  { id: 'website' as const, label: 'Website Portfolio', desc: 'Interactive digital layout' },
                  { id: 'custom' as const, label: 'Custom Canvas', desc: 'Specify width and height' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSize(item.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition hover:bg-slate-800/40 ${
                      size === item.id 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-slate-800 bg-slate-950/20 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span className="text-[9px] opacity-75 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>

              {size === 'custom' && (
                <div className="flex gap-3 pt-2 items-center justify-center animate-fadeIn">
                  <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800 rounded-lg px-2 py-1">
                    <span className="text-[9px] text-slate-500 uppercase font-mono">W:</span>
                    <input 
                      type="number" 
                      value={customWidth} 
                      onChange={e => setCustomWidth(parseInt(e.target.value) || 297)}
                      className="w-16 bg-transparent text-white text-xs text-center outline-none" 
                    />
                    <span className="text-[9px] text-slate-500">mm</span>
                  </div>
                  <span className="text-slate-600 text-xs">×</span>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800 rounded-lg px-2 py-1">
                    <span className="text-[9px] text-slate-500 uppercase font-mono">H:</span>
                    <input 
                      type="number" 
                      value={customHeight} 
                      onChange={e => setCustomHeight(parseInt(e.target.value) || 210)}
                      className="w-16 bg-transparent text-white text-xs text-center outline-none" 
                    />
                    <span className="text-[9px] text-slate-500">mm</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-base font-bold text-white">Define Portfolio Purpose</h4>
                <p className="text-[11px] text-slate-400 mt-1">We will optimize page flow and furniture for your goals</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { id: 'university' as const, label: 'Academic Application', desc: 'Universtity entry / GSD, MIT styles', icon: '🏫' },
                  { id: 'internship' as const, label: 'Internship Quest', desc: 'Visual, high-impact drawings', icon: '📐' },
                  { id: 'thesis' as const, label: 'Graduate Thesis', desc: 'Extended descriptions, layout series', icon: '📚' },
                  { id: 'professional' as const, label: 'Professional Office', desc: 'Built projects, detail heavy', icon: '🏢' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPurpose(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition hover:bg-slate-800/40 ${
                      purpose === item.id 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-slate-800 bg-slate-950/20 text-slate-400'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <span className="text-xs font-semibold block leading-tight">{item.label}</span>
                      <span className="text-[9px] opacity-75 mt-0.5 block">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <h4 className="text-base font-bold text-white">Project Scale & Length</h4>
                <p className="text-[11px] text-slate-400 mt-1">Estimate the initial sizing of your publishing document</p>
              </div>
              <div className="space-y-4 pt-2">
                {/* Pages */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Target Page Count</span>
                    <span className="font-mono text-blue-400 font-bold">{pages} Pages</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="1" max={isPro ? "30" : "5"} step="1"
                      value={pages}
                      onChange={e => setPages(parseInt(e.target.value))}
                      className="flex-1 h-1 accent-blue-500 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    {isPro ? "Pro plan unlocked: Up to 30 pages per portfolio." : "Free plan includes up to 6 pages. More pages unlock in Pro."}
                  </p>
                </div>
                {/* Projects */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">Number of Projects</span>
                    <span className="font-mono text-blue-400 font-bold">{projects} Projects</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="1" max={isPro ? "10" : "3"} step="1"
                      value={projects}
                      onChange={e => setProjects(parseInt(e.target.value))}
                      className="flex-1 h-1 accent-blue-500 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-950/30 border border-slate-800 rounded-lg p-2.5 text-center text-[10px] text-slate-400">
                ⭐ Matching templates will be selected automatically based on this profile.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 border border-slate-850 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-lg shadow-blue-900/20"
          >
            {step === 4 ? 'Complete Setup ✓' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  )
}
