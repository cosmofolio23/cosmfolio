'use client'

/**
 * CV Generator — a CV that matches the portfolio's visual language.
 * Single HTML source renders the live preview, the print/PDF window, the
 * Word (.doc) export and an ATS-clean text version.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { libraryApi } from '@/lib/libraryApi'
import { downloadBlob } from '@/lib/saveToLibrary'

// Themes mirror the portfolio design packs so CV + portfolio feel like one package
const THEMES = [
  { id: 'gold', name: 'CosmoFolio Gold', accent: '#9C7416', headerBg: '#191919', headerText: '#FBE7A1', font: "'Inter', sans-serif" },
  { id: 'minimal', name: 'Minimal White', accent: '#222222', headerBg: '#ffffff', headerText: '#111111', font: "'Inter', sans-serif" },
  { id: 'editorial', name: 'Dark Editorial', accent: '#C84B31', headerBg: '#1D1D1F', headerText: '#ffffff', font: "'Georgia', serif" },
  { id: 'sage', name: 'Sage Studio', accent: '#5F7161', headerBg: '#EEF0EB', headerText: '#2F3B2F', font: "'Inter', sans-serif" },
  { id: 'blue', name: 'Blueprint', accent: '#2F4B7C', headerBg: '#EDF2F9', headerText: '#1C2F4F', font: "'Inter', sans-serif" },
  { id: 'warm', name: 'Warm Beige', accent: '#A0732C', headerBg: '#F6F1E6', headerText: '#4A3A1E', font: "'Georgia', serif" },
]

const LAYOUTS = [
  { id: 'single', name: 'Single column' },
  { id: 'two', name: 'Two column' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'graphic', name: 'Graphic' },
]

const SOFTWARE_PRESETS = ['AutoCAD', 'Revit', 'SketchUp', 'Rhino', 'Lumion', 'Enscape', 'Photoshop', 'Illustrator', 'InDesign', 'Blender', '3ds Max']

interface Edu { degree: string; college: string; year: string; score: string }
interface Skill { name: string; level: number }
interface Proj { name: string; type: string; year: string; desc: string }
interface Row { title: string; detail: string }

interface CvData {
  name: string; phone: string; email: string; linkedin: string; portfolio: string; location: string
  profile: string
  education: Edu[]
  software: Skill[]
  designSkills: string
  languages: string
  softSkills: string
  projects: Proj[]
  experience: Row[]
  achievements: Row[]
  extracurricular: Row[]
}

const DEFAULT_DATA: CvData = {
  name: '', phone: '', email: '', linkedin: '', portfolio: '', location: '',
  profile: '',
  education: [{ degree: 'B.Arch', college: '', year: '', score: '' }],
  software: [{ name: 'AutoCAD', level: 4 }, { name: 'SketchUp', level: 4 }, { name: 'Photoshop', level: 3 }],
  designSkills: 'Conceptual design, Technical drawing, Site analysis',
  languages: 'English, Hindi',
  softSkills: 'Team collaboration, Presentation',
  projects: [],
  experience: [],
  achievements: [],
  extracurricular: [],
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function buildCvHtml(d: CvData, theme: typeof THEMES[number], layout: string, viz: 'dots' | 'bars'): string {
  const a = theme.accent
  const sec = (title: string, inner: string) => inner
    ? `<div style="margin-top:14px"><div style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:${a};text-transform:uppercase;border-bottom:1.5px solid ${a}33;padding-bottom:3px;margin-bottom:7px">${title}</div>${inner}</div>`
    : ''
  const dots = (lvl: number) => viz === 'dots'
    ? `<span style="color:${a};letter-spacing:2px">${'●'.repeat(lvl)}${'○'.repeat(5 - lvl)}</span>`
    : `<span style="display:inline-block;width:90px;height:6px;background:${a}22;border-radius:3px;vertical-align:middle"><span style="display:block;width:${lvl * 20}%;height:6px;background:${a};border-radius:3px"></span></span>`

  const contact = [d.location, d.phone, d.email, d.linkedin, d.portfolio].filter(Boolean)
    .map(x => esc(x)).join('&nbsp;&nbsp;·&nbsp;&nbsp;')

  const softwareHtml = d.software.filter(s => s.name).map(s =>
    `<tr><td style="padding:2px 14px 2px 0;font-size:12px">${esc(s.name)}</td><td style="font-size:11px">${dots(s.level)}</td></tr>`).join('')

  const eduHtml = d.education.filter(e => e.degree || e.college).map(e =>
    `<div style="margin-bottom:6px"><b style="font-size:12.5px">${esc(e.degree)}</b> — <span style="font-size:12px">${esc(e.college)}</span><div style="font-size:11px;color:#666">${esc([e.year, e.score && `Score: ${e.score}`].filter(Boolean).join(' · '))}</div></div>`).join('')

  const projHtml = d.projects.filter(p => p.name).map(p =>
    `<div style="margin-bottom:7px"><b style="font-size:12.5px">${esc(p.name)}</b> <span style="font-size:11px;color:${a}">${esc([p.type, p.year].filter(Boolean).join(' · '))}</span>${p.desc ? `<div style="font-size:11.5px;color:#444;margin-top:1px">${esc(p.desc)}</div>` : ''}</div>`).join('')

  const rows = (list: Row[]) => list.filter(r => r.title).map(r =>
    `<div style="margin-bottom:5px"><b style="font-size:12px">${esc(r.title)}</b>${r.detail ? `<div style="font-size:11.5px;color:#444">${esc(r.detail)}</div>` : ''}</div>`).join('')

  const skillsBlock = sec('Software', softwareHtml ? `<table style="border-collapse:collapse">${softwareHtml}</table>` : '') +
    sec('Design skills', d.designSkills ? `<div style="font-size:12px;color:#333">${esc(d.designSkills)}</div>` : '') +
    sec('Languages', d.languages ? `<div style="font-size:12px;color:#333">${esc(d.languages)}</div>` : '') +
    sec('Soft skills', d.softSkills ? `<div style="font-size:12px;color:#333">${esc(d.softSkills)}</div>` : '')

  const mainBlock = sec('Profile', d.profile ? `<div style="font-size:12px;line-height:1.55;color:#333">${esc(d.profile)}</div>` : '') +
    sec('Education', eduHtml) +
    sec('Projects', projHtml) +
    sec('Experience', rows(d.experience)) +
    sec('Achievements', rows(d.achievements)) +
    sec('Extra-curricular', rows(d.extracurricular))

  const isMinimal = layout === 'minimal'
  const headerBg = isMinimal ? '#ffffff' : theme.headerBg
  const headerText = isMinimal ? '#111111' : theme.headerText
  const headerPad = layout === 'graphic' ? '34px 36px' : isMinimal ? '34px 36px 8px' : '26px 36px'
  const accentBar = layout === 'graphic' ? `<div style="height:7px;background:${a}"></div>` : ''

  const header = `${accentBar}<div style="background:${headerBg};color:${headerText};padding:${headerPad}">
    <div style="font-size:${isMinimal ? 30 : 26}px;font-weight:800;letter-spacing:${isMinimal ? '0.02em' : '0.04em'}">${esc(d.name || 'Your Name')}</div>
    <div style="font-size:11px;margin-top:5px;opacity:0.85">${contact || 'your contact details'}</div>
  </div>`

  let body = ''
  if (layout === 'two' || layout === 'graphic') {
    body = `<table style="width:100%;border-collapse:collapse"><tr>
      <td style="width:34%;vertical-align:top;padding:6px 22px 28px 36px;border-right:1px solid #eee">${skillsBlock}</td>
      <td style="vertical-align:top;padding:6px 36px 28px 24px">${mainBlock}</td>
    </tr></table>`
  } else {
    body = `<div style="padding:4px 36px 30px">${mainBlock}${skillsBlock}</div>`
  }

  return `<div style="font-family:${theme.font};color:#1a1a1a;background:#ffffff;width:100%;min-height:100%">${header}${body}</div>`
}

function buildAtsText(d: CvData): string {
  const L: string[] = []
  L.push(d.name.toUpperCase(), [d.location, d.phone, d.email, d.linkedin, d.portfolio].filter(Boolean).join(' | '), '')
  if (d.profile) L.push('PROFILE', d.profile, '')
  const edu = d.education.filter(e => e.degree || e.college)
  if (edu.length) { L.push('EDUCATION'); edu.forEach(e => L.push(`${e.degree} - ${e.college} (${[e.year, e.score].filter(Boolean).join(', ')})`)); L.push('') }
  const sw = d.software.filter(s => s.name)
  if (sw.length) L.push('SOFTWARE SKILLS', sw.map(s => `${s.name} (${s.level}/5)`).join(', '), '')
  if (d.designSkills) L.push('DESIGN SKILLS', d.designSkills, '')
  const pj = d.projects.filter(p => p.name)
  if (pj.length) { L.push('PROJECTS'); pj.forEach(p => L.push(`${p.name} - ${[p.type, p.year].filter(Boolean).join(', ')}${p.desc ? `: ${p.desc}` : ''}`)); L.push('') }
  const sect = (t: string, list: Row[]) => { const x = list.filter(r => r.title); if (x.length) { L.push(t); x.forEach(r => L.push(`${r.title}${r.detail ? ` - ${r.detail}` : ''}`)); L.push('') } }
  sect('EXPERIENCE', d.experience); sect('ACHIEVEMENTS', d.achievements); sect('EXTRA-CURRICULAR', d.extracurricular)
  if (d.languages) L.push('LANGUAGES', d.languages, '')
  if (d.softSkills) L.push('SOFT SKILLS', d.softSkills)
  return L.join('\n')
}

export default function CvGeneratorPage() {
  const [data, setData] = useState<CvData>(DEFAULT_DATA)
  const [themeId, setThemeId] = useState('gold')
  const [layout, setLayout] = useState('two')
  const [viz, setViz] = useState<'dots' | 'bars'>('dots')
  const [notice, setNotice] = useState('')

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 4000) }

  // draft persistence (local only — never sent to analytics)
  useEffect(() => {
    try { const raw = localStorage.getItem('cosmofolio_cv_draft'); if (raw) setData({ ...DEFAULT_DATA, ...JSON.parse(raw) }) } catch {}
  }, [])
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem('cosmofolio_cv_draft', JSON.stringify(data)) } catch {} }, 800)
    return () => clearTimeout(t)
  }, [data])

  const html = useMemo(() => buildCvHtml(data, theme, layout, viz), [data, theme, layout, viz])

  const set = (patch: Partial<CvData>) => setData(d => ({ ...d, ...patch }))

  // ---------------- smart drafts (local, deterministic) ----------------
  const writeProfile = () => {
    const deg = data.education[0]?.degree || 'B.Arch'
    const college = data.education[0]?.college
    const nProj = data.projects.filter(p => p.name).length
    const types = Array.from(new Set(data.projects.map(p => p.type).filter(Boolean))).slice(0, 3)
    const sw = data.software.filter(s => s.level >= 4).map(s => s.name).slice(0, 3)
    const parts = [
      `${deg} student${college ? ` at ${college}` : ''} with a portfolio of ${nProj || 'several'} academic projects${types.length ? ` spanning ${types.join(', ').toLowerCase()}` : ''}.`,
      sw.length ? `Strong in ${sw.join(', ')} with an emphasis on clear architectural storytelling.` : 'Focused on clear architectural storytelling from concept to presentation.',
      'Seeking an internship to contribute design thinking and rigorous documentation to live projects.',
    ]
    set({ profile: parts.join(' ') })
    flash('Profile draft written — edit it to make it yours.')
  }
  const shorten = () => {
    const first = data.profile.split(/(?<=\.)\s+/).slice(0, 1).join(' ')
    set({ profile: first })
  }
  const expand = () => {
    if (!data.profile) { writeProfile(); return }
    set({ profile: `${data.profile} Comfortable working across scales — from detail drawings to urban strategy — and presenting to juries and clients.` })
  }
  const suggestSkills = () => {
    const have = new Set(data.software.map(s => s.name))
    const add = SOFTWARE_PRESETS.filter(s => !have.has(s)).slice(0, 3).map(name => ({ name, level: 3 }))
    set({ software: [...data.software, ...add] })
    flash(`Added ${add.length} suggested tools — set your real proficiency.`)
  }

  const importProjects = async () => {
    try {
      const { items } = await libraryApi.listProjects()
      const real = items.filter(p => !['Studio Tools', 'Processed Drawings'].includes(p.name))
      if (!real.length) { flash('No Library projects found.'); return }
      const mapped = real.slice(0, 6).map(p => ({ name: p.name, type: p.typology || 'Academic project', year: p.year ? String(p.year) : '', desc: p.studio_brief || '' }))
      set({ projects: [...data.projects, ...mapped] })
      flash(`Imported ${mapped.length} projects from your Library.`)
    } catch { flash('Library unavailable — add projects manually.') }
  }

  // ---------------- exports ----------------
  const fileBase = () => {
    const n = (data.name || 'Student').trim().split(/\s+/)
    return `${n[0] || 'First'}_${n.slice(1).join('_') || 'Last'}_CV_${new Date().getFullYear()}`
  }

  const exportPdf = () => {
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (!w) { flash('Pop-up blocked — allow pop-ups to export PDF.'); return }
    w.document.write(`<!doctype html><html><head><title>${fileBase()}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>@page{size:A4;margin:0}body{margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
      </head><body>${html}<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`)
    w.document.close()
    flash('Print dialog opened — choose “Save as PDF”.')
  }

  const exportDoc = () => {
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${html}</body></html>`
    downloadBlob(new Blob(['﻿', doc], { type: 'application/msword' }), `${fileBase()}.doc`)
  }

  const exportTxt = () => downloadBlob(new Blob([buildAtsText(data)], { type: 'text/plain' }), `${fileBase()}_ATS.txt`)

  // ---------------- list editors ----------------
  const listEditor = <T,>(list: T[], setList: (l: T[]) => void, blank: T, render: (item: T, set: (p: Partial<T>) => void, remove: () => void) => React.ReactNode) => (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i}>{render(item, p => setList(list.map((x, xi) => xi === i ? { ...x, ...p } : x)), () => setList(list.filter((_, xi) => xi !== i)))}</div>
      ))}
      <button onClick={() => setList([...list, blank])} className="text-xs text-[#9C7416] hover:underline">＋ Add</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      <header className="glass-nav shadow-elevation-1 sticky top-0 z-40">
        <div className="container-centered py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-stone-light hover:text-slate text-sm">← Dashboard</Link>
          <span className="text-gray-200">|</span>
          <Logo size="sm" variant="gold" />
          <span className="font-semibold text-charcoal">CV Generator</span>
        </div>
      </header>

      <main className="container-centered py-6">
        {notice && <div className="mb-4 border border-[#D4AF37]/40 bg-[#FBE7A1]/30 text-[#9C7416] rounded-lg px-4 py-2.5 text-sm">{notice}</div>}

        <div className="grid lg:grid-cols-[420px_1fr] gap-6">
          {/* form */}
          <div className="space-y-3 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto pr-1">
            <Card title="Style — matches your portfolio">
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setThemeId(t.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${themeId === t.id ? 'border-[#D4AF37] bg-[#FBE7A1]/20' : 'border-gray-200'}`}>
                    <span className="w-4 h-4 rounded-full border" style={{ background: t.accent }} />{t.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {LAYOUTS.map(l => (
                  <button key={l.id} onClick={() => setLayout(l.id)} className={`px-2.5 py-1.5 rounded-lg text-xs ${layout === l.id ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}>{l.name}</button>
                ))}
                <span className="flex-1" />
                {(['dots', 'bars'] as const).map(v => (
                  <button key={v} onClick={() => setViz(v)} className={`px-2.5 py-1.5 rounded-lg text-xs capitalize ${viz === v ? 'bg-[#9C7416] text-white' : 'bg-gray-100 text-gray-600'}`}>{v}</button>
                ))}
              </div>
            </Card>

            <Card title="Personal info">
              <div className="grid grid-cols-2 gap-2">
                {([['name', 'Full name'], ['phone', 'Phone'], ['email', 'Email'], ['linkedin', 'LinkedIn'], ['portfolio', 'Portfolio link'], ['location', 'Location']] as const).map(([k, ph]) => (
                  <input key={k} value={(data as any)[k]} onChange={e => set({ [k]: e.target.value } as any)} placeholder={ph}
                    className={`border rounded-lg px-2.5 py-2 text-xs ${k === 'name' ? 'col-span-2' : ''}`} />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Stored only in your browser — never sent to analytics.</p>
            </Card>

            <Card title="Profile">
              <textarea value={data.profile} onChange={e => set({ profile: e.target.value })} rows={3}
                placeholder="2–3 sentences about you…" className="w-full border rounded-lg px-2.5 py-2 text-xs resize-none" />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <button onClick={writeProfile} className="px-2.5 py-1.5 rounded-lg bg-[#FBE7A1]/40 text-[#9C7416] text-xs font-medium">✨ Write my profile</button>
                <button onClick={shorten} className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs">Shorter</button>
                <button onClick={expand} className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs">More detail</button>
              </div>
            </Card>

            <Card title="Education">
              {listEditor(data.education, l => set({ education: l }), { degree: '', college: '', year: '', score: '' },
                (e, s, rm) => (
                  <div className="grid grid-cols-[1fr_1fr_64px_64px_20px] gap-1.5">
                    <input value={e.degree} onChange={ev => s({ degree: ev.target.value })} placeholder="Degree" className="border rounded px-2 py-1.5 text-xs" />
                    <input value={e.college} onChange={ev => s({ college: ev.target.value })} placeholder="College" className="border rounded px-2 py-1.5 text-xs" />
                    <input value={e.year} onChange={ev => s({ year: ev.target.value })} placeholder="Year" className="border rounded px-2 py-1.5 text-xs" />
                    <input value={e.score} onChange={ev => s({ score: ev.target.value })} placeholder="CGPA" className="border rounded px-2 py-1.5 text-xs" />
                    <button onClick={rm} className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
            </Card>

            <Card title="Software skills">
              {listEditor(data.software, l => set({ software: l }), { name: '', level: 3 },
                (sk, s, rm) => (
                  <div className="flex gap-1.5 items-center">
                    <input value={sk.name} onChange={ev => s({ name: ev.target.value })} placeholder="Software" list="cv-sw" className="border rounded px-2 py-1.5 text-xs flex-1" />
                    <input type="range" min={1} max={5} value={sk.level} onChange={ev => s({ level: Number(ev.target.value) })} className="w-20 accent-[#D4AF37]" />
                    <span className="text-[10px] text-gray-400 w-6">{sk.level}/5</span>
                    <button onClick={rm} className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
              <datalist id="cv-sw">{SOFTWARE_PRESETS.map(s => <option key={s} value={s} />)}</datalist>
              <button onClick={suggestSkills} className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-[#FBE7A1]/40 text-[#9C7416] text-xs font-medium">✨ Suggest skills</button>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <input value={data.designSkills} onChange={e => set({ designSkills: e.target.value })} placeholder="Design skills (comma separated)" className="border rounded-lg px-2.5 py-2 text-xs" />
                <input value={data.languages} onChange={e => set({ languages: e.target.value })} placeholder="Languages" className="border rounded-lg px-2.5 py-2 text-xs" />
                <input value={data.softSkills} onChange={e => set({ softSkills: e.target.value })} placeholder="Soft skills" className="border rounded-lg px-2.5 py-2 text-xs" />
              </div>
            </Card>

            <Card title="Projects">
              <button onClick={importProjects} className="mb-2 px-2.5 py-1.5 rounded-lg bg-[#FBE7A1]/40 text-[#9C7416] text-xs font-medium">⤓ Import from Library</button>
              {listEditor(data.projects, l => set({ projects: l }), { name: '', type: '', year: '', desc: '' },
                (p, s, rm) => (
                  <div className="border border-gray-100 rounded-lg p-2 space-y-1.5">
                    <div className="grid grid-cols-[1fr_100px_56px_20px] gap-1.5">
                      <input value={p.name} onChange={ev => s({ name: ev.target.value })} placeholder="Project name" className="border rounded px-2 py-1.5 text-xs" />
                      <input value={p.type} onChange={ev => s({ type: ev.target.value })} placeholder="Type" className="border rounded px-2 py-1.5 text-xs" />
                      <input value={p.year} onChange={ev => s({ year: ev.target.value })} placeholder="Year" className="border rounded px-2 py-1.5 text-xs" />
                      <button onClick={rm} className="text-red-400 text-xs">✕</button>
                    </div>
                    <input value={p.desc} onChange={ev => s({ desc: ev.target.value })} placeholder="One-line description" className="border rounded px-2 py-1.5 text-xs w-full" />
                  </div>
                ))}
            </Card>

            {([['Experience', 'experience'], ['Achievements', 'achievements'], ['Extra-curricular', 'extracurricular']] as const).map(([title, key]) => (
              <Card key={key} title={title}>
                {listEditor(data[key], l => set({ [key]: l } as any), { title: '', detail: '' },
                  (r, s, rm) => (
                    <div className="grid grid-cols-[1fr_1fr_20px] gap-1.5">
                      <input value={r.title} onChange={ev => s({ title: ev.target.value })} placeholder="Title" className="border rounded px-2 py-1.5 text-xs" />
                      <input value={r.detail} onChange={ev => s({ detail: ev.target.value })} placeholder="Detail / dates" className="border rounded px-2 py-1.5 text-xs" />
                      <button onClick={rm} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
              </Card>
            ))}
          </div>

          {/* preview + export */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={exportPdf} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-br from-[#D4AF37] to-[#9C7416] hover:brightness-105">📄 Export PDF (A4)</button>
              <button onClick={exportDoc} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">📝 Word (.doc)</button>
              <button onClick={exportTxt} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50">🤖 ATS text</button>
              <span className="px-3 py-2.5 text-xs text-gray-400 self-center">PDF keeps real text — recruiters’ ATS software can parse it.</span>
            </div>
            <div className="bg-gray-100 rounded-xl border border-gray-200 p-4 flex justify-center">
              <div className="bg-white shadow-xl w-full max-w-[640px]" style={{ aspectRatio: '210/297', overflow: 'hidden' }}>
                <div style={{ width: '210%', height: '210%', transform: 'scale(0.476)', transformOrigin: 'top left' }}
                  dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5">
      <h3 className="text-sm font-bold text-gray-900 mb-2.5">{title}</h3>
      {children}
    </div>
  )
}
