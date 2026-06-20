'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { apiClient } from '@/lib/api'
import { auth } from '@/lib/firebase'
import { onIdTokenChanged } from 'firebase/auth'

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
    // onIdTokenChanged fires automatically when Firebase refreshes the token!
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the latest token without forcing a refresh (Firebase already refreshed it if it fired)
        const currentToken = await firebaseUser.getIdToken()
        if (currentToken && currentToken !== useAuthStore.getState().token) {
          useAuthStore.getState().setToken(currentToken)
          apiClient.setToken(currentToken)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return null
}
