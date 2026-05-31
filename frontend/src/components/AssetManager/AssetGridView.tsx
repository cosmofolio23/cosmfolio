/**
 * Asset Grid View Component
 * Displays assets in grid layout with thumbnails
 */

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Image as ImageIcon, File } from 'lucide-react';

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

interface AssetGridViewProps {
  assets: Asset[];
  selectedAssets: Set<string>;
  onSelectAsset: (assetId: string) => void;
  onAssetClick: (asset: Asset) => void;
  formatFileSize: (bytes: number) => string;
}

export const AssetGridView: React.FC<AssetGridViewProps> = ({
  assets,
  selectedAssets,
  onSelectAsset,
  onAssetClick,
  formatFileSize,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer group"
          onClick={() => onAssetClick(asset)}
        >
          {/* Checkbox */}
          <div
            className="absolute top-2 left-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onSelectAsset(asset.id);
            }}
          >
            <Checkbox
              checked={selectedAssets.has(asset.id)}
              onChange={() => {}}
            />
          </div>

          {/* Thumbnail */}
          <div className="bg-gray-100 h-48 flex items-center justify-center overflow-hidden relative">
            {asset.preview_url ? (
              <img
                src={asset.preview_url}
                alt={asset.file_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                {asset.mime_type.startsWith('image') ? (
                  <ImageIcon size={32} />
                ) : (
                  <File size={32} />
                )}
                <p className="text-xs mt-2">{asset.asset_type}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition" />
          </div>

          {/* Info */}
          <div className="p-3">
            <p className="font-semibold text-sm truncate">{asset.file_name}</p>
            <p className="text-xs text-gray-500">
              {formatFileSize(asset.file_size)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(asset.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
