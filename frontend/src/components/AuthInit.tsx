'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'

export default function AuthInit() {
  const { isAuthenticated, token, user, fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    // If we have a token but no user object, fetch user details
    if (isAuthenticated && token && !user) {
      // Ensure apiClient has the token loaded (sync state)
      apiClient.setToken(token)
      fetchCurrentUser()
    }
  }, [isAuthenticated, token, user, fetchCurrentUser])

  return null
}
