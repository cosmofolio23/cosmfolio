/**
 * Portfolio Preview Component
 * Phase 5: Task 5.4 - Responsive portfolio preview with export functionality
 */

import React, { useState, useEffect } from 'react';
import { formatBytes } from '@/lib/utils';
import './PortfolioPreview.css';

interface PreviewProps {
  portfolioId: string;
  stylePack?: string;
  onExportStart?: () => void;
  onExportComplete?: (format: string, size: number) => void;
  onError?: (error: string) => void;
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop';
type ExportFormat = 'pdf' | 'html' | 'jpg';

interface ViewportConfig {
  breakpoint: Breakpoint;
  width: number;
  height: string;
  label: string;
}

const VIEWPORTS: Record<Breakpoint, ViewportConfig> = {
  mobile: { breakpoint: 'mobile', width: 375, height: '812px', label: '📱 Mobile' },
  tablet: { breakpoint: 'tablet', width: 768, height: '1024px', label: '📘 Tablet' },
  desktop: { breakpoint: 'desktop', width: 1280, height: '800px', label: '🖥️ Desktop' },
};

const STYLE_PACKS = [
  { id: 'minimal_white', label: 'Minimal White' },
  { id: 'dark_studio', label: 'Dark Studio' },
  { id: 'scandinavian', label: 'Scandinavian' },
  { id: 'architectural_journal', label: 'Journal' },
  { id: 'competition_board', label: 'Competition' },
  { id: 'parametric', label: 'Parametric' },
  { id: 'corporate', label: 'Corporate' },
];

const EXPORT_FORMATS: ExportFormat[] = ['html', 'pdf', 'jpg'];

/**
 * Main Portfolio Preview Component
 * Provides responsive preview with export functionality
 */
export const PortfolioPreview: React.FC<PreviewProps> = ({
  portfolioId,
  stylePack = 'minimal_white',
  onExportStart,
  onExportComplete,
  onError,
}) => {
  // State Management
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('desktop');
  const [currentStylePack, setCurrentStylePack] = useState(stylePack);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Load preview on mount and when style pack changes
  useEffect(() => {
    loadPreview();
  }, [portfolioId, currentStylePack, currentBreakpoint]);

  /**
   * Load HTML preview from API
   */
  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/portfolios/${portfolioId}/preview?style_pack=${currentStylePack}&breakpoint=${currentBreakpoint}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load preview: ${response.statusText}`);
      }

      const html = await response.text();
      setPreviewHtml(html);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error loading preview';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export portfolio in selected format
   */
  const handleExport = async (format: ExportFormat) => {
    try {
      setExporting(true);
      setExportProgress(0);
      onExportStart?.();

      const endpoint =
        format === 'html'
          ? `/api/portfolios/${portfolioId}/export-html`
          : `/api/portfolios/${portfolioId}/export-pdf`;

      const params = new URLSearchParams({
        style_pack: currentStylePack,
      });

      if (format === 'pdf') {
        params.append('page_size', 'A4');
        params.append('orientation', 'portrait');
      }

      const response = await fetch(`${endpoint}?${params}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      setExportProgress(50);

      const data = await response.json();

      // Simulate download
      if (format === 'html') {
        downloadHtml(data, currentStylePack);
      } else if (format === 'pdf') {
        downloadPdf(data, currentStylePack);
      }

      setExportProgress(100);
      onExportComplete?.(format, data.file_size_bytes || 0);

      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Export failed';
      setError(errorMsg);
      onError?.(errorMsg);
      setExporting(false);
      setExportProgress(0);
    }
  };

  /**
   * Download HTML file
   */
  const downloadHtml = (data: any, style: string) => {
    const element = document.createElement('a');
    element.href = data.preview_url || '#';
    element.download = `portfolio_${style}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  /**
   * Download PDF file
   */
  const downloadPdf = (data: any, style: string) => {
    const element = document.createElement('a');
    element.href = data.download_url || '#';
    element.download = `portfolio_${style}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  /**
   * Get viewport config
   */
  const viewport = VIEWPORTS[currentBreakpoint];

  return (
    <div className="portfolio-preview-container">
      {/* Header */}
      <div className="preview-header">
        <h2 className="preview-title">Portfolio Preview</h2>
        <p className="preview-subtitle">Live preview with responsive viewport</p>
      </div>

      {/* Controls Toolbar */}
      <div className="preview-controls">
        {/* Viewport Selector */}
        <div className="control-group">
          <label className="control-label">Viewport</label>
          <div className="viewport-buttons">
            {Object.entries(VIEWPORTS).map(([key, config]) => (
              <button
                key={key}
                className={`viewport-button ${currentBreakpoint === key ? 'active' : ''}`}
                onClick={() => setCurrentBreakpoint(key as Breakpoint)}
                disabled={loading}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style Pack Selector */}
        <div className="control-group">
          <label className="control-label">Design Style</label>
          <select
            className="style-selector"
            value={currentStylePack}
            onChange={(e) => setCurrentStylePack(e.target.value)}
            disabled={loading}
          >
            {STYLE_PACKS.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Buttons */}
        <div className="control-group">
          <label className="control-label">Export</label>
          <div className="export-buttons">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format}
                className={`export-button export-${format}`}
                onClick={() => handleExport(format)}
                disabled={loading || exporting || !previewHtml}
                title={`Export as ${format.toUpperCase()}`}
              >
                {exporting && exportProgress > 0 ? (
                  <>
                    <span className="export-icon">⏳</span>
                    <span>{exportProgress}%</span>
                  </>
                ) : (
                  <>
                    <span className="export-icon">
                      {format === 'pdf' ? '📄' : format === 'html' ? '🌐' : '🖼️'}
                    </span>
                    <span className="export-label">{format.toUpperCase()}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="preview-wrapper">
        {/* Viewport Frame */}
        <div
          className={`preview-frame viewport-${currentBreakpoint}`}
          style={{
            width: `${viewport.width}px`,
            maxHeight: viewport.height,
          }}
        >
          {loading && (
            <div className="preview-loading">
              <div className="loader"></div>
              <p>Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="preview-error">
              <p className="error-icon">⚠️</p>
              <p className="error-message">{error}</p>
              <button
                className="retry-button"
                onClick={loadPreview}
              >
                Retry
              </button>
            </div>
          )}

          {previewHtml && !loading && (
            <iframe
              title="portfolio-preview"
              className="preview-iframe"
              srcDoc={previewHtml}
              sandbox="allow-same-origin allow-scripts"
            />
          )}
        </div>

        {/* Info Panel */}
        <div className="preview-info">
          <div className="info-section">
            <h3 className="info-title">Preview Info</h3>
            <div className="info-item">
              <span className="info-label">Viewport:</span>
              <span className="info-value">{viewport.label}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Width:</span>
              <span className="info-value">{viewport.width}px</span>
            </div>
            <div className="info-item">
              <span className="info-label">Style Pack:</span>
              <span className="info-value">{currentStylePack}</span>
            </div>
          </div>

          <div className="info-section">
            <h3 className="info-title">Export Tips</h3>
            <ul className="tips-list">
              <li>📱 Test on mobile, tablet, desktop</li>
              <li>🎨 Try different design styles</li>
              <li>📄 Export as PDF for print</li>
              <li>🌐 Export as HTML for web</li>
              <li>🖼️ Export as JPG for social</li>
            </ul>
          </div>

          <div className="info-section">
            <h3 className="info-title">Responsive Breakpoints</h3>
            <ul className="breakpoints-list">
              <li>
                <strong>Mobile:</strong> &lt; 640px
              </li>
              <li>
                <strong>Tablet:</strong> 640px - 1024px
              </li>
              <li>
                <strong>Desktop:</strong> &gt; 1024px
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {exporting && (
        <div className="preview-status">
          <div className="status-content">
            <div className="status-spinner"></div>
            <span className="status-text">Exporting... {exportProgress}%</span>
          </div>
          <div className="status-progress">
            <div
              className="status-progress-bar"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPreview;
