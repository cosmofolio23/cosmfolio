/**
 * Sheet Set Wizard
 *
 * Step 1: Page setup (sheet size + orientation — every drawing depends on it)
 * Step 2: Which sheets? (plan / section / elevation / views / site / concept …)
 * Step 3: Layout pack (one consistent layout system across every sheet type)
 * Step 4: Project info → create
 */

import React, { useMemo, useState } from 'react'
import { ChevronRight, ChevronLeft, Minus, Plus } from 'lucide-react'
import type { SheetSize, Orientation, SheetType } from './sheetSetTypes'
import {
  SHEET_TYPE_OPTIONS, LAYOUT_PACKS, SELECTION_PRESETS,
  layoutsForType, packLayoutForType,
  type SheetSelection, type WizardBuildConfig, type LayoutPack,
} from './sheetTypeLayouts'

interface SheetSetWizardProps {
  onComplete: (config: WizardBuildConfig) => void
  onCancel: () => void
}

type Step = 'page-setup' | 'sheet-selection' | 'layout-pack' | 'project-info'
const STEPS: Step[] = ['page-setup', 'sheet-selection', 'layout-pack', 'project-info']
const STEP_TITLES: Record<Step, string> = {
  'page-setup': 'Sheet size',
  'sheet-selection': 'Your sheets',
  'layout-pack': 'Layout pack',
  'project-info': 'Project info',
}

const GOLD = '#D4AF37'

