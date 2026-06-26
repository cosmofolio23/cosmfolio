/**
 * Sheet handoff — lets the studio tools (Drawing Processor, Site Analysis,
 * Concept Diagrams, Entourage) push a generated image onto a sheet.
 *
 * The image dataURL is stashed in sessionStorage; when a Sheet Composer editor
 * mounts it offers to drop the pending image onto the current sheet. Kept in
 * sessionStorage (not query string) so large data URLs never hit the URL.
 */

const KEY = 'cosmofolio_sheet_handoff'

export interface SheetImageHandoff {
  dataUrl: string
  name: string
  /** pixel aspect ratio = height / width, for proportional placement */
  aspect: number
  source: string
  ts: number
}

export function stashSheetImage(dataUrl: string, name: string, aspect: number, source: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ dataUrl, name, aspect, source, ts: Date.now() }))
  } catch {
    /* quota / private mode — silently ignore, the tool still offers download */
  }
}

export function peekSheetImage(): SheetImageHandoff | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SheetImageHandoff) : null
  } catch {
    return null
  }
}

export function clearSheetImage() {
  try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
}

/**
 * Create a new sheet project so a handed-off image has somewhere to land.
 * Returns the new project id, or null on failure.
 */
export async function createSheetProject(title?: string): Promise<string | null> {
  try {
    const API = ((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')).replace(/[^\x20-\x7E]/g, '').trim()
    const res = await fetch(`${API}/api/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title || `Sheet ${new Date().toLocaleDateString()}`, project_type: 'sheet' }),
    })
    if (!res.ok) return null
    const proj = await res.json()
    return proj.id as string
  } catch {
    return null
  }
}

/** Aspect (h/w) of a PNG/JPEG dataURL. */
export function aspectOfDataUrl(dataUrl: string): Promise<number> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img.height / Math.max(1, img.width))
    img.onerror = () => resolve(1)
    img.src = dataUrl
  })
}
