/**
 * Library API helper — thin wrapper over apiClient for the premium Library store.
 */

import { apiClient } from '@/lib/api'
import type { AssetCategory, AssetType } from '@/lib/assetTaxonomy'

export interface LibraryProject {
  id: string
  user_id: string
  name: string
  typology?: string
  year?: number
  semester?: string
  studio_brief?: string
  status: 'active' | 'archived' | 'completed'
  cover_asset_id?: string
  sort_order: number
  asset_count?: number
  created_at: string
  updated_at: string
}

export interface LibraryAsset {
  id: string
  project_id: string
  category: AssetCategory
  asset_type: AssetType
  title?: string
  caption?: string
  storage_path: string
  url?: string
  thumb_url?: string
  scale?: string
  orientation?: 'portrait' | 'landscape'
  has_north?: boolean
  is_vector?: boolean
  width_px?: number
  height_px?: number
  file_size?: number
  is_featured?: boolean
  sort_order?: number
}

export const libraryApi = {
  async entitlements() {
    return (await apiClient.get('/api/library/entitlements')).data
  },

  async listProjects(): Promise<{ items: LibraryProject[]; total: number }> {
    return (await apiClient.get('/api/library/projects')).data
  },

  async getProject(id: string): Promise<LibraryProject & { assets: LibraryAsset[]; text: any[] }> {
    return (await apiClient.get(`/api/library/projects/${id}`)).data
  },

  async createProject(payload: Partial<LibraryProject>): Promise<LibraryProject> {
    return (await apiClient.post('/api/library/projects', payload)).data
  },

  async updateProject(id: string, payload: Partial<LibraryProject>): Promise<LibraryProject> {
    return (await apiClient.put(`/api/library/projects/${id}`, payload)).data
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/api/library/projects/${id}`)
  },

  async uploadAssets(projectId: string, files: File[]): Promise<{ created: LibraryAsset[]; uploaded: number; failed: number }> {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    const res = await apiClient.post(
      `/api/library/projects/${projectId}/assets/bulk`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  async updateAsset(projectId: string, assetId: string, payload: Partial<LibraryAsset>): Promise<LibraryAsset> {
    return (await apiClient.put(`/api/library/projects/${projectId}/assets/${assetId}`, payload)).data
  },

  async deleteAsset(projectId: string, assetId: string): Promise<void> {
    await apiClient.delete(`/api/library/projects/${projectId}/assets/${assetId}`)
  },
}
