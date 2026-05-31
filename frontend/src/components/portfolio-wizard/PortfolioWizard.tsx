'use client'

/**
 * Portfolio Creation Wizard (Batch 1)
 *
 * Captures everything from the spec:
 * - Portfolio Name
 * - Portfolio Type (Internship / Academic / Thesis / Professional / Competition)
 * - Total Pages
 * - Project Count
 * - Optional pages (Resume / About / Contents / Skills / Software / Experience / Contact / Awards / Publications)
 *
 * On submit: saves config to BuilderState + DB → ready for Batch 2 (DNA system)
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePortfolioBuilder } from '@/store/portfolioBuilder'
import { PortfolioType, PortfolioPagesConfig } from '@/types/portfolio'

interface PortfolioTypeOption {
  id: PortfolioType
  label: string
  emoji: string
  description: string
  vibe: string
}

const PORTFOLIO_TYPES: PortfolioTypeOption[] = [
  {
    id: 'internship',
    label: 'Internship',
    emoji: '🎓',
    description: 'Apply for internships at firms',
    vibe: 'Modern · Clean · Approachable',
  },
  {
    id: 'academic',
    label: 'Academic',
    emoji: '📚',
    description: 'Submit for school reviews & juries',
    vibe: 'Thorough · Process-driven · Detailed',
  },
  {
    id: 'thesis',
    label: 'Thesis',
    emoji: '🔬',
    description: 'Defend your thesis project',
    vibe: 'Deep · Research-heavy · Analytical',
  },
  {
    id: 'professional',
    label: 'Professional',
    emoji: '💼',
    description: 'Apply for senior architecture roles',
    vibe: 'Polished · Corporate · Confident',
  },
  {
    id: 'competition',
    label: 'Competition',
    emoji: '🏆',
    description: 'Submit to design competitions',
    vibe: 'Bold · Striking · Statement-making',
  },
]

const PAGE_OPTIONS: { key: keyof PortfolioPagesConfig; label: string; emoji: string; desc: string }[] = [
  { key: 'about', label: 'About Me', emoji: '👤', desc: 'Bio, vision, design philosophy' },
  { key: 'resume', label: 'Resume', emoji: '📄', desc: 'Education + work experience timeline' },
  { key: 'contents', label: 'Contents Page', emoji: '📋', desc: 'Index of all sections' },
  { key: 'skills', label: 'Skills', emoji: '🛠️', desc: 'Design + technical skills' },
  { key: 'software', label: 'Software', emoji: '💻', desc: 'Tools you know (Rhino, AutoCAD, etc.)' },
  { key: 'experience', label: 'Experience', emoji: '🏢', desc: 'Detailed work history' },
  { key: 'awards', label: 'Awards', emoji: '🏅', desc: 'Competitions, honors, recognitions' },
  { key: 'publications', label: 'Publications', emoji: '📰', desc: 'Articles, papers, press coverage' },
  { key: 'contact', label: 'Contact Page', emoji: '📧', desc: 'How to reach you' },
]

interface Props {
  projectId: string
  onComplete: (configId: string) => void
}

export function PortfolioWizard({ projectId, onComplete }: Props) {
  const builder = usePortfolioBuilder()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (!builder.portfolioName.trim()) {
      setError('Please give your portfolio a name')
      return
    }
    if (builder.totalPages < 4 || builder.totalPages > 100) {
      setError('Total pages must be between 4 and 100')
      return
    }
    if (builder.projectCount < 1 || builder.projectCount > 20) {
      setError('Project count must be between 1 and 20')
      return
    }

    setSubmitting(true)

    try {
      // Save wizard config to backend (Batch 2 DNA system will consume this)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('auth_token')

      const wizardConfig = {
        name: builder.portfolioName,
        type: builder.portfolioType,
        total_pages: builder.totalPages,
        project_count: builder.projectCount,
        pages: builder.pages,
      }

      // Try to save to portfolio_configs table (Phase 2b API)
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
        // Even if backend save fails, proceed to next step with local state
        // (Backend wizard-config endpoint will be added in Batch 2)
        console.warn('Wizard config save not available yet (Batch 2):', res.status)
        onComplete(projectId)
      }
    } catch (err: any) {
      console.warn('Could not save wizard config:', err.message)
      // Don't block the user - proceed with local state
      onComplete(projectId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-2">Create Your Portfolio</h1>
        <p className="text-stone-light">Tell us what you want to build — we'll handle the rest</p>
      </div>

      {/* Section 1: Portfolio Name */}
      <Section number={1} title="Portfolio Name" description="What's this portfolio called?">
        <input
          type="text"
          value={builder.portfolioName}
          onChange={(e) => builder.setPortfolioName(e.target.value)}
          placeholder="e.g. Jane Doe — Selected Works 2026"
          className="w-full px-4 py-3 border-2 border-border-light rounded-xl text-lg focus:border-primary focus:outline-none transition"
          autoFocus
        />
      </Section>

      {/* Section 2: Portfolio Type */}
      <Section number={2} title="Portfolio Type" description="Pick what fits your goal">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PORTFOLIO_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => builder.setPortfolioType(type.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                builder.portfolioType === type.id
                  ? 'border-primary bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-border-light hover:border-stone-light hover:shadow-sm'
              }`}
            >
              <div className="text-3xl mb-2">{type.emoji}</div>
              <h3 className="font-bold text-charcoal mb-1">{type.label}</h3>
              <p className="text-xs text-stone-light mb-2">{type.description}</p>
              <p className="text-[10px] text-primary uppercase tracking-wide font-semibold">{type.vibe}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Section 3: Pages & Projects */}
      <Section number={3} title="Size" description="How big is your portfolio?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Total Pages"
            value={builder.totalPages}
            onChange={builder.setTotalPages}
            min={4}
            max={100}
            hint="Including all sections"
          />
          <NumberInput
            label="Projects to Include"
            value={builder.projectCount}
            onChange={builder.setProjectCount}
            min={1}
            max={20}
            hint="How many design projects?"
          />
        </div>
      </Section>

      {/* Section 4: Optional Pages */}
      <Section number={4} title="Sections to Include" description="Toggle on what you want">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PAGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => builder.togglePage(opt.key)}
              className={`text-left p-4 rounded-xl border-2 transition-all relative ${
                builder.pages[opt.key]
                  ? 'border-primary bg-blue-50'
                  : 'border-border-light hover:border-stone-light bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{opt.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-charcoal text-sm">{opt.label}</div>
                  <div className="text-xs text-stone-light mt-0.5">{opt.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${
                  builder.pages[opt.key]
                    ? 'bg-primary border-primary'
                    : 'border-border-light'
                }`}>
                  {builder.pages[opt.key] && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 sticky bottom-4 bg-white p-4 -mx-4 sm:mx-0 rounded-xl shadow-elevation-2 border border-border-light">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border-2 border-border-light text-stone hover:bg-bg-subtle transition font-semibold"
          disabled={submitting}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !builder.portfolioName.trim()}
          className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              ✨ Generate Portfolio
            </>
          )}
        </button>
      </div>

      {/* Summary helper */}
      <div className="mt-6 text-center text-xs text-stone-light">
        {countEnabledPages(builder.pages)} sections + {builder.projectCount} projects = ~{builder.totalPages} pages
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function countEnabledPages(pages: PortfolioPagesConfig): number {
  return Object.values(pages).filter(Boolean).length
}

function Section({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 bg-white p-6 sm:p-8 rounded-2xl border border-border-light shadow-sm">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-xs font-semibold text-primary bg-blue-50 px-2 py-1 rounded">Step {number}</span>
        <h2 className="text-xl font-bold text-charcoal">{title}</h2>
      </div>
      <p className="text-sm text-stone-light mb-5">{description}</p>
      {children}
    </section>
  )
}

function NumberInput({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-charcoal mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-lg border-2 border-border-light hover:border-primary transition flex items-center justify-center font-bold text-stone"
          aria-label="Decrease"
        >
          −
        </button>
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
          className="w-10 h-10 rounded-lg border-2 border-border-light hover:border-primary transition flex items-center justify-center font-bold text-stone"
          aria-label="Increase"
        >
          +
        </button>
      </div>
      {hint && <p className="text-xs text-stone-light mt-1">{hint}</p>}
    </div>
  )
}
