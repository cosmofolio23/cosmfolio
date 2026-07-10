import imageCompression from 'browser-image-compression';

/**
 * Checks if an image file has a transparent background by drawing a scaled-down
 * version to a canvas and checking the alpha channel of the pixels.
 * This is a fast heuristic.
 */
async function hasTransparency(file: File): Promise<boolean> {
  if (file.type !== 'image/png' && file.type !== 'image/webp' && file.type !== 'image/gif') {
    return false; // JPEGs don't have transparency
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      // Create a small canvas to check for transparency quickly
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        URL.revokeObjectURL(url);
        return resolve(false); // Fallback if no canvas context
      }

      // Scale down to max 100x100 for very fast checking
      const scale = Math.min(100 / img.width, 100 / img.height, 1);
      const width = Math.max(1, Math.floor(img.width * scale));
      const height = Math.max(1, Math.floor(img.height * scale));

      canvas.width = width;
      canvas.height = height;
      
      // Draw image
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const imageData = ctx.getImageData(0, 0, width, height).data;
        let isTransparent = false;
        
        // Check alpha channel (every 4th byte)
        for (let i = 3; i < imageData.length; i += 4) {
          if (imageData[i] < 255) {
            isTransparent = true;
            break;
          }
        }
        
        URL.revokeObjectURL(url);
        resolve(isTransparent);
      } catch (err) {
        URL.revokeObjectURL(url);
        resolve(false); // CORS or other error fallback
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
  });
}

export interface CompressOptions {
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  isAvatar?: boolean;
}

/**
 * Compresses an image for upload. 
 * Converts opaque images to JPEG for massive space savings, 
 * but preserves PNGs with transparent backgrounds.
 */
export async function compressImageForPrint(file: File, options: CompressOptions = {}): Promise<File> {
  try {
    // Determine max size based on use case.
    // Avatars don't need to be print quality.
    const maxSizeMB = options.isAvatar ? 0.3 : 3; 
    const maxWidthOrHeight = options.isAvatar ? 500 : (options.maxWidthOrHeight || 4000);

    // Check if the image has transparency
    const transparent = await hasTransparency(file);

    const compressionOptions = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: options.useWebWorker ?? true,
      // If it's a PNG/WEBP with transparency, keep it as its original type to preserve alpha.
      // If it's an opaque PNG, convert it to JPEG to save a massive amount of space.
      fileType: transparent ? file.type : 'image/jpeg', 
      initialQuality: 0.9, // 90% quality for excellent print resolution
    };

    const compressedFile = await imageCompression(file, compressionOptions);
    
    // browser-image-compression might return a Blob, ensure we return a File with the correct name/type
    const newFileName = transparent ? file.name : file.name.replace(/\.[^/.]+$/, ".jpg");
    return new File([compressedFile], newFileName, { type: compressionOptions.fileType });
    
  } catch (error) {
    console.error("Error compressing image:", error);
    // If compression fails for any reason, return the original file to not break the upload
    return file;
  }
}
