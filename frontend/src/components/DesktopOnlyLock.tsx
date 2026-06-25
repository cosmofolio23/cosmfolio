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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-3">Please Switch to Desktop</h2>
      <p className="text-gray-300 max-w-sm mb-8">
        The CosmoFolio Canvas Editor requires a larger screen to drag, drop, and align your architectural drawings accurately. 
        <br/><br/>
        Please open this link on your computer or laptop to continue designing.
      </p>
      
      <button 
        onClick={() => router.push('/dashboard')}
        className="px-6 py-3 bg-white/10 hover:bg-white/20 transition rounded-lg font-medium"
      >
        Return to Dashboard
      </button>
    </div>
  )
}
