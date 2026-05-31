/**
 * Asset Upload Progress Component
 * Shows upload progress bar and status
 */

import React from 'react';
import { Upload } from 'lucide-react';

interface AssetUploadProgressProps {
  progress: number;
}

export const AssetUploadProgress: React.FC<AssetUploadProgressProps> = ({
  progress,
}) => {
  return (
    <div className="flex flex-col items-center">
      <Upload className="mb-4 text-blue-600 animate-pulse" size={40} />
      <p className="text-gray-600 mb-4">Uploading assets...</p>
      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">{progress}%</p>
    </div>
  );
};
