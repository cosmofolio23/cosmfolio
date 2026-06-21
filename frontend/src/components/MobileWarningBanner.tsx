'use client'

import { useState } from 'react'

export default function MobileWarningBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="md:hidden print:hidden bg-amber-500 text-black px-4 py-3 shadow-lg flex items-start justify-between z-[100] relative">
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none">⚠️</span>
        <p className="text-sm font-medium">
          CosmoFolio is optimized for desktop. For the best experience building your portfolio, please switch to a computer.
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-black/60 hover:text-black ml-4 shrink-0 p-1"
        aria-label="Dismiss warning"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
