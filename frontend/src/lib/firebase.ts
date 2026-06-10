import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)

// ==================== Auth Functions ====================

export async function firebaseSignUp(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user
  const token = await user.getIdToken()

  // Tell our backend to save user info in Supabase DB
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  await fetch(`${apiUrl}/api/auth/signup?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  return { user, token }
}

export async function firebaseSignIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    const token = await user.getIdToken()
    return { user, token }
  } catch (err: any) {
    // Ad blockers / privacy extensions can block the direct call to
    // identitytoolkit.googleapis.com, which surfaces as
    // auth/network-request-failed. Fall back to signing in through our own
    // backend (which no client-side blocker can intercept).
    if (err?.code === 'auth/network-request-failed') {
      return backendSignIn(email, password)
    }
    throw err
  }
}

/**
 * Server-side sign-in fallback. Returns a minimal user-like object compatible
 * with the auth store ({ uid, email }). The token is a real Firebase ID token
 * the backend already verifies on every request.
 */
async function backendSignIn(email: string, password: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const res = await fetch(`${apiUrl}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      api_key: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    }),
  })

  if (!res.ok) {
    let detail = 'Invalid email or password'
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch {}
    throw new Error(detail)
  }

  const data = await res.json()
  const user = {
    uid: data.user_id as string,
    email: (data.email as string) || email,
    displayName: (data.name as string) || '',
  }
  return { user: user as unknown as User, token: data.token as string }
}

export async function firebaseSignOut() {
  await signOut(auth)
}

export async function firebaseGoogleSignIn() {
  const provider = new GoogleAuthProvider()
  const userCredential = await signInWithPopup(auth, provider)
  const user = userCredential.user
  const token = await user.getIdToken()

  // Save user in Supabase DB via backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  try {
    await fetch(`${apiUrl}/api/auth/verify-token?token=${token}`, {
      method: 'POST',
    })
  } catch (e) {
    console.log('Backend sync error (non-critical):', e)
  }

  return { user, token }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export default app
