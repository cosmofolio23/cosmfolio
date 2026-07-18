'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('cookie_consent')) setVisible(true)
    } catch { /* localStorage unavailable */ }
  }, [])

  const accept = () => {
    try { localStorage.setItem('cookie_consent', 'accepted') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[200] bg-gray-900 text-white px-4 py-3 shadow-2xl print:hidden">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 justify-between text-sm">
        <p className="text-gray-200">
          We use cookies for core functionality and, via Google AdSense, for advertising. See our{' '}
          <Link href="/privacy" className="underline text-white">Privacy Policy</Link>.
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-4 py-1.5 bg-white text-gray-900 rounded font-medium hover:bg-gray-100"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
