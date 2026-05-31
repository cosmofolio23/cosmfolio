"""
Image optimization service
Phase 2: Task 2.6 - Image compression, format conversion, optimization
"""

import logging
from typing import Dict, Any, Optional, Tuple
from io import BytesIO
from enum import Enum

from PIL import Image

logger = logging.getLogger(__name__)

# ==================== ENUMS ====================

class ImageFormat(str, Enum):
    """Supported image formats"""
    webp = "webp"
    jpeg = "jpeg"
    png = "png"
    avif = "avif"


class OptimizationLevel(str, Enum):
    """Optimization levels"""
    low = "low"
    medium = "medium"
    high = "high"


# ==================== CONFIGURATION ====================

class OptimizationConfig:
    """Image optimization configuration"""

    # Quality settings per format
    QUALITY_SETTINGS = {
        "webp": {
            "low": 60,
            "medium": 75,
            "high": 85,
        },
        "jpeg": {
            "low": 70,
            "medium": 80,
            "high": 90,
        },
        "png": {
            "low": None,  # PNG doesn't use quality
            "medium": None,
            "high": None,
        },
        "avif": {
            "low": 55,
            "medium": 70,
            "high": 80,
        },
    }

    # File size targets (KB)
    SIZE_TARGETS = {
        "thumb-250": 50,    # 50KB target
        "thumb-500": 100,   # 100KB target
        "preview-1200": 300, # 300KB target
        "original": 1000,   # 1MB target
    }

    # Compression settings
    WEBP_METHOD = 6  # 0-6, higher = slower but better compression
    JPEG_PROGRESSIVE = True
    PNG_OPTIMIZE = True

    # Resize settings
    RESAMPLE_FILTER = Image.Resampling.LANCZOS


# ==================== OPTIMIZATION SERVICE ====================

