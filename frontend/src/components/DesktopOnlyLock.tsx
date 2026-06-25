'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DesktopOnlyLock() {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      // 1024px is standard laptop breakpoint. Anything smaller (tablet/phone) should probably use desktop for a complex canvas editor
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 mb-6 bg-white/10 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-3">Not Optimized for Mobile</h2>
      <p className="text-gray-300 max-w-sm mb-8 text-sm">
        The CosmoFolio Canvas Editor requires a larger screen to drag, drop, and align your architectural drawings accurately. 
        <br/><br/>
        Using a computer or laptop is <strong>highly recommended</strong> for designing.
      </p>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full px-6 py-3 bg-accent-primary hover:bg-accent-light transition rounded-lg font-medium text-white"
        >
          Return to Dashboard
        </button>
        <button 
          onClick={() => setIsMobile(false)}
          className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 transition rounded-lg font-medium text-gray-400 text-sm"
        >
          Continue Anyway (Not Recommended)
        </button>
      </div>
    </div>
  )
}
