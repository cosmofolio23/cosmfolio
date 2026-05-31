"""
Image optimization API endpoints
Phase 2: Task 2.6 - Image compression and format conversion
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from typing import List, Optional
from fastapi.responses import StreamingResponse

from routes.deps import get_current_user
from services.optimization import (
    get_optimization_service,
    ImageFormat,
    OptimizationLevel,
)
from error_handlers import (
    ResourceNotFoundException,
    AuthorizationException,
)
from database import supabase

router = APIRouter()

# ==================== FORMAT CONVERSION ====================

@router.post("/{portfolio_id}/optimize/convert-webp")
async def convert_to_webp(
    portfolio_id: str,
    file: UploadFile = File(...),
    quality: int = Query(75, ge=20, le=95),
    current_user: dict = Depends(get_current_user)
):
    """
    Convert image to WebP format

    Parameters:
    - **quality**: Compression quality (20-95, default 75)
    - **Returns**: WebP image with stats
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Read and convert
        file_data = await file.read()
        optimization_service = get_optimization_service()
        webp_data = await optimization_service.convert_to_webp(file_data, quality=quality)

        # Get stats
        stats = await optimization_service.get_optimization_stats(
            len(file_data),
            len(webp_data),
            "webp"
        )

        return {
            "format": "webp",
            "quality": quality,
            "original_file": file.filename,
            "original_size_kb": round(len(file_data) / 1024, 2),
            "optimized_size_kb": round(len(webp_data) / 1024, 2),
            "reduction_percent": stats["reduction_percent"],
            "saved_kb": stats["saved_kb"],
            "efficiency": stats["efficiency"],
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== ADAPTIVE COMPRESSION ====================

@router.post("/{portfolio_id}/optimize/adaptive")
async def optimize_adaptive(
    portfolio_id: str,
    file: UploadFile = File(...),
    target_size_kb: float = Query(200, ge=10),
    format: str = Query("webp", regex="^(webp|jpeg)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Adaptively compress image to target size

    Parameters:
    - **target_size_kb**: Target file size in KB
    - **format**: webp or jpeg
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Optimize
        file_data = await file.read()
        optimization_service = get_optimization_service()

        result = await optimization_service.optimize_for_size(
            file_data,
            target_size_kb,
            ImageFormat(format)
        )

        return {
            "original_file": file.filename,
            "original_size_kb": round(len(file_data) / 1024, 2),
            "target_size_kb": target_size_kb,
            "optimized_size_kb": result["size_kb"],
            "quality": result["quality"],
            "meets_target": result["meets_target"],
            "format": format,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== RESIZE & OPTIMIZE ====================

@router.post("/{portfolio_id}/optimize/resize")
async def resize_and_optimize(
    portfolio_id: str,
    file: UploadFile = File(...),
    width: int = Query(1200, ge=50),
    height: int = Query(1200, ge=50),
    quality: str = Query("medium", regex="^(low|medium|high)$"),
    format: str = Query("webp", regex="^(webp|jpeg|png)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Resize and optimize image in one operation

    Parameters:
    - **width**: Target width in pixels
    - **height**: Target height in pixels
    - **quality**: low, medium, high
    - **format**: webp, jpeg, png
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Resize and optimize
        file_data = await file.read()
        optimization_service = get_optimization_service()

        result = await optimization_service.resize_and_optimize(
            file_data,
            width,
            height,
            OptimizationLevel(quality),
            ImageFormat(format)
        )

        return {
            "original_file": file.filename,
            "original_size_kb": round(len(file_data) / 1024, 2),
            "original_dimensions": "unknown",
            "optimized_dimensions": f"{result['width']}x{result['height']}",
            "optimized_size_kb": result["size_kb"],
            "quality": quality,
            "format": format,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== BATCH OPTIMIZATION ====================

@router.post("/{portfolio_id}/optimize/batch")
async def optimize_batch(
    portfolio_id: str,
    files: List[UploadFile] = File(...),
    quality: str = Query("medium", regex="^(low|medium|high)$"),
    format: str = Query("webp", regex="^(webp|jpeg)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Optimize multiple images at once

    Parameters:
    - **files**: Multiple image files
    - **quality**: low, medium, high
    - **format**: webp or jpeg
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Prepare images
        images = []
        for file in files:
            data = await file.read()
            images.append({"data": data, "name": file.filename})

        # Optimize batch
        optimization_service = get_optimization_service()
        result = await optimization_service.optimize_batch(
            images,
            OptimizationLevel(quality),
            ImageFormat(format)
        )

        return {
            "total_files": len(files),
            "results": result["results"],
            "total_original_kb": result["total_original_kb"],
            "total_optimized_kb": result["total_optimized_kb"],
            "total_reduction_percent": result["total_reduction_percent"],
            "quality": quality,
            "format": format,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== COMPRESSION STATS ====================

@router.post("/{portfolio_id}/optimize/stats")
async def get_compression_stats(
    portfolio_id: str,
    file: UploadFile = File(...),
    quality: str = Query("medium", regex="^(low|medium|high)$"),
    format: str = Query("webp", regex="^(webp|jpeg|png|avif)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get compression statistics for an image

    Shows what compression would achieve without actually saving
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        # Get compression stats
        file_data = await file.read()
        optimization_service = get_optimization_service()

        result = await optimization_service.compress_image(
            file_data,
            OptimizationLevel(quality),
            ImageFormat(format)
        )

        stats = await optimization_service.get_optimization_stats(
            result["original_size_bytes"],
            result["optimized_size_bytes"],
            format
        )

        return {
            "original_file": file.filename,
            "original_size_kb": stats["original_size_kb"],
            "predicted_size_kb": stats["optimized_size_kb"],
            "predicted_reduction_percent": stats["reduction_percent"],
            "predicted_saved_kb": stats["saved_kb"],
            "efficiency": stats["efficiency"],
            "quality_level": quality,
            "target_format": format,
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== OPTIMIZATION RECOMMENDATIONS ====================

@router.post("/{portfolio_id}/optimize/recommend")
async def get_optimization_recommendations(
    portfolio_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Get optimization recommendations for an image

    Analyzes image and suggests best format and quality
    """
    try:
        # Verify portfolio ownership
        portfolio = supabase.table("portfolios").select("*").eq("id", portfolio_id).execute()

        if not portfolio.data:
            raise ResourceNotFoundException("Portfolio", portfolio_id)

        if portfolio.data[0]["user_id"] != current_user["user_id"]:
            raise AuthorizationException()

        file_data = await file.read()
        original_size_kb = len(file_data) / 1024

        # Test different formats
        optimization_service = get_optimization_service()
        recommendations = []

        # Test WebP
        try:
            webp_result = await optimization_service.compress_image(
                file_data,
                OptimizationLevel.medium,
                ImageFormat.webp
            )
            recommendations.append({
                "format": "webp",
                "size_kb": round(webp_result["optimized_size_bytes"] / 1024, 2),
                "reduction_percent": webp_result["reduction_percent"],
                "score": round(webp_result["reduction_percent"], 1),
                "recommended": True,  # WebP is usually best
            })
        except Exception:
            pass

        # Test JPEG
        try:
            jpeg_result = await optimization_service.compress_image(
                file_data,
                OptimizationLevel.medium,
                ImageFormat.jpeg
            )
            recommendations.append({
                "format": "jpeg",
                "size_kb": round(jpeg_result["optimized_size_bytes"] / 1024, 2),
                "reduction_percent": jpeg_result["reduction_percent"],
                "score": round(jpeg_result["reduction_percent"] * 0.8, 1),  # Penalize JPEG slightly
            })
        except Exception:
            pass

        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)

        return {
            "original_file": file.filename,
            "original_size_kb": round(original_size_kb, 2),
            "recommendations": recommendations,
            "best_format": recommendations[0]["format"] if recommendations else "webp",
        }

    except (ResourceNotFoundException, AuthorizationException):
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
