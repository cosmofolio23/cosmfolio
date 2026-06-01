'use client'

/**
 * Portfolio Creation Wizard (Batch 1 v2)
 *
 * Multi-step wizard that mirrors the actual portfolio structure:
 *   Step 1: Basics (name, type, project count)
 *   Step 2: Front Cover (title, subtitle, year, author, studio, image)
 *   Step 3: About Me Page (toggle + sub-sections: bio/resume/skills/etc.)
 *   Step 4: Contents Page (toggle)
 *   Step 5: End Page (Contact info)
 *   Step 6: Review & Generate
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolioBuilder } from '@/store/portfolioBuilder'
import { PortfolioType, AboutMePageConfig, DesignProjectConfig } from '@/types/portfolio'

interface PortfolioTypeOption {
  id: PortfolioType
  label: string
  emoji: string
  description: string
}

const PORTFOLIO_TYPES: PortfolioTypeOption[] = [
  { id: 'internship',   label: 'Internship',   emoji: '🎓', description: 'Modern · Clean · Approachable' },
  { id: 'academic',     label: 'Academic',     emoji: '📚', description: 'Thorough · Process-driven' },
  { id: 'thesis',       label: 'Thesis',       emoji: '🔬', description: 'Deep · Research-heavy' },
  { id: 'professional', label: 'Professional', emoji: '💼', description: 'Polished · Corporate' },
  { id: 'competition',  label: 'Competition',  emoji: '🏆', description: 'Bold · Striking' },
]

const ABOUT_SECTIONS: { key: keyof AboutMePageConfig['sections']; label: string; emoji: string; desc: string }[] = [
  { key: 'bio',          label: 'Short Bio',      emoji: '✍️',  desc: 'A paragraph about you' },
  { key: 'resume',       label: 'Resume',         emoji: '📄',  desc: 'Education + experience timeline' },
  { key: 'skills',       label: 'Skills',         emoji: '🛠️',  desc: 'Design + technical skills' },
  { key: 'software',     label: 'Software',       emoji: '💻',  desc: 'Tools (Rhino, AutoCAD...)' },
  { key: 'experience',   label: 'Experience',     emoji: '🏢',  desc: 'Detailed work history' },
  { key: 'awards',       label: 'Awards',         emoji: '🏅',  desc: 'Honors + competitions' },
  { key: 'publications', label: 'Publications',   emoji: '📰',  desc: 'Articles + press' },
  { key: 'languages',    label: 'Languages',      emoji: '🌍',  desc: 'Languages you speak' },
  { key: 'interests',    label: 'Interests',      emoji: '🎨',  desc: 'Personal interests' },
]

const TOTAL_STEPS = 7

interface Props {
  projectId: string
  onComplete: (configId: string) => void
}

export function PortfolioWizard({ projectId, onComplete }: Props) {
  const builder = usePortfolioBuilder()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Auto-calculate total pages from per-project page counts
  const calculateTotalPages = () => {
    let pages = 1 // Front cover
    if (builder.aboutPage.enabled) pages += 1
    if (builder.contentsPageEnabled) pages += 1
    // Sum each project's page count
    pages += builder.designProjects.reduce((sum, p) => sum + (p.pageCount || 2), 0)
    if (builder.endPage.enabled) pages += 1
    return pages
  }

  // Sync designProjects array when projectCount changes
  useEffect(() => {
    if (builder.designProjects.length !== builder.projectCount) {
      builder.syncDesignProjectsWithCount()
    }
  }, [builder.projectCount])

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    setError(null)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('auth_token')

      const formData = new FormData()
      formData.append('files', file)

      const res = await fetch(
        `${API_URL}/api/projects/${projectId}/assets/bulk?asset_type=render`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        }
      )

      if (res.ok) {
        const data = await res.json()
        const uploadedUrl = data.assets?.[0]?.file_url || ''
        if (uploadedUrl) {
          builder.setFrontCover({ coverImageUrl: uploadedUrl })
        }
      } else {
        setError('Could not upload cover image. Skip this step or try again.')
      }
    } catch (err: any) {
      setError(`Upload error: ${err.message}`)
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('auth_token')

      const wizardConfig = {
        name: builder.portfolioName,
        type: builder.portfolioType,
        project_count: builder.projectCount,
        total_pages: calculateTotalPages(),
        front_cover: builder.frontCover,
        design_projects: builder.designProjects,  // NEW: per-project config with assets
        about_page: builder.aboutPage,
        contents_page_enabled: builder.contentsPageEnabled,
        end_page: builder.endPage,
      }

      const res = await fetch(`${API_URL}/api/portfolios/${projectId}/wizard-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardConfig),
      })

      if (res.ok) {
        const data = await res.json()
        onComplete(data.id || projectId)
      } else {
        console.warn('Wizard config save failed, proceeding anyway')
        onComplete(projectId)
      }
    } catch (err: any) {
      console.warn('Could not save wizard config:', err.message)
      onComplete(projectId)
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return !!builder.portfolioName.trim()
    if (step === 2) return !!builder.frontCover.title.trim()
    return true
  }

  const next = () => {
    if (!canProceed()) {
      setError('Please fill in the required fields')
      return
    }
    setError(null)
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  const back = () => {
    setError(null)
    if (step > 1) setStep(step - 1)
    else router.back()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Create Portfolio</h1>
          <span className="text-sm text-stone-light">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="h-2 bg-border-light rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-stone-light">
          <StepLabel active={step >= 1} label="Basics" />
          <StepLabel active={step >= 2} label="Cover" />
          <StepLabel active={step >= 3} label="Projects" />
          <StepLabel active={step >= 4} label="About" />
          <StepLabel active={step >= 5} label="Contents" />
          <StepLabel active={step >= 6} label="End" />
          <StepLabel active={step >= 7} label="Review" />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border-light shadow-sm min-h-[400px]">
        {step === 1 && <Step1Basics builder={builder} />}
        {step === 2 && <Step2FrontCover builder={builder} onUpload={handleCoverImageUpload} uploading={uploadingCover} />}
        {step === 3 && <Step3Projects builder={builder} projectId={projectId} />}
        {step === 4 && <Step4AboutPage builder={builder} />}
        {step === 5 && <Step5ContentsPage builder={builder} />}
        {step === 6 && <Step6EndPage builder={builder} />}
        {step === 7 && <Step7Review builder={builder} totalPages={calculateTotalPages()} />}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={back}
          disabled={submitting}
          className="px-6 py-3 rounded-xl border-2 border-border-light text-stone hover:bg-bg-subtle transition font-semibold disabled:opacity-50"
        >
          ← {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < TOTAL_STEPS ? (
          <button
            onClick={next}
            disabled={!canProceed()}
            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>✨ Generate Portfolio</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// STEP 1: Basics
// ──────────────────────────────────────────────────────────────

function Step1Basics({ builder }: { builder: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-charcoal mb-1">📝 Portfolio Basics</h2>
      <p className="text-sm text-stone-light mb-6">Let's start with the basics</p>

      <Field label="Portfolio Name *" required>
        <input
          type="text"
          value={builder.portfolioName}
          onChange={(e) => builder.setPortfolioName(e.target.value)}
          placeholder="e.g. Jane Doe — Selected Works 2026"
          className="input-field"
          autoFocus
        />
      </Field>

      <Field label="Portfolio Type">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PORTFOLIO_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => builder.setPortfolioType(type.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                builder.portfolioType === type.id
                  ? 'border-primary bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-border-light hover:border-stone-light'
              }`}
            >
              <div className="text-2xl mb-1">{type.emoji}</div>
              <div className="font-bold text-charcoal text-sm">{type.label}</div>
              <div className="text-[10px] text-stone-light mt-1 uppercase tracking-wide">{type.description}</div>
            </button>
          ))}
        </div>
      </Field>

      <Field label="How many projects?">
        <NumberInput
          value={builder.projectCount}
          onChange={builder.setProjectCount}
          min={1}
          max={20}
          hint="Each project gets ~2 pages"
        />
      </Field>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// STEP 2: Front Cover
// ──────────────────────────────────────────────────────────────

function Step2FrontCover({ builder, onUpload, uploading }: { builder: any; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; uploading: boolean }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-charcoal mb-1">📕 Front Cover</h2>
      <p className="text-sm text-stone-light mb-6">The first page everyone sees</p>

      <div className="max-w-2xl">
        <Field label="Title *" required>
          <input
            type="text"
            value={builder.frontCover.title}
            onChange={(e) => builder.setFrontCover({ title: e.target.value })}
            placeholder="PORTFOLIO"
            className="input-field"
            autoFocus
          />
        </Field>

        <Field label="Subtitle">
          <input
            type="text"
            value={builder.frontCover.subtitle}
            onChange={(e) => builder.setFrontCover({ subtitle: e.target.value })}
            placeholder="Architecture · Design · 2020–2026"
            className="input-field"
          />
        </Field>

        <Field label="Tagline / Description">
          <input
            type="text"
            value={builder.frontCover.tagline}
            onChange={(e) => builder.setFrontCover({ tagline: e.target.value })}
            placeholder="Selected works & research"
            className="input-field"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Author Name">
            <input
              type="text"
              value={builder.frontCover.authorName}
              onChange={(e) => builder.setFrontCover({ authorName: e.target.value })}
              placeholder="Jane Doe"
              className="input-field"
            />
          </Field>

          <Field label="Year">
            <input
              type="text"
              value={builder.frontCover.year}
              onChange={(e) => builder.setFrontCover({ year: e.target.value })}
              placeholder="2026"
              className="input-field"
            />
          </Field>
        </div>

        <Field label="Studio / Institution (optional)">
          <input
            type="text"
            value={builder.frontCover.studio}
            onChange={(e) => builder.setFrontCover({ studio: e.target.value })}
            placeholder="e.g. School of Architecture"
            className="input-field"
          />
        </Field>

        <Field label="Cover Image (optional)">
          <div className="border-2 border-dashed border-border-light rounded-xl p-6 text-center hover:border-primary transition-colors">
            {builder.frontCover.coverImageUrl ? (
              <div className="space-y-3">
                <img
                  src={builder.frontCover.coverImageUrl}
                  alt="Cover"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => builder.setFrontCover({ coverImageUrl: '' })}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-3">🖼️</div>
                <p className="text-sm text-stone-light mb-3">PNG, JPG, or WebP</p>
                <label className="inline-block cursor-pointer px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </Field>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// STEP 3: Projects Configuration (NEW)
// ──────────────────────────────────────────────────────────────

function Step3Projects({ builder, projectId }: { builder: any; projectId: string }) {
  const [expandedIndex, setExpandedIndex] = useState<number>(0)

  return (
    <div>
      <h2 className="text-xl font-bold text-charcoal mb-1">🏗️ Configure Each Project</h2>
      <p className="text-sm text-stone-light mb-6">
        Set details and upload images for each project.
      </p>

      <div className="space-y-3">
        {builder.designProjects.map((proj: DesignProjectConfig, idx: number) => (
          <ProjectCard
            key={proj.id}
            project={proj}
            index={idx}
            builder={builder}
            projectId={projectId}
            expanded={expandedIndex === idx}
            onToggle={() => setExpandedIndex(expandedIndex === idx ? -1 : idx)}
          />
        ))}
      </div>

      {builder.designProjects.length === 0 && (
        <div className="text-center py-12 text-stone-light">
          <p>Set the project count in Step 1 first.</p>
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project, index, builder, projectId, expanded, onToggle,
}: {
  project: DesignProjectConfig
  index: number
  builder: any
  projectId: string
  expanded: boolean
  onToggle: () => void
}) {
  const totalImages = project.assets.renders.length + project.assets.plans.length + project.assets.sections.length + project.assets.elevations.length + project.assets.concepts.length + project.assets.diagrams.length

  return (
    <div className={`border-2 rounded-xl overflow-hidden transition-all ${
      expanded ? 'border-primary shadow-md' : 'border-border-light'
    }`}>
      {/* Header (clickable) */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 bg-white hover:bg-bg-subtle transition flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-blue-50 text-primary font-bold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-charcoal truncate">{project.name || `Project ${index + 1}`}</div>
          <div className="text-xs text-stone-light mt-0.5">
            {project.pageCount} pages · {totalImages} images
            {project.location && ` · ${project.location}`}
          </div>
        </div>
        <svg className={`w-5 h-5 text-stone transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="p-4 bg-bg-subtle border-t border-border-light space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Project Name *" required>
              <input
                type="text"
                value={project.name}
                onChange={(e) => builder.setDesignProject(index, { name: e.target.value })}
                placeholder="e.g. Mumbai Cultural Center"
                className="input-field"
              />
            </Field>

            <Field label="Pages for this project">
              <NumberInput
                value={project.pageCount}
                onChange={(v) => builder.setDesignProject(index, { pageCount: v })}
                min={1}
                max={10}
                hint="How many pages for this project?"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Location">
              <input
                type="text"
                value={project.location}
                onChange={(e) => builder.setDesignProject(index, { location: e.target.value })}
                placeholder="Mumbai, India"
                className="input-field"
              />
            </Field>

            <Field label="Year">
              <input
                type="text"
                value={project.year}
                onChange={(e) => builder.setDesignProject(index, { year: e.target.value })}
                placeholder="2025"
                className="input-field"
              />
            </Field>

            <Field label="Typology">
              <input
                type="text"
                value={project.typology}
                onChange={(e) => builder.setDesignProject(index, { typology: e.target.value })}
                placeholder="Cultural / Residential"
                className="input-field"
              />
            </Field>
          </div>

          <Field label="Short Description">
            <textarea
              value={project.description}
              onChange={(e) => builder.setDesignProject(index, { description: e.target.value })}
              placeholder="A brief overview — concept, intent, scale..."
              rows={3}
              className="input-field resize-none"
            />
          </Field>

          {/* Image uploads */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-3">
              📸 Upload Images
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <QuickUpload label="🎨 Renders" cat="renders" project={project} idx={index} builder={builder} projectId={projectId} />
              <QuickUpload label="📐 Plans" cat="plans" project={project} idx={index} builder={builder} projectId={projectId} />
              <QuickUpload label="📏 Sections" cat="sections" project={project} idx={index} builder={builder} projectId={projectId} />
              <QuickUpload label="🏢 Elevations" cat="elevations" project={project} idx={index} builder={builder} projectId={projectId} />
              <QuickUpload label="💡 Concepts" cat="concepts" project={project} idx={index} builder={builder} projectId={projectId} />
              <QuickUpload label="📊 Diagrams" cat="diagrams" project={project} idx={index} builder={builder} projectId={projectId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickUpload({ label, cat, project, idx, builder, projectId }: { label: string; cat: keyof DesignProjectConfig['assets']; project: DesignProjectConfig; idx: number; builder: any; projectId: string }) {
  const [uploading, setUploading] = useState(false)
  const count = project.assets[cat].length

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('files', f))

      const res = await fetch(
        `${API_URL}/api/projects/${projectId}/assets/bulk?asset_type=${cat}`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData }
      )

      if (res.ok) {
        const data = await res.json()
        ;(data.assets || []).forEach((a: any) => {
          if (a.file_url) builder.addDesignProjectAsset(idx, cat, a.file_url)
        })
      } else {
        console.error('Upload error:', res.status, res.statusText)
      }
    } catch (e) {
      console.error('Upload failed:', e)
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  return (
    <label className={`p-2 rounded border-2 text-center cursor-pointer transition ${
      uploading ? 'border-stone-light bg-stone-light/10' : 'border-dashed border-border-light hover:border-primary'
    }`}>
      <div>{label}</div>
      <div className="text-[10px] text-stone-light">({count})</div>
      <input type="file" multiple accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
    </label>
  )
}

// ──────────────────────────────────────────────────────────────
// STEP 4: About Me Page
// ──────────────────────────────────────────────────────────────

function Step4AboutPage({ builder }: { builder: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-charcoal mb-1">👤 About Me Page</h2>
      <p className="text-sm text-stone-light mb-6">A single page introducing you — pick what to include</p>

      {/* Master toggle */}
      <button
        onClick={builder.toggleAboutPage}
        className={`w-full text-left p-4 rounded-xl border-2 mb-6 transition ${
          builder.aboutPage.enabled
            ? 'border-primary bg-blue-50'
            : 'border-border-light hover:border-stone-light'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-7 rounded-full p-1 transition ${
            builder.aboutPage.enabled ? 'bg-primary' : 'bg-stone-light'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white transition ${
              builder.aboutPage.enabled ? 'translate-x-5' : ''
            }`} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-charcoal">Include About Me page</div>
            <div className="text-xs text-stone-light">A single page with selected sections below</div>
          </div>
        </div>
      </button>

      {/* Sub-sections (only enabled when About Page enabled) */}
      {builder.aboutPage.enabled && (
        <>
          <h3 className="text-sm font-bold text-stone uppercase tracking-wider mb-3">
            Sections to include
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ABOUT_SECTIONS.map((sec) => (
              <button
                key={sec.key}
                onClick={() => builder.toggleAboutSection(sec.key)}
                className={`text-left p-4 rounded-xl border-2 transition relative ${
                  builder.aboutPage.sections[sec.key]
                    ? 'border-primary bg-blue-50'
                    : 'border-border-light hover:border-stone-light'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{sec.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-charcoal text-sm">{sec.label}</div>
                    <div className="text-xs text-stone-light mt-0.5">{sec.desc}</div>
                  </div>
                  <Checkbox checked={builder.aboutPage.sections[sec.key]} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// STEP 4: Contents Page
// ──────────────────────────────────────────────────────────────

function Step5ContentsPage({ builder }: { builder: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-charcoal mb-1">📋 Contents Page</h2>
      <p className="text-sm text-stone-light mb-6">Like a table of contents — listing all sections + page numbers</p>

      <button
        onClick={() => builder.setContentsPageEnabled(!builder.contentsPageEnabled)}
        className={`w-full text-left p-6 rounded-xl border-2 transition ${
          builder.contentsPageEnabled
            ? 'border-primary bg-blue-50'
            : 'border-border-light hover:border-stone-light'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-7 rounded-full p-1 transition flex-shrink-0 ${
            builder.contentsPageEnabled ? 'bg-primary' : 'bg-stone-light'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white transition ${
              builder.contentsPageEnabled ? 'translate-x-5' : ''
            }`} />
          </div>
          <div>
            <div className="font-bold text-charcoal">Include Contents page</div>
            <div className="text-xs text-stone-light mt-1">Recommended for portfolios over 6 pages</div>
          </div>
        </div>
      </button>

      <div className="mt-6 p-4 bg-bg-subtle rounded-xl text-sm text-stone">
        <strong>💡 Preview structure:</strong>
        <pre className="text-xs mt-2 font-mono text-stone-light">
{`  Front Cover ............... 01
${builder.aboutPage.enabled ? '  About Me .................. 02\n' : ''}${builder.contentsPageEnabled ? '  Contents .................. ' + (builder.aboutPage.enabled ? '03' : '02') + '\n' : ''}  Project 1 ................. ${getProjectStartPage(builder)}
  Project 2 ................. ${getProjectStartPage(builder) + 2}
  ...
  Contact ................... LAST`}
        </pre>
      </div>
    </div>
  )
}

function getProjectStartPage(builder: any) {
  let p = 2
  if (builder.aboutPage.enabled) p++
  if (builder.contentsPageEnabled) p++
  return p
}

// ──────────────────────────────────────────────────────────────
// STEP 5: End Page (Contact)
// ──────────────────────────────────────────────────────────────

function Step6EndPage({ builder }: { builder: any }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-charcoal mb-1">📞 End Page (Contact)</h2>
      <p className="text-sm text-stone-light mb-6">The closing page — how to reach you</p>

      <button
        onClick={builder.toggleEndPage}
        className={`w-full text-left p-4 rounded-xl border-2 mb-6 transition ${
          builder.endPage.enabled
            ? 'border-primary bg-blue-50'
            : 'border-border-light'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-7 rounded-full p-1 transition ${
            builder.endPage.enabled ? 'bg-primary' : 'bg-stone-light'
          }`}>
            <div className={`w-5 h-5 rounded-full bg-white transition ${
              builder.endPage.enabled ? 'translate-x-5' : ''
            }`} />
          </div>
          <div className="font-bold text-charcoal">Include End / Contact page</div>
        </div>
      </button>

      {builder.endPage.enabled && (
        <div className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              value={builder.endPage.email}
              onChange={(e) => builder.setEndPage({ email: e.target.value })}
              placeholder="jane@example.com"
              className="input-field"
            />
          </Field>

          <Field label="Website / Portfolio URL">
            <input
              type="url"
              value={builder.endPage.website}
              onChange={(e) => builder.setEndPage({ website: e.target.value })}
              placeholder="https://janedoe.com"
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Phone">
              <input
                type="tel"
                value={builder.endPage.phone}
                onChange={(e) => builder.setEndPage({ phone: e.target.value })}
                placeholder="+1 ..."
                className="input-field"
              />
            </Field>
            <Field label="Instagram">
              <input
                type="text"
                value={builder.endPage.instagram}
                onChange={(e) => builder.setEndPage({ instagram: e.target.value })}
                placeholder="@yourhandle"
                className="input-field"
              />
            </Field>
            <Field label="LinkedIn">
              <input
                type="text"
                value={builder.endPage.linkedin}
                onChange={(e) => builder.setEndPage({ linkedin: e.target.value })}
                placeholder="linkedin.com/in/..."
                className="input-field"
              />
            </Field>
          </div>

          <button
            onClick={() => builder.setEndPage({ includeQrCode: !builder.endPage.includeQrCode })}
            className={`w-full text-left p-3 rounded-xl border-2 transition ${
              builder.endPage.includeQrCode ? 'border-primary bg-blue-50' : 'border-border-light'
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox checked={builder.endPage.includeQrCode} />
              <div>
                <div className="font-semibold text-sm text-charcoal">Include QR code linking to my website</div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// STEP 6: Review
// ──────────────────────────────────────────────────────────────

function Step7Review({ builder, totalPages }: { builder: any; totalPages: number }) {
  const enabledSections = Object.entries(builder.aboutPage.sections).filter(([_, v]) => v).map(([k]) => k)
  return (
    <div>
      <h2 className="text-xl font-bold text-charcoal mb-1">✨ Review</h2>
      <p className="text-sm text-stone-light mb-6">Everything look good?</p>

      <div className="space-y-4">
        <ReviewRow icon="📝" label="Portfolio">
          <strong>{builder.portfolioName}</strong>
          <div className="text-stone-light text-xs">{PORTFOLIO_TYPES.find(t => t.id === builder.portfolioType)?.label} · ~{totalPages} pages · {builder.projectCount} projects</div>
        </ReviewRow>

        <ReviewRow icon="📕" label="Front Cover">
          <strong>{builder.frontCover.title || '(no title)'}</strong>
          <div className="text-stone-light text-xs">
            {[builder.frontCover.subtitle, builder.frontCover.authorName, builder.frontCover.year].filter(Boolean).join(' · ')}
            {builder.frontCover.coverImageUrl && ' · 🖼️ Has cover image'}
          </div>
        </ReviewRow>

        {builder.aboutPage.enabled && (
          <ReviewRow icon="👤" label="About Me page">
            <div className="text-xs text-stone-light">
              {enabledSections.length > 0
                ? enabledSections.join(' · ')
                : '(no sections selected)'}
            </div>
          </ReviewRow>
        )}

        {builder.contentsPageEnabled && (
          <ReviewRow icon="📋" label="Contents page">
            <div className="text-xs text-stone-light">Auto-generated</div>
          </ReviewRow>
        )}

        <ReviewRow icon="🏗️" label="Project pages">
          <div className="text-xs text-stone-light space-y-1">
            {builder.designProjects.map((p: DesignProjectConfig, i: number) => {
              const imgs = p.assets.renders.length + p.assets.plans.length + p.assets.sections.length + p.assets.elevations.length + p.assets.concepts.length + p.assets.diagrams.length
              return (
                <div key={p.id}>
                  • {p.name || `Project ${i + 1}`} — {p.pageCount} pages, {imgs} images
                </div>
              )
            })}
          </div>
        </ReviewRow>

        {builder.endPage.enabled && (
          <ReviewRow icon="📞" label="End / Contact page">
            <div className="text-xs text-stone-light">
              {[builder.endPage.email, builder.endPage.website, builder.endPage.phone].filter(Boolean).join(' · ') || '(no contact info)'}
            </div>
          </ReviewRow>
        )}
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-sm text-green-800">
          🎉 Click <strong>Generate Portfolio</strong> to start designing. We'll create your DNA-based portfolio with the AI engine.
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function StepLabel({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`flex-1 text-center ${active ? 'text-primary font-semibold' : 'text-stone-light'}`}>
      {label}
    </span>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-charcoal mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${
      checked ? 'bg-primary border-primary' : 'border-border-light'
    }`}>
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

function NumberInput({ value, onChange, min, max, hint }: { value: number; onChange: (v: number) => void; min: number; max: number; hint?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-lg border-2 border-border-light hover:border-primary transition flex items-center justify-center font-bold"
        >−</button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
          min={min}
          max={max}
          className="flex-1 px-4 py-2 border-2 border-border-light rounded-lg text-center font-bold text-lg focus:border-primary focus:outline-none"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-lg border-2 border-border-light hover:border-primary transition flex items-center justify-center font-bold"
        >+</button>
      </div>
      {hint && <p className="text-xs text-stone-light mt-1">{hint}</p>}
    </div>
  )
}

function ReviewRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-bg-subtle rounded-lg">
      <div className="text-xl flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-stone uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-sm text-charcoal">{children}</div>
      </div>
    </div>
  )
}
