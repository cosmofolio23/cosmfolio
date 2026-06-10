/**
 * Sheet Set Wizard
 *
 * Guides user through creating a new architectural sheet set
 * Step 1: Project Info → Step 2: Submission Type → Step 3: Sheet Count → Step 4: Page Setup
 */

import React, { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { SheetSetWizardState, SubmissionType, SheetSize, Orientation } from './sheetSetTypes'
import { SHEET_SET_TEMPLATES } from './sheetSetTemplates'

interface SheetSetWizardProps {
  onComplete: (config: any) => void
  onCancel: () => void
}

export function SheetSetWizard({ onComplete, onCancel }: SheetSetWizardProps) {
  const [state, setState] = useState<SheetSetWizardState>({
    step: 'project-info',
    projectName: '',
  })

  const handleNext = () => {
    const steps: SheetSetWizardState['step'][] = [
      'project-info',
      'submission-type',
      'sheet-count',
      'page-setup',
      'template-select',
      'complete',
    ]
    const currentIdx = steps.indexOf(state.step)
    if (currentIdx < steps.length - 1) {
      setState(prev => ({ ...prev, step: steps[currentIdx + 1] as any }))
    }
  }

  const handleBack = () => {
    const steps: SheetSetWizardState['step'][] = [
      'project-info',
      'submission-type',
      'sheet-count',
      'page-setup',
      'template-select',
      'complete',
    ]
    const currentIdx = steps.indexOf(state.step)
    if (currentIdx > 0) {
      setState(prev => ({ ...prev, step: steps[currentIdx - 1] as any }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBE7A1]/30 to-[#D4AF37]/20 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {['project-info', 'submission-type', 'sheet-count', 'page-setup', 'template-select'].indexOf(state.step) + 1} of 5
            </span>
            <span className="text-sm text-gray-500">{state.projectName}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(['project-info', 'submission-type', 'sheet-count', 'page-setup', 'template-select'].indexOf(state.step) + 1) * 20}%`,
              }}
            />
          </div>
        </div>

        {/* Step: Project Info */}
        {state.step === 'project-info' && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Create Sheet Set</h1>
            <p className="text-gray-600">Let's start with your project information</p>

            <div className="space-y-3 mt-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Project Name</span>
                <input
                  type="text"
                  placeholder="e.g., Museum of Contemporary Art"
                  value={state.projectName}
                  onChange={e => setState(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Student Name (Optional)</span>
                <input
                  type="text"
                  placeholder="Your name"
                  onChange={e => setState(prev => ({ ...prev, studentName: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Institution (Optional)</span>
                <input
                  type="text"
                  placeholder="University / Studio"
                  onChange={e => setState(prev => ({ ...prev, collegeName: e.target.value }))}
                  className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
            </div>
          </div>
        )}

        {/* Step: Submission Type */}
        {state.step === 'submission-type' && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Submission Type</h1>
            <p className="text-gray-600">Choose your sheet set type</p>

            <div className="grid grid-cols-1 gap-3 mt-6">
              {[
                { value: 'thesis', label: '🎓 Thesis', desc: '28 sheets - complete academic submission' },
                { value: 'competition', label: '🏆 Competition', desc: '3 sheets - high-impact boards' },
                { value: 'studio-review', label: '📐 Studio Review', desc: '6 sheets - design review package' },
                { value: 'professional', label: '💼 Professional', desc: 'Custom submission package' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setState(prev => ({ ...prev, submissionType: opt.value as SubmissionType }))}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    state.submissionType === opt.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{opt.label}</div>
                  <div className="text-sm text-gray-600">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Sheet Count */}
        {state.step === 'sheet-count' && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Sheet Count</h1>
            <p className="text-gray-600">How many sheets in your submission?</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Number of Sheets</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={state.sheetCount || 6}
                  onChange={e => setState(prev => ({ ...prev, sheetCount: parseInt(e.target.value) }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  💡 Tip: You can add or remove sheets later. Start with what you have now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Page Setup */}
        {state.step === 'page-setup' && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Page Setup</h1>
            <p className="text-gray-600">Configure your sheet size and orientation</p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sheet Size</label>
                <select
                  value={state.sheetSize || 'A2'}
                  onChange={e => setState(prev => ({ ...prev, sheetSize: e.target.value as SheetSize }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {['A4', 'A3', 'A2', 'A1', 'A0', 'custom'].map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                <select
                  value={state.orientation || 'portrait'}
                  onChange={e => setState(prev => ({ ...prev, orientation: e.target.value as Orientation }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            {state.sheetSize === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  type="number"
                  placeholder="Width (mm)"
                  value={state.customWidth || ''}
                  onChange={e => setState(prev => ({ ...prev, customWidth: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Height (mm)"
                  value={state.customHeight || ''}
                  onChange={e => setState(prev => ({ ...prev, customHeight: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Step: Template Select */}
        {state.step === 'template-select' && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Choose Template</h1>
            <p className="text-gray-600">Start with a predefined layout or build custom</p>

            <div className="mt-6 space-y-3">
              {SHEET_SET_TEMPLATES.filter(t => t.submissionType === state.submissionType).map(template => (
                <button
                  key={template.id}
                  onClick={() => setState(prev => ({ ...prev, selectedTemplate: template.id }))}
                  className={`w-full p-4 border-2 rounded-lg text-left transition ${
                    state.selectedTemplate === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.description}</div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>📄 {template.sheetCount} sheets</span>
                    <span>📐 {template.requirements.plans} plans</span>
                    <span>🎨 {template.requirements.renders} renders</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          {state.step !== 'project-info' && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={
              state.step === 'template-select'
                ? () => {
                    onComplete({
                      projectName: state.projectName,
                      submissionType: state.submissionType,
                      sheetCount: state.sheetCount,
                      sheetSize: state.sheetSize,
                      orientation: state.orientation,
                      customWidth: state.customWidth,
                      customHeight: state.customHeight,
                      selectedTemplate: state.selectedTemplate,
                    })
                  }
                : handleNext
            }
            disabled={
              (state.step === 'project-info' && !state.projectName) ||
              (state.step === 'submission-type' && !state.submissionType) ||
              (state.step === 'sheet-count' && !state.sheetCount) ||
              (state.step === 'page-setup' && !state.sheetSize) ||
              (state.step === 'template-select' && !state.selectedTemplate)
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {state.step === 'template-select' ? 'Create' : 'Next'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
