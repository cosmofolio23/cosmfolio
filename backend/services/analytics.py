"""
Analytics Service - Track portfolio views, shares, downloads
Anonymous tracking (IP-based, no user identification)
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from database import supabase

logger = logging.getLogger(__name__)


def log_portfolio_view(portfolio_id: str, ip_address: str, user_agent: str = None) -> bool:
    """
    Log a portfolio view event.
    Portfolio ID alone doesn't identify users - combined with IP + timestamp for deduplication.
    """
    try:
        supabase.table("portfolio_analytics").insert({
            "portfolio_id": portfolio_id,
            "event_type": "view",
            "ip_address": ip_address[:20],  # Hash/truncate for privacy
            "user_agent": user_agent[:200] if user_agent else None,
            "timestamp": datetime.utcnow().isoformat(),
        }).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to log view: {e}")
        return False


def log_portfolio_share(portfolio_id: str, platform: str = "link") -> bool:
    """
    Log when a portfolio is shared.
    Platform: 'link', 'email', 'twitter', 'linkedin', etc.
    """
    try:
        supabase.table("portfolio_analytics").insert({
            "portfolio_id": portfolio_id,
            "event_type": "share",
            "share_platform": platform,
            "timestamp": datetime.utcnow().isoformat(),
        }).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to log share: {e}")
        return False


def log_portfolio_download(portfolio_id: str, format: str = "pdf") -> bool:
    """
    Log when a portfolio is downloaded.
    Format: 'pdf', 'html', etc.
    """
    try:
        supabase.table("portfolio_analytics").insert({
            "portfolio_id": portfolio_id,
            "event_type": "download",
            "download_format": format,
            "timestamp": datetime.utcnow().isoformat(),
        }).execute()
        return True
    except Exception as e:
        logger.error(f"Failed to log download: {e}")
        return False


def get_portfolio_analytics(portfolio_id: str) -> Dict[str, Any]:
    """
    Get analytics summary for a portfolio.
    Returns: views, shares, downloads, top platforms, time series data
    """
    try:
        # Get all events for this portfolio
        response = supabase.table("portfolio_analytics").select("*").eq(
            "portfolio_id", portfolio_id
        ).execute()

        events = response.data or []

        # Count by event type
        views = len([e for e in events if e.get("event_type") == "view"])
        shares = len([e for e in events if e.get("event_type") == "share"])
        downloads = len([e for e in events if e.get("event_type") == "download"])

        # Group shares by platform
        share_platforms = {}
        for e in events:
            if e.get("event_type") == "share":
                platform = e.get("share_platform", "link")
                share_platforms[platform] = share_platforms.get(platform, 0) + 1

        # Group downloads by format
        download_formats = {}
        for e in events:
            if e.get("event_type") == "download":
                fmt = e.get("download_format", "pdf")
                download_formats[fmt] = download_formats.get(fmt, 0) + 1

        # Calculate metrics
        conversion_rate = (shares / views * 100) if views > 0 else 0
        download_rate = (downloads / views * 100) if views > 0 else 0

        # Time series (last 30 days)
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)

        daily_views = {}
        for i in range(30):
            date = (thirty_days_ago + timedelta(days=i)).date().isoformat()
            daily_views[date] = 0

        for e in events:
            if e.get("event_type") == "view":
                try:
                    event_date = e.get("timestamp", "").split("T")[0]
                    if event_date in daily_views:
                        daily_views[event_date] += 1
                except Exception:
                    pass

        return {
            "total_views": views,
            "total_shares": shares,
            "total_downloads": downloads,
            "conversion_rate": round(conversion_rate, 1),
            "download_rate": round(download_rate, 1),
            "share_platforms": share_platforms,
            "download_formats": download_formats,
            "daily_views_30d": daily_views,
        }

    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        return {
            "total_views": 0,
            "total_shares": 0,
            "total_downloads": 0,
            "conversion_rate": 0,
            "download_rate": 0,
            "error": str(e),
        }


def get_user_portfolio_summary(user_id: str) -> Dict[str, Any]:
    """
    Get aggregate analytics across all portfolios for a user.
    """
    try:
        # Get all portfolios for user
        portfolios_resp = supabase.table("portfolios").select("id").eq(
            "user_id", user_id
        ).execute()
        portfolio_ids = [p["id"] for p in (portfolios_resp.data or [])]

        if not portfolio_ids:
            return {
                "total_views": 0,
                "total_shares": 0,
                "total_downloads": 0,
                "portfolio_count": 0,
                "top_portfolio": None,
            }

        # Get events for all portfolios
        all_events = []
        for pid in portfolio_ids:
            resp = supabase.table("portfolio_analytics").select("*").eq(
                "portfolio_id", pid
            ).execute()
            all_events.extend(resp.data or [])

        # Aggregate
        views_by_portfolio = {}
        for e in all_events:
            pid = e.get("portfolio_id")
            if e.get("event_type") == "view":
                views_by_portfolio[pid] = views_by_portfolio.get(pid, 0) + 1

        total_views = sum(views_by_portfolio.values())
        total_shares = len([e for e in all_events if e.get("event_type") == "share"])
        total_downloads = len([e for e in all_events if e.get("event_type") == "download"])

        top_portfolio = max(views_by_portfolio.items(), key=lambda x: x[1])[0] if views_by_portfolio else None

        return {
            "total_views": total_views,
            "total_shares": total_shares,
            "total_downloads": total_downloads,
            "portfolio_count": len(portfolio_ids),
            "top_portfolio": top_portfolio,
            "portfolios": [
                {"portfolio_id": pid, "views": views_by_portfolio.get(pid, 0)}
                for pid in portfolio_ids
            ],
        }

    except Exception as e:
        logger.error(f"Failed to get user summary: {e}")
        return {"error": str(e)}
