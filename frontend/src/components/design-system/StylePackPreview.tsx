'use client'

import { StylePack } from './StylePackGallery'

interface Props {
  pack: StylePack
  onClose: () => void
  onApply?: () => void
  onEdit?: () => void
}

export function StylePackPreview({ pack, onClose, onApply, onEdit }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        style={{ background: pack.colors.background }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: `${pack.colors.text}22`, background: pack.colors.background }}>
          <div>
            <h2
              className="text-2xl font-bold"
              style={{
                color: pack.colors.text,
                fontFamily: pack.typography.heading_font,
                fontWeight: pack.typography.heading_weight,
              }}
            >
              {pack.name}
            </h2>
            <p className="text-sm opacity-70" style={{ color: pack.colors.text }}>
              {pack.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/10 transition"
            style={{ color: pack.colors.text }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Live Preview */}
        <div className="p-6 space-y-6">
          {/* Typography Preview */}
          <section>
            <div className="text-xs uppercase tracking-wider opacity-60 mb-3" style={{ color: pack.colors.text }}>
              Typography
            </div>
            <div className="space-y-3" style={{ color: pack.colors.text }}>
              <h1
                style={{
                  fontFamily: pack.typography.heading_font,
                  fontSize: `${pack.typography.heading_size}px`,
                  fontWeight: pack.typography.heading_weight,
                  lineHeight: pack.typography.line_height,
                }}
              >
                Architecture Portfolio
              </h1>
              <h2
                style={{
                  fontFamily: pack.typography.heading_font,
                  fontSize: `${pack.typography.heading_size * 0.7}px`,
                  fontWeight: pack.typography.heading_weight - 100,
                  lineHeight: pack.typography.line_height,
                }}
              >
                Project Title — Subhead
              </h2>
              <p
                style={{
                  fontFamily: pack.typography.body_font,
                  fontSize: `${pack.typography.body_size}px`,
                  fontWeight: pack.typography.body_weight,
                  lineHeight: pack.typography.line_height,
                }}
              >
                This is body text that demonstrates the typography pairing of the design pack.
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
                Architecture is the learned game, correct and magnificent, of forms assembled in the light.
              </p>
              <p
                className="opacity-70"
                style={{
                  fontFamily: pack.typography.body_font,
                  fontSize: `${pack.typography.body_size * 0.8}px`,
                  fontWeight: pack.typography.body_weight,
                }}
              >
                Caption text · Page 01 · Photographer credit
              </p>
            </div>
          </section>

          {/* Color Palette */}
          <section>
            <div className="text-xs uppercase tracking-wider opacity-60 mb-3" style={{ color: pack.colors.text }}>
              Color Palette
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(pack.colors).map(([name, color]) => (
                <div key={name} className="text-center">
                  <div
                    className="w-full aspect-square rounded-lg border"
                    style={{ background: color, borderColor: `${pack.colors.text}22` }}
                  />
                  <div className="text-xs mt-1 opacity-70 capitalize" style={{ color: pack.colors.text }}>
                    {name}
                  </div>
                  <div className="text-[10px] opacity-50 font-mono" style={{ color: pack.colors.text }}>
                    {color.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Spacing Demo */}
          <section>
            <div className="text-xs uppercase tracking-wider opacity-60 mb-3" style={{ color: pack.colors.text }}>
              Spacing System
            </div>
            <div className="flex items-end gap-3">
              {Object.entries(pack.spacing).map(([name, size]) => (
                <div key={name} className="text-center">
                  <div
                    className="rounded"
                    style={{
                      background: pack.colors.accent,
                      width: `${size * 2}px`,
                      height: `${size * 2}px`,
                    }}
                  />
                  <div className="text-xs mt-1 opacity-70 uppercase" style={{ color: pack.colors.text }}>
                    {name}
                  </div>
                  <div className="text-[10px] opacity-50" style={{ color: pack.colors.text }}>
                    {size}px
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Layout Sample */}
          <section>
            <div className="text-xs uppercase tracking-wider opacity-60 mb-3" style={{ color: pack.colors.text }}>
              Layout Sample
            </div>
            <div
              className="border rounded-lg p-6"
              style={{
                borderColor: `${pack.colors.text}22`,
                padding: `${pack.spacing.lg}px`,
              }}
            >
              <div
                className="font-bold mb-2"
                style={{
                  color: pack.colors.primary,
                  fontFamily: pack.typography.heading_font,
                  fontSize: `${pack.typography.heading_size * 0.6}px`,
                  fontWeight: pack.typography.heading_weight,
                  marginBottom: `${pack.spacing.md}px`,
                }}
              >
                Museum Redesign
              </div>
              <div
                style={{
                  color: pack.colors.text,
                  fontFamily: pack.typography.body_font,
                  fontSize: `${pack.typography.body_size}px`,
                  lineHeight: pack.typography.line_height,
                  marginBottom: `${pack.spacing.md}px`,
                }}
              >
                A contemporary intervention in a historical fabric — exploring tension between heritage and modernity.
              </div>
              <div className="flex gap-2" style={{ gap: `${pack.spacing.sm}px` }}>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: pack.colors.primary, color: pack.colors.background }}
                >
                  Cultural
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: pack.colors.accent, color: pack.colors.background }}
                >
                  2025
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium border"
                  style={{
                    color: pack.colors.text,
                    borderColor: `${pack.colors.text}44`,
                  }}
                >
                  Mumbai
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div
          className="sticky bottom-0 px-6 py-4 border-t flex items-center justify-between gap-3"
          style={{ borderColor: `${pack.colors.text}22`, background: pack.colors.background }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition"
            style={{ color: pack.colors.text, borderColor: `${pack.colors.text}44` }}
          >
            Close
          </button>
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-lg text-sm font-semibold border transition"
                style={{ color: pack.colors.text, borderColor: `${pack.colors.text}44` }}
              >
                Edit
              </button>
            )}
            {onApply && (
              <button
                onClick={onApply}
                className="px-6 py-2 rounded-lg text-sm font-bold transition"
                style={{ background: pack.colors.accent, color: pack.colors.background }}
              >
                Apply to Portfolio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
