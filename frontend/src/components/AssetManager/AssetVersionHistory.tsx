/**
 * Asset Version History Component
 * Shows version history and allows restoration
 */

import React, { useState, useEffect } from 'react';
import { Clock, Download, RotateCw } from 'lucide-react';
import { APIClient, apiClient } from '@/lib/api';

interface Version {
  version_num: number;
  file_size: number;
  mime_type: string;
  version_notes?: string;
  created_at: string;
}

interface AssetVersionHistoryProps {
  assetId: string;
  portfolioId: string;
  onClose: () => void;
}

export const AssetVersionHistory: React.FC<AssetVersionHistoryProps> = ({
  assetId,
  portfolioId,
  onClose,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  

  // Load versions
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const response = await apiClient.get(
          `/portfolios/${portfolioId}/assets/${assetId}/versions`
        );
        setVersions(response.data.versions || []);
      } catch (error) {
        console.error('Failed to load versions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [assetId, portfolioId, apiClient]);

  // Restore version
  const handleRestore = async (versionNum: number) => {
    const confirmed = window.confirm(
      `Restore to version ${versionNum}? Current version will be kept in history.`
    );
    if (!confirmed) return;

    setRestoring(versionNum);
    try {
      await apiClient.post(
        `/portfolios/${portfolioId}/assets/${assetId}/versions/${versionNum}/restore`
      );
      // Reload versions
      const response = await apiClient.get(
        `/portfolios/${portfolioId}/assets/${assetId}/versions`
      );
      setVersions(response.data.versions || []);
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setRestoring(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold">Version History</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading versions...</p>
          ) : versions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No versions found</p>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div
                  key={version.version_num}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-lg">
                        Version {version.version_num}
                      </p>
                      {version.version_notes && (
                        <p className="text-sm text-gray-600">
                          {version.version_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatFileSize(version.file_size)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(version.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 flex items-center justify-center gap-2">
                      <Download size={14} />
                      Download
                    </button>
                    {version.version_num > 1 && (
                      <button
                        onClick={() => handleRestore(version.version_num)}
                        disabled={restoring === version.version_num}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <RotateCw size={14} />
                        {restoring === version.version_num
                          ? 'Restoring...'
                          : 'Restore'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
