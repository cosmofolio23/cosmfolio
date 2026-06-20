'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

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

  useEffect(() => {
    // Listen for Firebase token refresh and auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Force refresh the token to get the latest valid token
        const newToken = await firebaseUser.getIdToken(true)
        if (newToken && newToken !== useAuthStore.getState().token) {
          useAuthStore.getState().setToken(newToken)
          apiClient.setToken(newToken)
        }
      }
    })

    // Firebase SDK handles token refresh automatically, but we need to sync it to our store/localStorage
    const tokenRefreshInterval = setInterval(async () => {
      if (auth.currentUser) {
        const freshToken = await auth.currentUser.getIdToken()
        if (freshToken && freshToken !== useAuthStore.getState().token) {
          useAuthStore.getState().setToken(freshToken)
          apiClient.setToken(freshToken)
        }
      }
    }, 10 * 60 * 1000) // check every 10 minutes

    return () => {
      unsubscribe()
      clearInterval(tokenRefreshInterval)
    }
  }, [])

  return null
}
