/**
 * Asset Manager Component
 * Phase 2: Task 2.8 - Frontend asset management UI
 * Handles asset upload, organization, search, and versioning
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Filter,
  Grid,
  List as ListIcon,
  Tag,
  Clock,
  Download,
  MoreVertical,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { AssetUploadProgress } from './AssetUploadProgress';
import { AssetGridView } from './AssetGridView';
import { AssetListView } from './AssetListView';
import { AssetSearchBar } from './AssetSearchBar';
import { AssetVersionHistory } from './AssetVersionHistory';

interface Asset {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  asset_type: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  preview_url?: string;
}

interface SearchFilters {
  query: string;
  assetType?: string;
  tags: string[];
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min: number; max: number };
}

export const AssetManager: React.FC<{ portfolioId: string }> = ({ portfolioId }) => {
  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
  });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load assets
  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      // Build search params
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.assetType) params.append('type', filters.assetType);
      if (filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      const response = await apiClient.get(
        `/portfolios/${portfolioId}/search?${params.toString()}`
      );

      setAssets(response.data.items || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  }, [portfolioId, filters, apiClient]);

  // Load tags
  const loadTags = useCallback(async () => {
    try {
      const response = await apiClient.get(
        `/portfolios/${portfolioId}/tags`
      );
      setAvailableTags(response.data.tags || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, [portfolioId, apiClient]);

  // Effects
  useEffect(() => {
    loadAssets();
    loadTags();
  }, [loadAssets, loadTags]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      // Upload with progress tracking
      const response = await apiClient.post(
        `/portfolios/${portfolioId}/assets/bulk`,
        formData,
        {
          onUploadProgress: (progressEvent: any) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          },
        }
      );

      // Refresh assets
      loadAssets();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [portfolioId, apiClient, loadAssets]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, [handleFileUpload]);

  // Delete selected assets
  const deleteSelected = useCallback(async () => {
    const confirmed = window.confirm(
      `Delete ${selectedAssets.size} asset(s)?`
    );
    if (!confirmed) return;

    try {
      for (const assetId of selectedAssets) {
        await apiClient.delete(
          `/portfolios/${portfolioId}/assets/${assetId}`
        );
      }
      setSelectedAssets(new Set());
      loadAssets();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [selectedAssets, portfolioId, apiClient, loadAssets]);

  // Toggle asset selection
  const toggleAssetSelection = useCallback((assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  }, [selectedAssets]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Asset Manager</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <AssetSearchBar
          onSearch={(query) => setFilters({ ...filters, query })}
          onFilterChange={setFilters}
          availableTags={availableTags}
          currentFilters={filters}
        />
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg m-6 p-8 text-center bg-white hover:border-blue-400 transition"
      >
        {uploading ? (
          <AssetUploadProgress progress={uploadProgress} />
        ) : (
          <>
            <Upload className="mx-auto mb-4 text-gray-400" size={40} />
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              id="file-input"
              onChange={(e) => {
                if (e.target.files) {
                  handleFileUpload(Array.from(e.target.files));
                }
              }}
            />
            <label htmlFor="file-input" className="text-blue-600 cursor-pointer">
              Select files
            </label>
          </>
        )}
      </div>

      {/* Actions Bar */}
      {selectedAssets.size > 0 && (
        <div className="bg-blue-50 border-b p-4 flex justify-between items-center">
          <span className="text-gray-700">
            {selectedAssets.size} asset(s) selected
          </span>
          <button
            onClick={deleteSelected}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <Trash2 size={16} className="inline mr-2" />
            Delete
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500">No assets found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <AssetGridView
            assets={assets}
            selectedAssets={selectedAssets}
            onSelectAsset={toggleAssetSelection}
            onAssetClick={(asset) => setSelectedAsset(asset)}
            formatFileSize={formatFileSize}
          />
        ) : (
          <AssetListView
            assets={assets}
            selectedAssets={selectedAssets}
            onSelectAsset={toggleAssetSelection}
            onAssetClick={(asset) => setSelectedAsset(asset)}
            formatFileSize={formatFileSize}
          />
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onShowVersionHistory={() => setShowVersionHistory(true)}
          portfolioId={portfolioId}
        />
      )}

      {/* Version History Modal */}
      {showVersionHistory && selectedAsset && (
        <AssetVersionHistory
          assetId={selectedAsset.id}
          portfolioId={portfolioId}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
};

// Asset Detail Modal Component
interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
  onShowVersionHistory: () => void;
  portfolioId: string;
}

const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onShowVersionHistory,
  portfolioId,
}) => {
  const [tags, setTags] = useState<string[]>(asset.tags || []);
  const [newTag, setNewTag] = useState('');

  const addTag = async () => {
    if (!newTag.trim()) return;

    try {
      await apiClient.post(
        `/portfolios/${portfolioId}/assets/${asset.id}/tags`,
        { tag: newTag }
      );
      setTags([...tags, newTag]);
      setNewTag('');
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const removeTag = async (tag: string) => {
    try {
      await apiClient.delete(
        `/portfolios/${portfolioId}/assets/${asset.id}/tags/${tag}`
      );
      setTags(tags.filter(t => t !== tag));
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{asset.file_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview */}
          {asset.preview_url && (
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={asset.preview_url}
                alt={asset.file_name}
                className="w-full h-96 object-contain"
              />
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-semibold">{asset.asset_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Size</p>
              <p className="font-semibold">
                {Math.round(asset.file_size / 1024)} KB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-semibold">
                {new Date(asset.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">MIME Type</p>
              <p className="font-semibold text-sm">{asset.mime_type}</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
                className="flex-1 px-3 py-2 border rounded"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onShowVersionHistory}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Clock size={16} />
              Version History
            </button>
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2">
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetManager;
