'use client'

import { useState, useEffect } from 'react'
import { getSpec, pickCoverSpec, pickProjectSpecForTemplate } from '@/components/composer/layoutSpecs'
import { paletteFrom, DEMO_PROJECTS, ABOUT_DEMO } from './demoArt'
import { DemoPage } from './DemoPage'

interface Template {
  name: string
  colors?: Record<string, string>
  fonts?: Record<string, string>
  layouts?: any
  placeholders?: any
}

interface TemplateBookPreviewProps {
  template: Template
}

export default function TemplateBookPreview({ template }: TemplateBookPreviewProps) {
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const p = paletteFrom(template.colors)
  const fonts = {
    heading: template.fonts?.heading || 'Georgia, serif',
    body: template.fonts?.body || 'Inter, sans-serif'
  }

  // Define Layout Specs
  const coverSpec = getSpec(pickCoverSpec(template))
  const contentsSpec = getSpec('index.numberedList')
  const aboutSpec = getSpec('about.portraitLeft')
  const cvSpec = getSpec('about.cardStack')
  const projectCoverSpec = getSpec(pickProjectSpecForTemplate(template))
  const projectDetails1Spec = getSpec('duoH.titleTopText')
  const projectDetails2Spec = getSpec('heroSideRight.titleLegendSide')
  const contactSpec = getSpec('contact.center')

  const proj1 = DEMO_PROJECTS[0]
  const proj2 = DEMO_PROJECTS[1]
  const proj3 = DEMO_PROJECTS[2]

  // Spreads Configuration
  const spreads = [
    {
      id: 'cover',
      label: 'Cover',
      left: null,
      right: {
        spec: coverSpec,
        content: {
          title: template.name || proj1.name,
          subtitle: 'Architecture Portfolio · 2026',
          project: proj1,
          seed: 11
        }
      }
    },
    {
      id: 'about',
      label: 'ToC & About',
      left: {
        spec: contentsSpec,
        content: {
          title: 'Selected Works',
          subtitle: 'Table of Contents',
          legendItems: ['01. Concept & Theory', '02. Technical Drawings', '03. Visual Research'],
          seed: 2
        }
      },
      right: {
        spec: aboutSpec,
        content: {
          title: ABOUT_DEMO.name,
          subtitle: ABOUT_DEMO.role,
          body: ABOUT_DEMO.about,
          seed: 5
        }
      }
    },
    {
      id: 'cv-project',
      label: 'CV & Work',
      left: {
        spec: cvSpec,
        content: {
          title: 'Curriculum Vitae',
          subtitle: 'Education & Experience',
          body: '2022-26  B.Arch Graduate, CEPT University.\n2025  Architectural Intern, Atelier San.\nExpertise in drafting, physical modeling, and diagramming.',
          seed: 15
        }
      },
      right: {
        spec: projectCoverSpec,
        content: {
          title: proj1.name,
          subtitle: `${proj1.typology} · ${proj1.year}`,
          body: proj1.blurb,
          project: proj1,
          seed: 23
        }
      }
    },
    {
      id: 'drawings',
      label: 'Drawings',
      left: {
        spec: projectDetails1Spec,
        content: {
          title: proj2.name,
          subtitle: `${proj2.typology} · ${proj2.year}`,
          body: proj2.blurb,
          project: proj2,
          seed: 42
        }
      },
      right: {
        spec: projectCoverSpec,
        content: {
          title: proj3.name,
          subtitle: `${proj3.typology} · ${proj3.year}`,
          body: proj3.blurb,
          project: proj3,
          seed: 88
        }
      }
    },
    {
      id: 'contact',
      label: 'Contact',
      left: {
        spec: projectDetails2Spec,
        content: {
          title: 'Selected Details',
          subtitle: 'Technical & Axonometric',
          project: proj3,
          seed: 99
        }
      },
      right: {
        spec: contactSpec,
        content: {
          title: 'Thank You',
          subtitle: 'Contact & Collaboration',
          body: 'Email: hello@cosmofolio.design\nPhone: +91 98765 43210\nWeb: cosmofolio.design/profile',
          seed: 123
        }
      }
    }
  ]

  const totalSpreads = spreads.length

  const flipTo = (target: number) => {
    if (isFlipping || target < 0 || target >= totalSpreads) return
    setDirection(target > spreadIndex ? 'next' : 'prev')
    setIsFlipping(true)
    setTimeout(() => {
      setSpreadIndex(target)
      setTimeout(() => setIsFlipping(false), 50)
    }, 250)
  }

  const handleNext = () => flipTo(spreadIndex + 1)
  const handlePrev = () => flipTo(spreadIndex - 1)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [spreadIndex, isFlipping])

  const currentSpread = spreads[spreadIndex]
  const isFirst = spreadIndex === 0

  return (
    <div className="flex flex-col h-[520px] bg-slate-950 dark:bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner text-white select-none">
      {/* Top indicator bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-xs">
        <span className="font-semibold text-slate-400">📖 Spreads View</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-355">
          Spread {spreadIndex + 1} of {totalSpreads}
        </span>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden bg-slate-950">
        {/* Navigation Buttons */}
        {spreadIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center transition focus:outline-none"
          >
            ‹
          </button>
        )}
        {spreadIndex < totalSpreads - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center transition focus:outline-none"
          >
            ›
          </button>
        )}

        {/* Book Spreads Container */}
        <div
          className={`transition-all duration-300 transform ${
            isFlipping ? (direction === 'next' ? 'scale-[0.98] opacity-90' : 'scale-[0.98] opacity-90') : 'scale-100 opacity-100'
          }`}
          style={{
            display: 'flex',
            width: isFirst ? '270px' : '540px',
            height: '380px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.65)',
            borderRadius: '4px',
            background: p.bg,
            position: 'relative',
          }}
        >
          {/* Spine gradient shadow for open spreads */}
          {!isFirst && (
            <div
              className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 pointer-events-none z-20"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.22) 50%, transparent)',
              }}
            />
          )}

          {/* Left Page (hidden on Cover) */}
          {!isFirst && currentSpread.left && (
            <div
              style={{ width: '50%', height: '100%', borderRight: '1px solid rgba(0,0,0,0.08)' }}
              className="overflow-hidden relative"
            >
              <DemoPage
                spec={currentSpread.left.spec}
                p={p}
                fonts={fonts}
                content={currentSpread.left.content as any}
              />
            </div>
          )}

          {/* Right Page */}
          {currentSpread.right && (
            <div
              style={{ width: isFirst ? '100%' : '50%', height: '100%' }}
              className="overflow-hidden relative"
            >
              <DemoPage
                spec={currentSpread.right.spec}
                p={p}
                fonts={fonts}
                content={currentSpread.right.content as any}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex justify-center p-2 border-t border-slate-800/80 bg-slate-950/40 gap-1.5 flex-wrap">
        {spreads.map((spread, idx) => (
          <button
            key={spread.id}
            onClick={() => flipTo(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus:outline-none ${
              spreadIndex === idx
                ? 'bg-blue-600/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {spread.label}
          </button>
        ))}
      </div>
    </div>
  )
}
