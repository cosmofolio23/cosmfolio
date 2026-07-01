'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    try {
      let sessionId = sessionStorage.getItem('analytics_session_id')
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        sessionStorage.setItem('analytics_session_id', sessionId)
      }

      const API_URL = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') 
        ? '/backend-proxy' 
        : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')
      
      fetch(`${API_URL}/api/monitoring/track-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'page_view',
          session_id: sessionId,
          metadata: { url: pathname }
        }),
        keepalive: true
      }).catch(() => {
        // Silently ignore tracking errors
      })
    } catch (e) {
      // Ignore sessionStorage/crypto errors in restrictive environments
    }
  }, [pathname])

  return null
}
