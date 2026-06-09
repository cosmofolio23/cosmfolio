/**
 * Library Stats — quick summary of the user's Library activity.
 * Shown on the main Library gallery page.
 */

import React, { useEffect, useState } from 'react'
import { FolderOpen, Upload, Zap } from 'lucide-react'
import { libraryApi } from '@/lib/libraryApi'

interface Stats {
  projects: number
  assets: number
  outputs: number
}

export function LibraryStats() {
  const [stats, setStats] = useState<Stats>({ projects: 0, assets: 0, outputs: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const projects = await libraryApi.listProjects()
        let totalAssets = 0
        let totalOutputs = 0

        // count total assets across all projects
        for (const p of projects.items || []) {
          const proj = await libraryApi.getProject(p.id)
          totalAssets += (proj.assets || []).length
        }

        // count outputs (portfolios + sheet sets) — would need endpoints to support this
        // for now, we skip it since it requires backend filtering

        setStats({
          projects: projects.items?.length || 0,
          assets: totalAssets,
          outputs: totalOutputs,
        })
      } catch (e) {
        console.error('Failed to load stats:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <FolderOpen className="text-accent-gold" size={20} />
          <h3 className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Projects</h3>
        </div>
        <p className="text-3xl font-bold text-gold-gradient">{stats.projects}</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="text-emerald-500" size={20} />
          <h3 className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Assets</h3>
        </div>
        <p className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{stats.assets}</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-accent-gold" size={20} />
          <h3 className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Generated</h3>
        </div>
        <p className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{stats.outputs}</p>
      </div>
    </div>
  )
}
