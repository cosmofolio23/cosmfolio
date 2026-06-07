/**
 * In-browser asset vision (free, no API, no key).
 *
 * Runs a CLIP zero-shot image classifier locally via Transformers.js to detect
 * what each uploaded image actually IS (plan / render / section / …) from its
 * pixels. The model (~50MB) downloads once from the HF CDN and is cached by the
 * browser. Everything runs on the user's device — zero cost, private.
 *
 * Produces the same tag shape as the backend heuristic so the Composition
 * Engine can consume it interchangeably.
 */

// Natural-language CLIP prompts → our canonical asset bucket.
const LABELS: { prompt: string; type: string; priority: string }[] = [
  { prompt: 'an architectural floor plan drawing, top-down', type: 'plan', priority: 'technical' },
  { prompt: 'a site plan or masterplan diagram', type: 'site', priority: 'technical' },
  { prompt: 'an architectural cross section drawing', type: 'section', priority: 'technical' },
  { prompt: 'an architectural elevation drawing of a facade', type: 'elevation', priority: 'technical' },
  { prompt: 'a photorealistic 3D exterior architectural render of a building', type: 'render', priority: 'hero' },
  { prompt: 'a photorealistic 3D interior render of a room', type: 'render', priority: 'supporting' },
  { prompt: 'an architectural concept or analysis diagram', type: 'diagram', priority: 'supporting' },
  { prompt: 'a hand drawn architecture sketch', type: 'process', priority: 'supporting' },
  { prompt: 'a photograph of a physical architecture scale model', type: 'model', priority: 'supporting' },
]

const BEST_USAGE: Record<string, string[]> = {
  render: ['cover', 'opening spread', 'full bleed'],
  plan: ['plan focused page', 'technical layout', 'drawing spread'],
  site: ['site page', 'context spread'],
  section: ['technical layout', 'drawing spread'],
  elevation: ['technical layout', 'drawing spread'],
  diagram: ['concept page', 'process', 'storytelling'],
  process: ['process', 'concept page'],
  model: ['process', 'experience page'],
}

export interface AssetTag {
  url: string
  type: string
  priority: string
  orientation: 'landscape' | 'portrait' | 'square'
  best_usage: string[]
  score: number
}

let _classifier: any = null
let _loading: Promise<any> | null = null

/** Lazy-load the CLIP pipeline once (cached across calls). */
async function getClassifier(onStatus?: (s: string) => void) {
  if (_classifier) return _classifier
  if (!_loading) {
    _loading = (async () => {
      onStatus?.('Loading AI engine…')
      // Load Transformers.js from CDN at runtime so webpack never bundles its
      // native Node ONNX backend. webpackIgnore keeps the bundler out of it.
      // @ts-ignore — resolved in the browser at runtime, not at build time
      const tf: any = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2')
      tf.env.allowLocalModels = false
      onStatus?.('Loading AI model (first time only)…')
      _classifier = await tf.pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32')
      return _classifier
    })()
  }
  return _loading
}

function orientationOf(url: string): Promise<'landscape' | 'portrait' | 'square'> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const r = img.naturalWidth / Math.max(1, img.naturalHeight)
      resolve(r > 1.15 ? 'landscape' : r < 0.85 ? 'portrait' : 'square')
    }
    img.onerror = () => resolve('landscape')
    img.src = url
  })
}

/** Classify a single image by its pixels. */
export async function classifyImage(url: string, onStatus?: (s: string) => void): Promise<AssetTag> {
  const clf = await getClassifier(onStatus)
  let type = 'render', priority = 'supporting', score = 0
  try {
    const out = await clf(url, LABELS.map(l => l.prompt))
    const top = Array.isArray(out) ? out[0] : out
    const match = LABELS.find(l => l.prompt === top?.label)
    if (match) { type = match.type; priority = match.priority; score = top.score }
  } catch { /* fall back to defaults */ }
  const orientation = await orientationOf(url)
  return { url, type, priority, orientation, best_usage: BEST_USAGE[type] || ['supporting image'], score }
}

/**
 * Classify every asset and return them regrouped by DETECTED type (so the
 * Composition Engine works from what the images actually are, not just the
 * upload folder). Also returns the per-asset tags.
 */
export async function analyzeAssets(
  assetsByCategory: Record<string, any[]>,
  onProgress?: (done: number, total: number, status: string) => void,
): Promise<{ regrouped: Record<string, string[]>; tags: AssetTag[] }> {
  const allUrls: string[] = []
  for (const arr of Object.values(assetsByCategory || {})) {
    for (const x of arr || []) {
      const u = typeof x === 'string' ? x : x?.file_url || x?.url
      if (u && u.startsWith('http')) allUrls.push(u)
    }
  }
  const total = allUrls.length
  const tags: AssetTag[] = []
  const regrouped: Record<string, string[]> = {}

  // warm the model once
  await getClassifier(s => onProgress?.(0, total, s))

  for (let i = 0; i < total; i++) {
    onProgress?.(i, total, `Analyzing image ${i + 1} of ${total}…`)
    const tag = await classifyImage(allUrls[i])
    tags.push(tag)
    ;(regrouped[tag.type] ||= []).push(tag.url)
  }
  onProgress?.(total, total, 'Done')
  return { regrouped, tags }
}
