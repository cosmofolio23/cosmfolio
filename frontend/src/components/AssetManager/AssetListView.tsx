/**
 * Asset List View Component
 * Displays assets in table layout
 */

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { File, Image as ImageIcon } from 'lucide-react';

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

interface AssetListViewProps {
  assets: Asset[];
  selectedAssets: Set<string>;
  onSelectAsset: (assetId: string) => void;
  onAssetClick: (asset: Asset) => void;
  formatFileSize: (bytes: number) => string;
}

export const AssetListView: React.FC<AssetListViewProps> = ({
  assets,
  selectedAssets,
  onSelectAsset,
  onAssetClick,
  formatFileSize,
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left w-12"></th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              File Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Type
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Size
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => onAssetClick(asset)}
            >
              <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedAssets.has(asset.id)}
                  onChange={() => onSelectAsset(asset.id)}
                />
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  {asset.mime_type.startsWith('image') ? (
                    <ImageIcon size={16} className="text-gray-400" />
                  ) : (
                    <File size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium">{asset.file_name}</span>
                </div>
              </td>
              <td className="px-6 py-3">
                <span className="text-sm text-gray-600">{asset.asset_type}</span>
              </td>
              <td className="px-6 py-3">
                <span className="text-sm text-gray-600">
                  {formatFileSize(asset.file_size)}
                </span>
              </td>
              <td className="px-6 py-3">
                <span className="text-sm text-gray-600">
                  {new Date(asset.created_at).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
