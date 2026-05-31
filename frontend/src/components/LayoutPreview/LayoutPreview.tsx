/**
 * Layout Preview Component
 * Phase 3: Task 3.5 - Layout preview, variations, export
 */

import React, { useState, useEffect } from 'react';
import {
  Eye,
  Download,
  RefreshCw,
  Grid3x3,
  Copy,
  Check,
} from 'lucide-react';
import { APIClient, apiClient } from '@/lib/api';

interface Layout {
  template: string;
  columns: number;
  gap: number;
  padding: number;
  background_color?: string;
}

export const LayoutPreview: React.FC<{
  portfolioId: string;
  pageId: string;
}> = ({ portfolioId, pageId }) => {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<'grid' | 'responsive'>('grid');
  const [copied, setCopied] = useState(false);

  

  useEffect(() => {
    loadLayout();
  }, [portfolioId, pageId]);

  const loadLayout = async () => {
    try {
      const response = await apiClient.get(
        `/portfolios/${portfolioId}/pages/${pageId}/layout`
      );
      setLayout(response.data.layout);
    } catch (error) {
      console.error('Failed to load layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'html' | 'json' | 'css') => {
    try {
      const response = await apiClient.get(
        `/portfolios/${portfolioId}/pages/${pageId}/export-layout?format=${format}`
      );

      const element = document.createElement('a');
      const content = typeof response.data.content === 'string'
        ? response.data.content
        : JSON.stringify(response.data.content, null, 2);

      element.setAttribute(
        'href',
        `data:text/${format};charset=utf-8,${encodeURIComponent(content)}`
      );
      element.setAttribute('download', response.data.file_name);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading || !layout) {
    return <div className="text-center py-12">Loading layout...</div>;
  }

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Eye size={20} className="text-blue-600" />
          <h2 className="font-semibold">Layout Preview</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview('grid')}
            className={`px-3 py-2 rounded text-sm ${
              preview === 'grid'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setPreview('responsive')}
            className={`px-3 py-2 rounded text-sm ${
              preview === 'responsive'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Responsive
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="p-8 bg-white">
        {preview === 'grid' ? (
          <GridPreview layout={layout} />
        ) : (
          <ResponsivePreview layout={layout} />
        )}
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border-t p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ConfigItem label="Template" value={layout.template} />
          <ConfigItem label="Columns" value={layout.columns.toString()} />
          <ConfigItem label="Gap" value={`${layout.gap}px`} />
          <ConfigItem label="Padding" value={`${layout.padding}px`} />
        </div>

        {/* Export Options */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold mb-3">Export Layout</p>
          <div className="flex gap-2 flex-wrap">
            {['html', 'json', 'css'].map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format as 'html' | 'json' | 'css')}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-2"
              >
                <Download size={16} />
                Export {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* CSS Variables */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold mb-2">CSS Variables</p>
          <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono rounded overflow-x-auto">
            <div>--grid-columns: {layout.columns};</div>
            <div>--grid-gap: {layout.gap}px;</div>
            <div>--grid-padding: {layout.padding}px;</div>
            <div>--bg-color: {layout.background_color || '#ffffff'};</div>
          </div>
          <button
            onClick={() =>
              copyToClipboard(
                `--grid-columns: ${layout.columns};\n--grid-gap: ${layout.gap}px;\n--grid-padding: ${layout.padding}px;`
              )
            }
            className="mt-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center gap-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy CSS'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Grid Preview Component
const GridPreview: React.FC<{ layout: Layout }> = ({ layout }) => {
  const items = Array.from({ length: layout.columns * 3 }, (_, i) => i);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
        gap: `${layout.gap}px`,
        padding: `${layout.padding}px`,
        backgroundColor: layout.background_color || '#f9fafb',
      }}
    >
      {items.map((i) => (
        <div
          key={i}
          className="bg-white border-2 border-dashed border-gray-300 rounded h-32 flex items-center justify-center text-gray-500"
        >
          <Grid3x3 size={24} />
        </div>
      ))}
    </div>
  );
};

// Responsive Preview Component
const ResponsivePreview: React.FC<{ layout: Layout }> = ({ layout }) => {
  const [viewportWidth, setViewportWidth] = useState(1024);

  const getColumns = (width: number) => {
    if (width < 480) return 1;
    if (width < 768) return Math.max(1, Math.floor(layout.columns / 2));
    if (width < 1200) return Math.max(1, layout.columns - 1);
    return layout.columns;
  };

  return (
    <div className="space-y-4">
      {/* Viewport Selector */}
      <div className="flex gap-2">
        {[
          { label: 'Mobile', width: 375 },
          { label: 'Tablet', width: 768 },
          { label: 'Desktop', width: 1024 },
          { label: 'Wide', width: 1440 },
        ].map(({ label, width }) => (
          <button
            key={width}
            onClick={() => setViewportWidth(width)}
            className={`px-3 py-2 rounded text-sm ${
              viewportWidth === width
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {label}
            <div className="text-xs mt-1">{width}px</div>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="border rounded bg-gray-100 p-4 overflow-x-auto">
        <div
          style={{
            width: `${viewportWidth}px`,
            margin: '0 auto',
          }}
        >
          <GridPreview layout={layout} />
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 p-3 bg-blue-50 rounded">
        Viewport: {viewportWidth}px • Columns: {getColumns(viewportWidth)}
      </div>
    </div>
  );
};

// Configuration Item
const ConfigItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="bg-gray-50 p-3 rounded">
    <p className="text-xs text-gray-600 mb-1">{label}</p>
    <p className="font-semibold text-gray-900">{value}</p>
  </div>
);

export default LayoutPreview;
