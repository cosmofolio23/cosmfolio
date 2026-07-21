'use client'

import React from 'react'
import type { SheetSet, Sheet, TitleBlockType } from '../sheetSetTypes'

interface MasterTitleBlockProps {
  sheetSet: SheetSet
  sheet: Sheet
  widthPx: number
  heightPx: number
  onUpdateMetadata?: (updates: Partial<SheetSet>) => void
}

/**
 * Master Architectural Title Block Component
 * Single master title block updated once $\rightarrow$ propagates across all project sheets.
 */
export const MasterTitleBlock: React.FC<MasterTitleBlockProps> = ({
  sheetSet,
  sheet,
  widthPx,
  heightPx,
  onUpdateMetadata,
}) => {
  const styleType: TitleBlockType =
    sheet.overrideTitleBlockStyle || sheetSet.titleBlockTemplate || sheetSet.projectStyle?.titleBlockStyle || 'bottom-strip'

  if (styleType === 'none') return null

  const marginPx = Math.max(10, widthPx * 0.02)
  const isRightColumn = styleType === 'right-column'
  const isMinimalCorner = styleType === 'minimal-corner'

  return (
    <div
      className={`absolute z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 text-gray-900 dark:text-white pointer-events-auto select-none shadow-sm text-xs ${
        isRightColumn
          ? 'top-[2%] right-[2%] bottom-[2%] w-[180px] border-l flex flex-col justify-between p-3'
          : isMinimalCorner
          ? 'bottom-[2%] right-[2%] border p-3 rounded-lg max-w-[280px]'
          : 'bottom-[2%] left-[2%] right-[2%] h-[56px] border-t grid grid-cols-6 items-center px-4 gap-4'
      }`}
    >
      {/* Project Title & Sheet Name */}
      <div className={isRightColumn ? 'space-y-1 pb-2 border-b' : 'col-span-2'}>
        <div className="text-[9px] uppercase tracking-wider text-gray-600 dark:text-gray-400 font-medium">
          Project Name
        </div>
        <input
          type="text"
          value={sheetSet.projectName || 'Architectural Project'}
          onChange={e => onUpdateMetadata && onUpdateMetadata({ projectName: e.target.value })}
          className="font-bold text-sm bg-transparent border-b border-transparent hover:border-gray-400 focus:border-gold-500 focus:outline-none w-full truncate"
          placeholder="Project Title"
        />
        <div className="text-[10px] text-gold-700 dark:text-gold-400 font-semibold truncate mt-0.5">
          {sheet.sheetName || `Sheet ${sheet.sheetNumber}`}
        </div>
      </div>

      {/* Student & Institution Info */}
      <div className={isRightColumn ? 'space-y-1 py-2 border-b' : 'col-span-2 border-l border-r border-gray-200 dark:border-gray-800 px-3'}>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-[8px] uppercase">Drawn By</span>
            <input
              type="text"
              value={sheetSet.studentName || 'boseraj001@gmail.com'}
              onChange={e => onUpdateMetadata && onUpdateMetadata({ studentName: e.target.value })}
              className="bg-transparent border-b border-transparent hover:border-gray-400 focus:border-gold-500 focus:outline-none w-full truncate font-medium"
            />
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block text-[8px] uppercase">College / Studio</span>
            <input
              type="text"
              value={sheetSet.collegeName || 'School of Architecture'}
              onChange={e => onUpdateMetadata && onUpdateMetadata({ collegeName: e.target.value })}
              className="bg-transparent border-b border-transparent hover:border-gray-400 focus:border-gold-500 focus:outline-none w-full truncate"
            />
          </div>
        </div>
      </div>

      {/* Scale & Date */}
      {!isMinimalCorner && (
        <div className={isRightColumn ? 'space-y-1 py-2 border-b' : 'col-span-1 text-center'}>
          <div className="text-[8px] uppercase text-gray-600 dark:text-gray-400">Submission</div>
          <div className="font-semibold text-[10px] uppercase text-gray-700 dark:text-gray-300">
            {sheetSet.submissionType || 'Studio Review'}
          </div>
          <div className="text-[9px] text-gray-600 dark:text-gray-400 mt-0.5">
            {sheetSet.date || new Date().toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Sheet Number Indicator */}
      <div className={isRightColumn ? 'pt-2 flex items-center justify-between' : 'col-span-1 text-right flex flex-col items-end justify-center'}>
        <span className="text-[8px] uppercase text-gray-600 dark:text-gray-400">Sheet No.</span>
        <div className="text-base font-black tracking-tight text-gray-900 dark:text-white">
          A1.0{sheet.sheetNumber} <span className="text-xs font-normal text-gray-600 dark:text-gray-400">/ 0{sheetSet.sheets.length}</span>
        </div>
      </div>
    </div>
  )
}