class ImageOptimizationService:
    """Optimize images for web delivery"""

    def __init__(self):
        """Initialize optimization service"""
        self.config = OptimizationConfig()

    # ==================== FORMAT CONVERSION ====================

    async def convert_to_webp(
        self,
        image_data: bytes,
        quality: int = 75,
        method: Optional[int] = None
    ) -> bytes:
        """
        Convert image to WebP format

        WebP provides ~30% better compression than JPEG
        """
        try:
            if method is None:
                method = self.config.WEBP_METHOD

            image = Image.open(BytesIO(image_data))

            # Convert to RGB if needed
            if image.mode in ("RGBA", "LA", "P"):
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                image = rgb_image

            # Save as WebP
            output = BytesIO()
            image.save(
                output,
                format="WEBP",
                quality=quality,
                method=method,
            )
            output.seek(0)

            original_size = len(image_data)
            optimized_size = len(output.getvalue())
            reduction = round((1 - optimized_size / original_size) * 100, 1)

            logger.info(f"WebP conversion: {original_size}B → {optimized_size}B ({reduction}% reduction)")

            return output.getvalue()

        except Exception as e:
            logger.error(f"Error converting to WebP: {str(e)}")
            raise

    async def convert_to_avif(
        self,
        image_data: bytes,
        quality: int = 70
    ) -> Optional[bytes]:
        """
        Convert image to AVIF format (modern, better compression than WebP)

        Returns None if AVIF conversion not supported
        """
        try:
            image = Image.open(BytesIO(image_data))

            # Convert to RGB if needed
            if image.mode in ("RGBA", "LA", "P"):
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                image = rgb_image

            # Try to save as AVIF
            output = BytesIO()
            try:
                image.save(
                    output,
                    format="AVIF",
                    quality=quality,
                )
                output.seek(0)

                original_size = len(image_data)
                optimized_size = len(output.getvalue())
                reduction = round((1 - optimized_size / original_size) * 100, 1)

                logger.info(f"AVIF conversion: {original_size}B → {optimized_size}B ({reduction}% reduction)")

                return output.getvalue()

            except Exception:
                # AVIF not supported by PIL
                logger.warning("AVIF not supported, falling back to WebP")
                return None

        except Exception as e:
            logger.error(f"Error converting to AVIF: {str(e)}")
            return None

    async def convert_to_jpeg(
        self,
        image_data: bytes,
        quality: int = 80,
        progressive: bool = True
    ) -> bytes:
        """
        Convert image to JPEG format with progressive option

        Progressive JPEGs display faster on slow connections
        """
        try:
            image = Image.open(BytesIO(image_data))

            # Convert to RGB
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Save as JPEG
            output = BytesIO()
            image.save(
                output,
                format="JPEG",
                quality=quality,
                progressive=progressive,
                optimize=True,
            )
            output.seek(0)

            original_size = len(image_data)
            optimized_size = len(output.getvalue())
            reduction = round((1 - optimized_size / original_size) * 100, 1)

            logger.info(f"JPEG conversion: {original_size}B → {optimized_size}B ({reduction}% reduction)")

            return output.getvalue()

        except Exception as e:
            logger.error(f"Error converting to JPEG: {str(e)}")
            raise

    # ==================== COMPRESSION ====================

    async def compress_image(
        self,
        image_data: bytes,
        quality_level: OptimizationLevel = OptimizationLevel.medium,
        target_format: ImageFormat = ImageFormat.webp,
        max_size_kb: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Compress image to specified quality level

        Returns: {format, quality, original_size, optimized_size, reduction_percent}
        """
        try:
            original_size = len(image_data)
            quality = self.config.QUALITY_SETTINGS[target_format.value][quality_level.value]

            # Convert based on format
            if target_format == ImageFormat.webp:
                optimized_data = await self.convert_to_webp(image_data, quality=quality)
            elif target_format == ImageFormat.avif:
                optimized_data = await self.convert_to_avif(image_data, quality=quality)
                if optimized_data is None:
                    # Fallback to WebP
                    optimized_data = await self.convert_to_webp(image_data, quality=quality)
                    target_format = ImageFormat.webp
            elif target_format == ImageFormat.jpeg:
                optimized_data = await self.convert_to_jpeg(image_data, quality=quality)
            else:  # PNG
                # PNG doesn't compress with quality, just optimize
                image = Image.open(BytesIO(image_data))
                output = BytesIO()
                image.save(
                    output,
                    format="PNG",
                    optimize=self.config.PNG_OPTIMIZE,
                )
                output.seek(0)
                optimized_data = output.getvalue()

            optimized_size = len(optimized_data)
            reduction = round((1 - optimized_size / original_size) * 100, 1)

            # Check if meets size target
            if max_size_kb:
                max_bytes = max_size_kb * 1024
                if optimized_size > max_bytes:
                    logger.warning(
                        f"Optimized size {optimized_size}B exceeds target {max_bytes}B, "
                        f"considering further compression"
                    )

            return {
                "format": target_format.value,
                "quality": quality,
                "original_size_bytes": original_size,
                "optimized_size_bytes": optimized_size,
                "reduction_percent": reduction,
                "meets_target": optimized_size <= max_size_kb * 1024 if max_size_kb else True,
                "data": optimized_data,
            }

        except Exception as e:
            logger.error(f"Error compressing image: {str(e)}")
            raise

    # ==================== ADAPTIVE COMPRESSION ====================

    async def optimize_for_size(
        self,
        image_data: bytes,
        target_size_kb: float,
        target_format: ImageFormat = ImageFormat.webp
    ) -> Dict[str, Any]:
        """
        Adaptively compress image to fit target size

        Tries different quality levels until size target is met
        """
        try:
            quality_levels = [
                (OptimizationLevel.high, 85),
                (OptimizationLevel.medium, 75),
                (OptimizationLevel.low, 60),
                (OptimizationLevel.low, 50),
                (OptimizationLevel.low, 40),
            ]

            best_result = None

            for level, custom_quality in quality_levels:
                if target_format == ImageFormat.webp:
                    optimized_data = await self.convert_to_webp(image_data, quality=custom_quality)
                elif target_format == ImageFormat.jpeg:
                    optimized_data = await self.convert_to_jpeg(image_data, quality=custom_quality)
                else:
                    optimized_data = image_data

                optimized_size_kb = len(optimized_data) / 1024

                result = {
                    "format": target_format.value,
                    "quality": custom_quality,
                    "size_kb": round(optimized_size_kb, 2),
                    "target_kb": target_size_kb,
                    "meets_target": optimized_size_kb <= target_size_kb,
                    "data": optimized_data,
                }

                if best_result is None:
                    best_result = result

                if optimized_size_kb <= target_size_kb:
                    best_result = result
                    break

            return best_result

        except Exception as e:
            logger.error(f"Error optimizing for size: {str(e)}")
            raise

    # ==================== RESIZE & OPTIMIZE ====================

    async def resize_and_optimize(
        self,
        image_data: bytes,
        width: int,
        height: int,
        quality_level: OptimizationLevel = OptimizationLevel.medium,
        target_format: ImageFormat = ImageFormat.webp
    ) -> Dict[str, Any]:
        """
        Resize and optimize image in one operation

        Returns: {width, height, format, size_bytes, data}
        """
        try:
            image = Image.open(BytesIO(image_data))

            # Convert to RGB if needed
            if image.mode in ("RGBA", "LA", "P"):
                rgb_image = Image.new("RGB", image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == "RGBA" else None)
                image = rgb_image

            # Resize with aspect ratio preservation
            image.thumbnail((width, height), self.config.RESAMPLE_FILTER)

            # Optimize
            quality = self.config.QUALITY_SETTINGS[target_format.value][quality_level.value]

            output = BytesIO()
            if target_format == ImageFormat.webp:
                image.save(output, format="WEBP", quality=quality, method=self.config.WEBP_METHOD)
            elif target_format == ImageFormat.jpeg:
                image.save(
                    output,
                    format="JPEG",
                    quality=quality,
                    progressive=self.config.JPEG_PROGRESSIVE,
                    optimize=True,
                )
            else:
                image.save(output, format=target_format.value.upper())

            output.seek(0)
            optimized_data = output.getvalue()

            return {
                "width": image.width,
                "height": image.height,
                "format": target_format.value,
                "quality": quality,
                "size_bytes": len(optimized_data),
                "size_kb": round(len(optimized_data) / 1024, 2),
                "data": optimized_data,
            }

        except Exception as e:
            logger.error(f"Error resizing and optimizing: {str(e)}")
            raise

    # ==================== BATCH OPTIMIZATION ====================

    async def optimize_batch(
        self,
        images: list,  # List of {data: bytes, name: str}
        quality_level: OptimizationLevel = OptimizationLevel.medium,
        target_format: ImageFormat = ImageFormat.webp
    ) -> Dict[str, Any]:
        """
        Optimize multiple images

        Returns: {results: [{name, original_size, optimized_size, reduction}], total_reduction}
        """
        try:
            results = []
            total_original = 0
            total_optimized = 0

            for img in images:
                try:
                    result = await self.compress_image(
                        img["data"],
                        quality_level=quality_level,
                        target_format=target_format,
                    )

                    results.append({
                        "name": img.get("name", "unknown"),
                        "original_size_kb": round(result["original_size_bytes"] / 1024, 2),
                        "optimized_size_kb": round(result["optimized_size_bytes"] / 1024, 2),
                        "reduction_percent": result["reduction_percent"],
                    })

                    total_original += result["original_size_bytes"]
                    total_optimized += result["optimized_size_bytes"]

                except Exception as e:
                    logger.error(f"Error optimizing {img.get('name')}: {str(e)}")
                    results.append({
                        "name": img.get("name", "unknown"),
                        "error": str(e),
                    })

            total_reduction = round((1 - total_optimized / total_original) * 100, 1) if total_original > 0 else 0

            return {
                "results": results,
                "total_original_kb": round(total_original / 1024, 2),
                "total_optimized_kb": round(total_optimized / 1024, 2),
                "total_reduction_percent": total_reduction,
            }

        except Exception as e:
            logger.error(f"Error in batch optimization: {str(e)}")
            raise

    # ==================== STATISTICS ====================

    async def get_optimization_stats(
        self,
        original_size: int,
        optimized_size: int,
        format_type: str
    ) -> Dict[str, Any]:
        """
        Get optimization statistics

        Returns: {reduction_percent, saved_kb, efficiency_score}
        """
        reduction_percent = round((1 - optimized_size / original_size) * 100, 1)
        saved_kb = round((original_size - optimized_size) / 1024, 2)

        # Score based on compression efficiency
        if reduction_percent > 50:
            efficiency = "excellent"
        elif reduction_percent > 30:
            efficiency = "good"
        elif reduction_percent > 10:
            efficiency = "fair"
        else:
            efficiency = "minimal"

        return {
            "original_size_kb": round(original_size / 1024, 2),
            "optimized_size_kb": round(optimized_size / 1024, 2),
            "reduction_percent": reduction_percent,
            "saved_kb": saved_kb,
            "format": format_type,
            "efficiency": efficiency,
        }


# ==================== SINGLETON INSTANCE ====================

_optimization_service = None

def get_optimization_service() -> ImageOptimizationService:
    """Get or create optimization service singleton"""
    global _optimization_service
    if _optimization_service is None:
        _optimization_service = ImageOptimizationService()
    return _optimization_service