export function SheetSetWizard({ onComplete, onCancel }: SheetSetWizardProps) {
  const [step, setStep] = useState<Step>('page-setup')
  const [sheetSize, setSheetSize] = useState<SheetSize>('A1')
  const [orientation, setOrientation] = useState<Orientation>('landscape')
  const [customWidth, setCustomWidth] = useState<number | undefined>()
  const [customHeight, setCustomHeight] = useState<number | undefined>()
  const [counts, setCounts] = useState<Record<string, number>>({ cover: 1, plans: 2, sections: 1, elevations: 1, renders: 1 })
  const [packId, setPackId] = useState('classic-academic')
  const [projectName, setProjectName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [collegeName, setCollegeName] = useState('')

  const stepIdx = STEPS.indexOf(step)
  const selections: SheetSelection[] = useMemo(
    () => SHEET_TYPE_OPTIONS.filter(o => (counts[o.type] || 0) > 0).map(o => ({ type: o.type, count: counts[o.type] })),
    [counts]
  )
  const totalSheets = selections.reduce((a, s) => a + s.count, 0)

  const setCount = (type: SheetType, next: number) =>
    setCounts(prev => ({ ...prev, [type]: Math.max(0, Math.min(12, next)) }))

  const applyPreset = (presetId: string) => {
    const preset = SELECTION_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    const next: Record<string, number> = {}
    preset.selections.forEach(s => { next[s.type] = s.count })
    setCounts(next)
  }

  const canNext =
    step === 'page-setup' ? (sheetSize !== 'custom' || (!!customWidth && !!customHeight)) :
    step === 'sheet-selection' ? totalSheets > 0 :
    step === 'layout-pack' ? !!packId :
    !!projectName.trim()

  const finish = () => onComplete({
    projectName: projectName.trim(),
    studentName: studentName.trim() || undefined,
    collegeName: collegeName.trim() || undefined,
    sheetSize, orientation, customWidth, customHeight,
    selections, packId,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBE7A1]/30 to-[#D4AF37]/20 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[94vh] overflow-y-auto">
        {/* Progress */}
        <div className="mb-7">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Step {stepIdx + 1} of {STEPS.length} — {STEP_TITLES[step]}
            </span>
            <span className="text-sm text-gray-400">{totalSheets > 0 && step !== 'page-setup' ? `${totalSheets} sheets` : ''}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-[#D4AF37] to-[#9C7416]"
              style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* STEP 1 — Page setup */}
        {step === 'page-setup' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sheet size</h1>
            <p className="text-gray-500 mt-1 mb-6">Everything starts with the paper — pick your submission format.</p>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {(['A4', 'A3', 'A2', 'A1', 'A0'] as SheetSize[]).map((s, i) => {
                const dims = [['210', '297'], ['297', '420'], ['420', '594'], ['594', '841'], ['841', '1189']][i]
                const rel = [0.42, 0.5, 0.6, 0.72, 0.86][i]
                return (
                  <button key={s} onClick={() => setSheetSize(s)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center transition ${sheetSize === s ? 'border-[#D4AF37] bg-[#FBE7A1]/25' : 'border-gray-200 hover:border-[#D4AF37]/50'}`}>
                    <div className="flex items-end justify-center h-20 mb-2">
                      <div className="border-2 border-gray-400 bg-white"
                        style={orientation === 'portrait'
                          ? { width: `${rel * 52}px`, height: `${rel * 74}px` }
                          : { width: `${rel * 74}px`, height: `${rel * 52}px` }} />
                    </div>
                    <div className="font-bold text-gray-900">{s}</div>
                    <div className="text-[10px] text-gray-400">{dims[0]}×{dims[1]}mm</div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 mt-5">
              <span className="text-sm font-medium text-gray-700">Orientation</span>
              {(['landscape', 'portrait'] as Orientation[]).map(o => (
                <button key={o} onClick={() => setOrientation(o)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize border-2 transition ${orientation === o ? 'border-[#D4AF37] bg-[#FBE7A1]/25 font-semibold' : 'border-gray-200'}`}>
                  {o === 'landscape' ? '▭' : '▯'} {o}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={() => setSheetSize('custom')}
                className={`px-3 py-2 rounded-lg text-xs border-2 ${sheetSize === 'custom' ? 'border-[#D4AF37] bg-[#FBE7A1]/25' : 'border-gray-200 text-gray-500'}`}>
                Custom size
              </button>
            </div>

            {sheetSize === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <input type="number" placeholder="Width (mm)" value={customWidth || ''}
                  onChange={e => setCustomWidth(parseInt(e.target.value) || undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" placeholder="Height (mm)" value={customHeight || ''}
                  onChange={e => setCustomHeight(parseInt(e.target.value) || undefined)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Sheet selection */}
        {step === 'sheet-selection' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Which sheets do you need?</h1>
            <p className="text-gray-500 mt-1 mb-4">Pick the sheet types and how many of each. You can add more later.</p>

            <div className="flex gap-2 mb-5">
              <span className="text-xs text-gray-400 self-center">Quick start:</span>
              {SELECTION_PRESETS.map(p => (
                <button key={p.id} onClick={() => applyPreset(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FBE7A1]/40 text-[#9C7416] hover:bg-[#FBE7A1]/70 transition">
                  {p.icon} {p.name} ({p.selections.reduce((a, s) => a + s.count, 0)})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {SHEET_TYPE_OPTIONS.map(opt => {
                const count = counts[opt.type] || 0
                const active = count > 0
                return (
                  <div key={opt.type}
                    className={`p-3 rounded-xl border-2 transition ${active ? 'border-[#D4AF37] bg-[#FBE7A1]/20' : 'border-gray-200'}`}>
                    <button onClick={() => setCount(opt.type, active ? 0 : opt.defaultCount)} className="w-full text-left">
                      <div className="text-xl">{opt.icon}</div>
                      <div className="font-semibold text-sm text-gray-900">{opt.name}</div>
                      <div className="text-[10px] text-gray-400 leading-tight">{opt.desc}</div>
                    </button>
                    <div className="flex items-center justify-between mt-2">
                      <button onClick={() => setCount(opt.type, count - 1)} disabled={count === 0}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                        <Minus size={13} />
                      </button>
                      <span className={`text-sm font-bold tabular-nums ${active ? 'text-[#9C7416]' : 'text-gray-300'}`}>
                        {count} {count === 1 ? 'sheet' : 'sheets'}
                      </span>
                      <button onClick={() => setCount(opt.type, count + 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3 — Layout pack */}
        {step === 'layout-pack' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Layout pack</h1>
            <p className="text-gray-500 mt-1 mb-5">
              One graphic system across all your sheets — each sheet type gets a matching layout.
              You can switch any sheet's layout later in the editor.
            </p>

            <div className="space-y-3">
              {LAYOUT_PACKS.map(pack => (
                <button key={pack.id} onClick={() => setPackId(pack.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition ${packId === pack.id ? 'border-[#D4AF37] bg-[#FBE7A1]/20' : 'border-gray-200 hover:border-[#D4AF37]/40'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{pack.name}</div>
                      <div className="text-xs text-gray-500">{pack.desc}</div>
                    </div>
                    <span className="w-5 h-5 rounded-full border" style={{ background: pack.style.primaryColor }} />
                  </div>
                  {/* per-type mini layout previews for the sheets the user picked */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {selections.slice(0, 8).map(sel => (
                      <PackTypePreview key={sel.type} pack={pack} type={sel.type} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — Project info */}
        {step === 'project-info' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project info</h1>
            <p className="text-gray-500 mt-1 mb-6">Used on every sheet's title block.</p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Project name *</span>
                <input type="text" autoFocus placeholder="e.g., Urban Craft Museum"
                  value={projectName} onChange={e => setProjectName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Student name</span>
                <input type="text" placeholder="Your name" value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Institution</span>
                <input type="text" placeholder="College / studio" value={collegeName}
                  onChange={e => setCollegeName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent" />
              </label>

              <div className="p-4 rounded-xl bg-[#FBE7A1]/25 border border-[#D4AF37]/30 text-sm text-[#9C7416]">
                <b>{totalSheets} sheets</b> · {sheetSize} {orientation} · {LAYOUT_PACKS.find(p => p.id === packId)?.name}
                <div className="text-xs mt-1 text-[#9C7416]/80">
                  {selections.map(s => `${s.count}× ${SHEET_TYPE_OPTIONS.find(o => o.type === s.type)?.name}`).join(' · ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          {stepIdx > 0 && (
            <button onClick={() => setStep(STEPS[stepIdx - 1])}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5">
              <ChevronLeft size={18} /> Back
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={step === 'project-info' ? finish : () => setStep(STEPS[stepIdx + 1])}
            disabled={!canNext}
            className="px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 font-semibold bg-gradient-to-r from-[#D4AF37] to-[#9C7416] hover:brightness-105 transition">
            {step === 'project-info' ? `Create ${totalSheets} sheets` : 'Next'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Tiny CSS-grid preview of the layout a pack assigns to a sheet type. */
function PackTypePreview({ pack, type }: { pack: LayoutPack; type: SheetType }) {
  const layout = packLayoutForType(pack, type)
  const opt = SHEET_TYPE_OPTIONS.find(o => o.type === type)
  const cells = Math.min(layout.slotDefinitions.length, layout.columnCount * layout.rowCount)
  return (
    <div className="flex flex-col items-center gap-1" title={`${opt?.name}: ${layout.name}`}>
      <div className="w-12 h-9 bg-white border border-gray-300 rounded-sm p-[3px] grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${layout.columnCount}, 1fr)`, gridTemplateRows: `repeat(${layout.rowCount}, 1fr)` }}>
        {Array.from({ length: cells }, (_, i) => (
          <div key={i} className="rounded-[1px]" style={{ background: `${GOLD}55` }} />
        ))}
      </div>
      <span className="text-[8px] text-gray-400 leading-none">{opt?.icon} {opt?.name}</span>
    </div>
  )
}
