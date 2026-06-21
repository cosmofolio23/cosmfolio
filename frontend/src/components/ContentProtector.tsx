'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

const ADMIN_EMAILS = ['boseraj001@gmail.com']

export default function ContentProtector() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  const isProtectedPath = pathname?.includes('/editor') || pathname?.includes('/portfolio')

  useEffect(() => {
    if (isAdmin || !isProtectedPath) {
      setIsBlurred(false)
      setShowWarning(false)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault()
        setShowWarning(true)
      }
      // Block Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element select)
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault()
        setShowWarning(true)
      }
      // Block Ctrl+U (View Source)
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault()
        setShowWarning(true)
      }
      // Block Command+Option+I/J/C (Mac)
      if (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault()
        setShowWarning(true)
      }
      // Block Command+Option+U (Mac)
      if (e.metaKey && e.altKey && e.key.toUpperCase() === 'U') {
        e.preventDefault()
        setShowWarning(true)
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      setShowWarning(true)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true)
      } else {
        setIsBlurred(false)
      }
    }

    const handleBlur = () => {
      setIsBlurred(true)
    }

    const handleFocus = () => {
      setIsBlurred(false)
    }

    // DevTools detection loop
    let devToolsOpen = false
    const detectDevTools = () => {
      const threshold = 160; // Usually DevTools takes up space
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        if (!devToolsOpen) {
          setShowWarning(true)
          devToolsOpen = true
        }
      } else {
        devToolsOpen = false
      }
    }
    const interval = setInterval(detectDevTools, 1000)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [isAdmin, isProtectedPath])

  if (isAdmin || !isProtectedPath) return null

  return (
    <>
      {/* DevTools Warning Overlay */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="bg-charcoal p-8 rounded-2xl max-w-md border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Content Protected</h2>
            <p className="text-stone-300 mb-6">
              Developer tools, inspecting, and saving assets are disabled on this page to protect proprietary templates and user designs.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-stone-200 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Tab Switch / Blur Obfuscator */}
      {isBlurred && (
        <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-md flex items-center justify-center">
          <div className="text-white/50 font-medium tracking-widest uppercase flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Preview Paused
          </div>
        </div>
      )}
    </>
  )
}
