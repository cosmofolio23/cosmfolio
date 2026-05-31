'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function PortfolioWebsiteGenerator() {
  const params = useParams()
  const router = useRouter()

  const [preview, setPreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [theme, setTheme] = useState<'light' | 'dark' | 'custom'>('light')
  const [primaryColor, setPrimaryColor] = useState('#0F172A')
  const [domain, setDomain] = useState('')
  const [published, setPublished] = useState(false)

  const previewDimensions = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
  }

  const dimensions = previewDimensions[preview]

  const handlePublish = async () => {
    if (!domain.trim()) {
      alert('Please enter a custom domain')
      return
    }
    setPublished(true)
    // In real app, would call API to publish
  }

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-base dark:bg-dark-surface-base border-b border-border-subtle dark:border-dark-border-subtle shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary transition-colors">
              ← Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Logo size="md" variant="gold" />
              <h1 className="text-h4 font-semibold text-text-primary dark:text-dark-text-primary">Website Generator</h1>
            </div>
          </div>
          <button
            onClick={handlePublish}
            className="btn-primary btn-small">
            {published ? '✓ Published' : 'Publish Website'}
          </button>
        </div>
      </header>

      <main className="grid lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Theme Selection */}
          <div className="card p-6">
            <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Theme</h3>
            <div className="space-y-2">
              {(['light', 'dark', 'custom'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-full px-4 py-2 rounded-lg text-caption font-medium transition-all text-left ${
                    theme === t
                      ? 'bg-accent-primary dark:bg-dark-surface-elevated text-white'
                      : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary'
                  }`}>
                  {t === 'light' && '☀️ Light'}
                  {t === 'dark' && '🌙 Dark'}
                  {t === 'custom' && '🎨 Custom'}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          {theme === 'custom' && (
            <div className="card p-6">
              <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Primary Color</h3>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-border-subtle"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="input-field flex-1 text-sm font-mono"
                  placeholder="#0F172A"
                />
              </div>
            </div>
          )}

          {/* Domain Setup */}
          <div className="card p-6">
            <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Custom Domain</h3>
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="your-portfolio.com"
              className="input-field w-full mb-3"
            />
            <p className="text-caption text-text-secondary dark:text-dark-text-secondary">
              Point your domain to our servers for hosting
            </p>
          </div>

          {/* Preview Devices */}
          <div className="card p-6">
            <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Preview</h3>
            <div className="space-y-2">
              {(['desktop', 'tablet', 'mobile'] as const).map(device => (
                <button
                  key={device}
                  onClick={() => setPreview(device)}
                  className={`w-full px-4 py-2 rounded-lg text-caption font-medium transition-all text-left ${
                    preview === device
                      ? 'bg-accent-primary dark:bg-dark-surface-elevated text-white'
                      : 'bg-surface-elevated dark:bg-dark-surface-overlay text-text-secondary'
                  }`}>
                  {device === 'desktop' && '🖥️ Desktop'}
                  {device === 'tablet' && '📱 Tablet'}
                  {device === 'mobile' && '📲 Mobile'}
                </button>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="card p-6">
            <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Social Links</h3>
            <div className="space-y-2">
              {['Instagram', 'LinkedIn', 'Twitter', 'Email'].map(social => (
                <input
                  key={social}
                  type="text"
                  placeholder={`${social} link...`}
                  className="input-field w-full text-sm"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-20">
            <h3 className="text-body-sm font-semibold text-text-primary dark:text-dark-text-primary mb-4">Live Preview</h3>

            <div className="bg-gray-100 dark:bg-dark-bg-secondary rounded-lg p-4 flex items-center justify-center min-h-96">
              <div
                className="bg-surface-base dark:bg-dark-surface-base shadow-elevation-4 rounded-lg overflow-hidden"
                style={{
                  width: dimensions.width,
                  height: dimensions.height,
                  maxWidth: '100%',
                  aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                }}>
                <div
                  className="w-full h-full flex flex-col items-center justify-center text-center p-8"
                  style={{
                    backgroundColor: theme === 'dark' ? '#0B0B0B' : '#FAFAF8',
                    color: theme === 'dark' ? '#FFFFFF' : '#111111',
                  }}>
                  <div
                    className="w-16 h-16 rounded-full mb-4"
                    style={{ backgroundColor: primaryColor, opacity: 0.2 }}
                  />
                  <h2 className="text-2xl font-bold mb-2">Your Architecture</h2>
                  <p className="text-sm opacity-70 mb-6">Professional Portfolio</p>
                  <button
                    className="px-6 py-2 rounded-lg font-medium text-white"
                    style={{ backgroundColor: primaryColor }}>
                    View Portfolio
                  </button>
                  <p className="text-xs opacity-50 mt-8">
                    {preview === 'desktop' && `Desktop ${dimensions.width}×${dimensions.height}`}
                    {preview === 'tablet' && `Tablet ${dimensions.width}×${dimensions.height}`}
                    {preview === 'mobile' && `Mobile ${dimensions.width}×${dimensions.height}`}
                  </p>
                </div>
              </div>
            </div>

            {published && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg">
                <p className="text-sm font-semibold text-color-success mb-2">✓ Website Published!</p>
                <p className="text-caption text-text-secondary dark:text-dark-text-secondary">
                  Your portfolio is live at <span className="font-mono">{domain}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
