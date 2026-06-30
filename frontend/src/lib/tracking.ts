export const getApiUrl = () => {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://cosmfolio-production.up.railway.app')
}

export const trackEvent = async (eventName: string, metadata: Record<string, any> = {}) => {
  try {
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    await fetch(`${getApiUrl()}/api/monitoring/track-activity`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_name: eventName,
        metadata
      }),
      // Don't wait or block for analytics
      keepalive: true
    })
  } catch (error) {
    // Silently fail monitoring so we don't break the user experience
    console.error('[Monitoring] Failed to track event:', error)
  }
}

export const trackError = async (
  errorType: string,
  error: Error | any,
  context: { page?: string; action?: string; [key: string]: any } = {}
) => {
  try {
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const message = error instanceof Error ? error.message : String(error)
    const stack_trace = error instanceof Error ? error.stack : undefined

    await fetch(`${getApiUrl()}/api/monitoring/track-error`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        error_type: errorType,
        message,
        stack_trace,
        page: context.page || window.location.pathname,
        browser: navigator.userAgent,
        device: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
      }),
      keepalive: true
    })
  } catch (err) {
    console.error('[Monitoring] Failed to track error:', err)
  }
}
