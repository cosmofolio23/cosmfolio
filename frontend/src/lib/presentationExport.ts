/**
 * Presentation Mode — export portfolio as a full-screen slideshow.
 * PDF with page transitions, or standalone HTML with animations.
 *
 * Format: embed speaker notes (invisible during presentation, visible in presenter view).
 */

import type { Portfolio } from '@/lib/api'
import type { DesignTokens } from '@/components/composer/designSystem'

export interface PresentationConfig {
  format: 'pdf' | 'html'
  autoplay: boolean
  autoplayDuration: number // ms per slide
  includeNotes: boolean
  transitionType: 'fade' | 'slide' | 'none'
}

export interface SlideData {
  pageNum: number
  content: string // SVG or HTML
  title: string
  notes?: string // speaker notes (hidden from audience)
}

/**
 * Generate HTML presentation (standalone, browser-playable).
 * Includes presenter view toggle (N key) showing notes + current slide.
 */
export function generateHTMLPresentation(
  slides: SlideData[],
  portfolio: Portfolio,
  config: PresentationConfig,
  tokens?: DesignTokens
): string {
  const bgColor = tokens?.colors?.background || '#ffffff'
  const textColor = tokens?.colors?.text || '#1f2937'
  const accentColor = tokens?.colors?.accent || '#3b82f6'

  const slidesHTML = slides
    .map(
      (s, i) => `
    <div class="slide" data-slide="${i}" style="background-color: ${bgColor}; color: ${textColor};">
      <div class="slide-content">
        ${s.content}
      </div>
      <div class="slide-footer">
        <span class="slide-number">${i + 1} / ${slides.length}</span>
        <span class="slide-title">${s.title}</span>
      </div>
      ${s.notes ? `<div class="speaker-notes" style="display: none;">${escapeHtml(s.notes)}</div>` : ''}
    </div>
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${portfolio.name || 'Portfolio'} — Presentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${tokens?.fonts?.body || 'system-ui'}, sans-serif; }

    .presentation {
      width: 100vw;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      overflow: hidden;
      background: ${bgColor};
    }

    .slide {
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px;
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
      transition: opacity 0.5s ${config.transitionType === 'fade' ? 'ease-in-out' : 'linear'};
    }

    .slide.active { display: flex; opacity: 1; }
    .slide.prev { display: flex; opacity: 0; }

    .slide-content {
      width: 100%;
      height: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    .slide-footer {
      width: 100%;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      opacity: 0.6;
      border-top: 1px solid ${accentColor}40;
    }

    .slide-number { font-weight: 600; color: ${accentColor}; }
    .slide-title { flex: 1; text-align: center; }

    .speaker-notes {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.5;
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid #d1d5db;
    }

    .controls {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 100;
    }

    .btn {
      padding: 10px 20px;
      background: ${accentColor};
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.2s;
    }

    .btn:hover { opacity: 0.9; }
    .btn:active { opacity: 0.8; }

    .info {
      position: fixed;
      top: 20px;
      left: 20px;
      color: ${textColor};
      opacity: 0.7;
      font-size: 14px;
    }

    .presenter-view .slide-content { opacity: 0.3; }
    .presenter-view .speaker-notes { display: block !important; }
    .presenter-view .controls { display: none; }
  </style>
</head>
<body>
  <div class="presentation">
    ${slidesHTML}
  </div>

  <div class="info">
    <div><strong>${portfolio.name || 'Portfolio'}</strong></div>
    <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">Press <kbd>?</kbd> for help</div>
  </div>

  <div class="controls">
    <button class="btn" id="prevBtn">← Prev</button>
    <button class="btn" id="nextBtn">Next →</button>
  </div>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    let presenterMode = false;
    let autoplayTimeout;

    function go(n) {
      slides[current].classList.remove('active');
      current = (n + totalSlides) % totalSlides;
      slides[current].classList.add('active');
      if (${config.autoplay}) {
        clearTimeout(autoplayTimeout);
        autoplayTimeout = setTimeout(() => go(current + 1), ${config.autoplayDuration});
      }
    }

    document.getElementById('prevBtn').addEventListener('click', () => go(current - 1));
    document.getElementById('nextBtn').addEventListener('click', () => go(current + 1));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
      if (e.key === 'n') { presenterMode = !presenterMode; document.documentElement.classList.toggle('presenter-view'); }
      if (e.key === '?') {
        alert('Keyboard shortcuts:\\n← → or space: Navigate\\nN: Toggle speaker notes\\n? : Help');
      }
    });

    slides[0].classList.add('active');
  </script>
</body>
</html>
  `
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Generate PDF presentation (requires backend PDF service).
 * Returns a data URL or blob that can be downloaded/opened in a new window.
 */
export async function generatePDFPresentation(
  slides: SlideData[],
  portfolio: Portfolio,
  config: PresentationConfig
): Promise<Blob> {
  // This will call a backend endpoint that uses a PDF library (e.g., PDFKit)
  // to build a multi-page PDF with transitions and embedded metadata.
  // For now, we'll stub it to call the existing PDF export service.
  const response = await fetch('/api/portfolios/' + portfolio.id + '/export-pdf-presentation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, slides }),
  })
  return response.blob()
}
