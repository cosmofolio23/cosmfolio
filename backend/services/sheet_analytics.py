"""
Sheet Analytics & Insights Service
Phase 8: Task 8.9 — Template usage, time-per-sheet, AI generation stats,
export preferences, student and college-level dashboards.
"""

from __future__ import annotations

import logging
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)


class SheetAnalyticsService:
    """Tracks and aggregates usage metrics for presentation sheets."""

    def __init__(self) -> None:
        # In-memory stores; production uses a timeseries DB / analytics table
        self._events: list[dict[str, Any]] = []
        logger.info("SheetAnalyticsService initialised")

    # ── event ingestion ───────────────────────

    def track(self, event_type: str, user_id: str, **payload: Any) -> None:
        """Record a single analytics event."""
        self._events.append({
            "event":     event_type,
            "user_id":   user_id,
            "timestamp": datetime.utcnow().isoformat(),
            **payload,
        })

    # Convenience wrappers
    def track_sheet_created(self, user_id: str, template_id: str, page_size: str) -> None:
        self.track("sheet_created", user_id, template_id=template_id, page_size=page_size)

    def track_sheet_opened(self, user_id: str, sheet_id: str) -> None:
        self.track("sheet_opened", user_id, sheet_id=sheet_id)

    def track_sheet_saved(self, user_id: str, sheet_id: str, edit_duration_s: int) -> None:
        self.track("sheet_saved", user_id, sheet_id=sheet_id, duration_s=edit_duration_s)

    def track_ai_generation(self, user_id: str, generation_type: str, tone: str, length: str) -> None:
        self.track("ai_generation", user_id,
                   generation_type=generation_type, tone=tone, length=length)

    def track_export(self, user_id: str, sheet_id: str, fmt: str, page_size: str) -> None:
        self.track("sheet_export", user_id, sheet_id=sheet_id,
                   format=fmt, page_size=page_size)

    def track_view(self, sheet_id: str, viewer_ip: str, referrer: str = "") -> None:
        self.track("sheet_view", user_id="public",
                   sheet_id=sheet_id, viewer_ip=viewer_ip, referrer=referrer)

    # ── student dashboard ─────────────────────

    def student_dashboard(self, user_id: str, days: int = 30) -> dict[str, Any]:
        """Personal statistics for a student's own sheets."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        events = [
            e for e in self._events
            if e["user_id"] == user_id
            and datetime.fromisoformat(e["timestamp"]) >= cutoff
        ]

        created   = [e for e in events if e["event"] == "sheet_created"]
        saves     = [e for e in events if e["event"] == "sheet_saved"]
        exports   = [e for e in events if e["event"] == "sheet_export"]
        ai_calls  = [e for e in events if e["event"] == "ai_generation"]

        template_counts = Counter(e.get("template_id", "") for e in created)
        export_formats  = Counter(e.get("format", "")      for e in exports)
        ai_types        = Counter(e.get("generation_type","") for e in ai_calls)

        avg_duration = 0
        if saves:
            durations = [e.get("duration_s", 0) for e in saves]
            avg_duration = sum(durations) / len(durations) / 60  # convert to minutes

        return {
            "user_id":                  user_id,
            "period_days":              days,
            "sheets_created":           len(created),
            "total_exports":            len(exports),
            "ai_generations_total":     len(ai_calls),
            "avg_edit_time_min":        round(avg_duration, 1),
            "most_used_template":       template_counts.most_common(1)[0][0] if template_counts else None,
            "export_format_breakdown":  dict(export_formats),
            "ai_generation_breakdown":  dict(ai_types),
            "top_templates": [
                {"template_id": t, "count": c}
                for t, c in template_counts.most_common(5)
            ],
        }

    # ── college / institution dashboard ───────

    def college_dashboard(self, days: int = 30) -> dict[str, Any]:
        """Aggregate statistics across all users (admin view)."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        events = [
            e for e in self._events
            if datetime.fromisoformat(e["timestamp"]) >= cutoff
        ]

        unique_users = len({e["user_id"] for e in events if e["user_id"] != "public"})
        created      = [e for e in events if e["event"] == "sheet_created"]
        exports      = [e for e in events if e["event"] == "sheet_export"]
        ai_calls     = [e for e in events if e["event"] == "ai_generation"]

        template_counts = Counter(e.get("template_id", "") for e in created)
        export_formats  = Counter(e.get("format", "")      for e in exports)

        # Activity by day (last 7 days)
        daily: dict[str, int] = defaultdict(int)
        for e in events:
            day = e["timestamp"][:10]
            daily[day] += 1
        activity = sorted(
            [{"date": d, "events": c} for d, c in daily.items()],
            key=lambda x: x["date"],
        )[-7:]

        return {
            "period_days":              days,
            "active_users":             unique_users,
            "total_sheets_created":     len(created),
            "total_exports":            len(exports),
            "total_ai_generations":     len(ai_calls),
            "most_popular_templates": [
                {"template_id": t, "count": c}
                for t, c in template_counts.most_common(5)
            ],
            "export_format_breakdown":  dict(export_formats),
            "activity_last_7_days":     activity,
        }

    # ── per-sheet view stats ───────────────────

    def sheet_view_stats(self, sheet_id: str) -> dict[str, Any]:
        views = [e for e in self._events
                 if e["event"] == "sheet_view" and e.get("sheet_id") == sheet_id]
        referrers = Counter(e.get("referrer", "") for e in views)
        return {
            "sheet_id":      sheet_id,
            "total_views":   len(views),
            "unique_ips":    len({e.get("viewer_ip") for e in views}),
            "top_referrers": [
                {"source": r or "Direct", "count": c}
                for r, c in referrers.most_common(5)
            ],
        }


# ─────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────

_analytics: SheetAnalyticsService | None = None


def get_sheet_analytics_service() -> SheetAnalyticsService:
    global _analytics
    if _analytics is None:
        _analytics = SheetAnalyticsService()
    return _analytics
