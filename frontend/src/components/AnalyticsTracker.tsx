'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const trackPageView = () => {
      try {
        let sessionId = sessionStorage.getItem('analytics_session_id')
        if (!sessionId) {
          sessionId = crypto.randomUUID()
          sessionStorage.setItem('analytics_session_id', sessionId)
        }

        const API_URL = (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') 
          ? '/backend-proxy' 
          : (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')

        const token = localStorage.getItem('auth_token')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        fetch(`${API_URL}/api/monitoring/track-activity`, {
          method: 'POST',
          headers,
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
    }

    // Track on pathname change immediately
    trackPageView()

    // Ping heartbeat every 60 seconds to maintain online presence
    intervalId = setInterval(trackPageView, 60000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [pathname])

  return null
}
