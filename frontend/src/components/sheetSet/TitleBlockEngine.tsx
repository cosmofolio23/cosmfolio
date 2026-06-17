import React from 'react'
import type { SheetSet, Sheet } from './sheetSetTypes'

interface TitleBlockRendererProps {
  sheetSet: SheetSet
  sheet: Sheet
}

export function TitleBlockRenderer({ sheetSet, sheet }: TitleBlockRendererProps) {
  const { titleBlockTemplate, projectName, studentName, collegeName, guideName, location, date, primaryColor } = sheetSet

  if (!titleBlockTemplate || titleBlockTemplate === 'none') {
    return null
  }

  // Common styles
  const textStyle = { color: '#1f2937', fontFamily: sheetSet.fontFamily || 'Inter, sans-serif' }
  const accentStyle = { color: primaryColor || '#D4AF37' }

  const renderBottomStrip = () => (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 flex items-center justify-between px-6"
      style={{ height: '60px', ...textStyle }}
    >
      <div className="flex flex-col justify-center h-full">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={accentStyle}>{projectName}</h2>
        {(location || guideName) && (
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
            {location && `${location} | `} {guideName && `Guide: ${guideName}`}
          </p>
        )}
      </div>

      <div className="flex flex-col justify-center items-center h-full text-center">
        <p className="text-xs font-semibold uppercase tracking-widest">{sheet.sheetName}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">Scale: As indicated</p>
      </div>

      <div className="flex items-center gap-6 h-full">
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider">{studentName}</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{collegeName}</p>
        </div>
        <div 
          className="h-full flex items-center justify-center bg-gray-100 border-l border-gray-300 px-6"
          style={{ minWidth: '80px' }}
        >
          <span className="text-2xl font-light">{sheet.sheetNumber < 10 ? `0${sheet.sheetNumber}` : sheet.sheetNumber}</span>
        </div>
      </div>
    </div>
  )

  const renderRightColumn = () => (
    <div 
      className="absolute top-0 bottom-0 right-0 bg-white border-l border-gray-300 flex flex-col p-6"
      style={{ width: '80px', ...textStyle }}
    >
      <div className="flex-1 flex flex-col items-center justify-start pt-4 space-y-8">
        <div className="text-center w-full transform -rotate-90 origin-center whitespace-nowrap mt-32">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={accentStyle}>{projectName}</h2>
          {(location || guideName) && (
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">
              {location} • {guideName}
            </p>
          )}
        </div>
        
        <div className="text-center w-full transform -rotate-90 origin-center whitespace-nowrap mt-32">
          <p className="text-xs font-semibold uppercase tracking-widest">{sheet.sheetName}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-end pb-4 space-y-6">
        <div className="text-center w-full transform -rotate-90 origin-center whitespace-nowrap mb-16">
          <p className="text-[9px] font-bold uppercase tracking-wider">{studentName}</p>
          <p className="text-[8px] text-gray-500 uppercase mt-0.5">{collegeName}</p>
        </div>
        
        <div className="w-full border-t border-gray-300 pt-4 text-center">
          <span className="text-2xl font-light leading-none block">{sheet.sheetNumber < 10 ? `0${sheet.sheetNumber}` : sheet.sheetNumber}</span>
        </div>
      </div>
    </div>
  )

  const renderMinimalCorner = () => (
    <div 
      className="absolute bottom-6 right-6 flex flex-col items-end"
      style={textStyle}
    >
      <div className="flex items-end gap-4 mb-2">
        <div className="text-right">
          <h2 className="text-sm font-bold uppercase tracking-widest" style={accentStyle}>{projectName}</h2>
          <p className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mt-0.5">{sheet.sheetName}</p>
        </div>
        <div className="text-4xl font-light leading-none" style={accentStyle}>
          {sheet.sheetNumber < 10 ? `0${sheet.sheetNumber}` : sheet.sheetNumber}
        </div>
      </div>
      <div className="w-full h-px bg-gray-400 mb-2" />
      <div className="flex justify-between w-full text-[8px] text-gray-500 uppercase tracking-widest">
        <span>{studentName} • {collegeName}</span>
        <span>{date || new Date().getFullYear()}</span>
      </div>
    </div>
  )

  return (
    <div className="absolute inset-0 pointer-events-none z-[40]" style={{ width: '100%', height: '100%' }}>
      {titleBlockTemplate === 'bottom-strip' && renderBottomStrip()}
      {titleBlockTemplate === 'right-column' && renderRightColumn()}
      {titleBlockTemplate === 'minimal-corner' && renderMinimalCorner()}
    </div>
  )
}
