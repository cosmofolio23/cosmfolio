/**
 * Shared helper: save a generated image into the user's Library under a
 * holding project (created on first use). Falls back to a direct download
 * when the Library is unavailable (offline / not entitled).
 */
import { libraryApi } from '@/lib/libraryApi'

export async function saveImageToLibrary(
  blob: Blob,
  fileName: string,
  projectName = 'Studio Tools'
): Promise<{ ok: boolean; message: string }> {
  try {
    const file = new File([blob], fileName, { type: blob.type || 'image/png' })
    const { items } = await libraryApi.listProjects()
    const existing = items.find(p => p.name === projectName)
    const projectId = existing
      ? existing.id
      : (await libraryApi.createProject({ name: projectName, typology: 'Tools' })).id
    await libraryApi.uploadAssets(projectId, [file])
    return { ok: true, message: `Saved to Library → “${projectName}”.` }
  } catch (e: any) {
    const message = e?.response?.status === 403
      ? 'Library is a premium feature — downloaded the file instead.'
      : 'Library unreachable — downloaded the file instead.'
    downloadBlob(blob, fileName)
    return { ok: false, message }
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Serialize an SVG element and rasterize to a PNG blob at the given scale. */
export async function svgToPngBlob(svgEl: SVGSVGElement, mult = 1, bg?: string): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svgEl)
  const svg64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
  const img = new Image()
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = () => rej(new Error('SVG rasterize failed'))
    img.src = svg64
  })
  const vb = svgEl.viewBox.baseVal
  const w = (vb && vb.width) || svgEl.clientWidth || img.width
  const h = (vb && vb.height) || svgEl.clientHeight || img.height
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * mult)
  canvas.height = Math.round(h * mult)
  const ctx = canvas.getContext('2d')!
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height) }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return await new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'))
}
