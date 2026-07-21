'use client'

import React, { useState } from 'react'
import type { SheetSet, ProjectStyle, TitleBlockType, SheetSize, Orientation } from './sheetSetTypes'
import { ALL_BORDERS, filterBorders } from './borders/BorderLibrary'

interface ProjectStyleManagerProps {
  sheetSet: SheetSet
  onApplyProjectStyle: (updatedSet: SheetSet) => void
  onClose: () => void
}

/**
 * Project Style Consistency Manager Component
 * Enables single-click locking & cascading of Template, Border, Title Block, Fonts, and Colors across all project sheets.
 */
export const ProjectStyleManager: React.FC<ProjectStyleManagerProps> = ({
  sheetSet,
  onApplyProjectStyle,
  onClose,
}) => {
  const currentStyle: ProjectStyle = sheetSet.projectStyle || {
    id: `style-${sheetSet.id}`,
    name: `${sheetSet.projectName} Style`,
    templateId: 'academic-jury-a1',
    borderId: sheetSet.borderId || 'border-minimal-1',
    titleBlockStyle: sheetSet.titleBlockTemplate || 'bottom-strip',
    fontPairing: {
      headingFont: sheetSet.fontFamily || 'Inter',
      bodyFont: 'Inter',
    },
    colorPalette: {
      primary: sheetSet.primaryColor || '#1E293B',
      secondary: sheetSet.secondaryColor || '#64748B',
      accent: sheetSet.accentColor || '#D4AF37',
      background: sheetSet.backgroundColor || '#FFFFFF',
      text: sheetSet.textColor || '#0F172A',
      borderLine: '#1E293B',
    },
    gridConfig: {
      columns: sheetSet.gridColumns || 12,
      rows: 8,
      gutterMm: sheetSet.gridGutter || 10,
      marginMm: sheetSet.sheetMargins || 15,
      gridType: 'architectural',
    },
    sheetSize: sheetSet.sheetSize || 'A1',
    orientation: sheetSet.orientation || 'landscape',
    defaultNorthStyle: 'north-minimal-1',
    defaultScalebarStyle: 'metric-blocks',
  }

  const [borderId, setBorderId] = useState(currentStyle.borderId)
  const [titleBlockStyle, setTitleBlockStyle] = useState<TitleBlockType>(currentStyle.titleBlockStyle)
  const [headingFont, setHeadingFont] = useState(currentStyle.fontPairing.headingFont)
  const [accentColor, setAccentColor] = useState(currentStyle.colorPalette.accent)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const borderCatalog = filterBorders(selectedCategory, searchQuery)

  const handleSaveAndCascade = () => {
    const updatedStyle: ProjectStyle = {
      ...currentStyle,
      borderId,
      titleBlockStyle,
      fontPairing: { ...currentStyle.fontPairing, headingFont },
      colorPalette: { ...currentStyle.colorPalette, accent: accentColor },
    }

    // Cascade style to all sheets in project
    const updatedSheets = sheetSet.sheets.map(sheet => {
      if (sheet.isOverriddenFromProjectStyle) {
        return sheet // Preserve explicit per-sheet overrides
      }
      return {
        ...sheet,
        overrideBorderId: borderId,
        overrideTitleBlockStyle: titleBlockStyle,
      }
    })

    const updatedSet: SheetSet = {
      ...sheetSet,
      projectStyle: updatedStyle,
      borderId,
      titleBlockTemplate: titleBlockStyle,
      fontFamily: headingFont,
      accentColor,
      sheets: updatedSheets,
    }

    onApplyProjectStyle(updatedSet)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🎨 Project Style Master Engine
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Lock & cascade template, border, title block, font, and palette across all {sheetSet.sheets.length} sheets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Controls */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Title Block Layout
              </label>
              <select
                value={titleBlockStyle}
                onChange={e => setTitleBlockStyle(e.target.value as TitleBlockType)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gold-500"
              >
                <option value="bottom-strip">Bottom Strip (Classic Architectural)</option>
                <option value="right-column">Right Column (Thesis & Competition)</option>
                <option value="minimal-corner">Minimal Corner Card</option>
                <option value="none">No Title Block (Full Canvas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Typography Font Family
              </label>
              <select
                value={headingFont}
                onChange={e => setHeadingFont(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gold-500"
              >
                <option value="Inter">Inter (Clean Modern)</option>
                <option value="Cinzel">Cinzel (Luxury Classical)</option>
                <option value="Outfit">Outfit (Contemporary Architectural)</option>
                <option value="Space Grotesk">Space Grotesk (Tech / Competition)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Center & Right Panel: 1000+ Border Library Catalog */}
          <div className="md:col-span-2 flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                1,000+ Vector Border Catalog ({borderCatalog.length} available)
              </h3>
              <input
                type="text"
                placeholder="Search borders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gold-500 w-48"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['all', 'minimal', 'competition', 'jury', 'swiss', 'technical', 'dark', 'luxury'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] rounded-full capitalize transition-colors ${
                    selectedCategory === cat
                      ? 'bg-gold-500 text-gray-950 font-bold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Border Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[360px] p-1">
              {borderCatalog.slice(0, 36).map(border => (
                <div
                  key={border.id}
                  onClick={() => setBorderId(border.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-24 ${
                    borderId === border.id
                      ? 'border-gold-500 bg-gold-500/10 shadow-md ring-2 ring-gold-500/50'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 bg-white dark:bg-gray-950'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
                    {border.name}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-gray-500">
                    <span className="capitalize">{border.category}</span>
                    <span>{border.style.cornerStyle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/50">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            ⚡ Clicking apply will update all {sheetSet.sheets.length} sheets in this project instantly.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndCascade}
              className="px-5 py-2 text-xs font-semibold bg-[#D4AF37] hover:bg-[#b8952d] text-gray-950 rounded-lg shadow-md transition-colors"
            >
              Cascade Project Style Across All Sheets
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
