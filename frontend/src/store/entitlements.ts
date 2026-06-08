/**
 * Entitlement store — the frontend half of the access gate.
 *
 * Mirrors backend services/entitlements.py. Reads /api/library/entitlements once,
 * caches the result, and exposes helpers for gating Library UI/routes.
 *
 * Superset rule is already applied server-side (library ⇒ portfolio + sheet), so
 * the booleans here are the *effective* entitlements.
 */

import { create } from 'zustand'
import { apiClient } from '@/lib/api'

export interface Entitlements {
  portfolio: boolean
  sheet: boolean
  library: boolean
}

interface EntitlementStore {
  entitlements: Entitlements | null
  loading: boolean
  loaded: boolean
  fetch: () => Promise<void>
  has: (feature: keyof Entitlements) => boolean
}

export const useEntitlements = create<EntitlementStore>((set, get) => ({
  entitlements: null,
  loading: false,
  loaded: false,

  fetch: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await apiClient.get('/api/library/entitlements')
      set({ entitlements: res.data, loaded: true, loading: false })
    } catch {
      // Fail-open to match backend default-grant (pre-paywall). Never hard-block.
      set({ entitlements: { portfolio: true, sheet: true, library: true }, loaded: true, loading: false })
    }
  },

  has: (feature) => {
    const e = get().entitlements
    if (!e) return false
    return !!e[feature]
  },
}))
