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

// Strip BOM / zero-width / non-printable chars that can sneak into env vars
// (e.g. when they're set via PowerShell). A leading U+FEFF silently
// invalidates the Firebase API key ("API key not valid") and turns absolute
// URLs into relative paths. Firebase config + URLs are all printable ASCII.
const clean = (v?: string) => (v ?? '').replace(/[^\x20-\x7E]/g, '').trim()
const apiBase = () => clean(process.env.NEXT_PUBLIC_API_URL) || 'https://cosmfolio-backend.onrender.com'
const firebaseApiKey = () => clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)

const firebaseConfig = {
  apiKey: firebaseApiKey(),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)

// ==================== Auth Functions ====================

export async function firebaseSignUp(email: string, password: string, name: string, college_name?: string, state?: string, year_of_passing?: string, stream?: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    const token = await user.getIdToken()

    // Tell our backend to save user info in Supabase DB
    const apiUrl = apiBase()
    const queryParams = new URLSearchParams({
      email,
      password,
      name,
      ...(college_name && { college_name }),
      ...(state && { state }),
      ...(year_of_passing && { year_of_passing }),
      ...(stream && { stream })
    }).toString();

    await fetch(`${apiUrl}/api/auth/signup?${queryParams}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    return { user, token }
  } catch (err: any) {
    // Ad blockers / privacy extensions can block the direct call to
    // identitytoolkit.googleapis.com (auth/network-request-failed). Fall back
    // to registering through our own backend, which no blocker can intercept.
    if (err?.code === 'auth/network-request-failed') {
      return backendSignUp(email, password, name, college_name, state, year_of_passing, stream)
    }
    throw err
  }
}

/** Server-side registration fallback (see backendSignIn). */
async function backendSignUp(email: string, password: string, name: string, college_name?: string, state?: string, year_of_passing?: string, stream?: string) {
  const apiUrl = apiBase()
  const res = await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name,
      college_name,
      state,
      year_of_passing,
      stream,
      api_key: firebaseApiKey(),
    }),
  })

  if (!res.ok) {
    let detail = 'Sign up failed. Please try again.'
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
    displayName: (data.name as string) || name || '',
  }
  return { user: user as unknown as User, token: data.token as string }
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
  const apiUrl = apiBase()
  const res = await fetch(`${apiUrl}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      api_key: firebaseApiKey(),
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
  const apiUrl = apiBase()
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
