"""
Sheet Collaboration Service
Phase 8: Task 8.7 — Share sheets, real-time comments, teacher feedback,
revision markers, and version history.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger(__name__)


class FeedbackStatus(str, Enum):
    OPEN     = "open"
    RESOLVED = "resolved"
    WONT_FIX = "wont_fix"


class RevisionStatus(str, Enum):
    PENDING  = "pending"
    IN_PROGRESS = "in_progress"
    DONE     = "done"


class SheetCollaborationService:
    """Manages sharing, feedback, and version history for presentation sheets."""

    def __init__(self) -> None:
        # In-memory stores; production uses DB tables
        self._shares:    dict[str, dict] = {}
        self._feedback:  dict[str, list] = {}
        self._revisions: dict[str, list] = {}
        self._versions:  dict[str, list] = {}
        logger.info("SheetCollaborationService initialised")

    # ── SHARING ───────────────────────────────

    def create_share_link(
        self,
        sheet_id:       str,
        owner_id:       str,
        allow_comments: bool = True,
        allow_download: bool = False,
        expires_in_days: int = 30,
        password:       Optional[str] = None,
    ) -> dict:
        token  = secrets.token_urlsafe(24)
        expiry = datetime.utcnow() + timedelta(days=expires_in_days)

        record = {
            "token":         token,
            "sheet_id":      sheet_id,
            "owner_id":      owner_id,
            "allow_comments": allow_comments,
            "allow_download": allow_download,
            "expires_at":    expiry.isoformat(),
            "password_hash": hashlib.sha256(password.encode()).hexdigest() if password else None,
            "view_count":    0,
            "created_at":    datetime.utcnow().isoformat(),
        }
        self._shares[token] = record
        logger.info("Share link created: sheet=%s token=%s", sheet_id, token)

        return {
            **record,
            "share_url": f"https://cosmofolio.com/sheets/shared/{token}",
        }

    def resolve_share(self, token: str, password: Optional[str] = None) -> dict:
        record = self._shares.get(token)
        if not record:
            raise ValueError("Invalid share link")

        if datetime.fromisoformat(record["expires_at"]) < datetime.utcnow():
            raise ValueError("Share link has expired")

        if record["password_hash"]:
            if not password:
                raise ValueError("Password required")
            if hashlib.sha256(password.encode()).hexdigest() != record["password_hash"]:
                raise ValueError("Incorrect password")

        record["view_count"] += 1
        return record

    # ── FEEDBACK ──────────────────────────────

    def add_feedback(
        self,
        sheet_id:    str,
        comment:     str,
        commenter_id: Optional[str] = None,
        element_id:  Optional[str] = None,
        x_pct:       Optional[float] = None,
        y_pct:       Optional[float] = None,
    ) -> dict:
        feedback = {
            "id":           f"fb_{secrets.token_urlsafe(8)}",
            "sheet_id":     sheet_id,
            "commenter_id": commenter_id,
            "comment":      comment,
            "element_id":   element_id,
            "position":     {"x": x_pct, "y": y_pct} if x_pct is not None else None,
            "status":       FeedbackStatus.OPEN.value,
            "created_at":   datetime.utcnow().isoformat(),
            "resolved_at":  None,
        }
        self._feedback.setdefault(sheet_id, []).append(feedback)
        logger.info("Feedback added: sheet=%s", sheet_id)
        return feedback

    def list_feedback(self, sheet_id: str) -> list[dict]:
        return self._feedback.get(sheet_id, [])

    def resolve_feedback(self, sheet_id: str, feedback_id: str) -> dict:
        items = self._feedback.get(sheet_id, [])
        for item in items:
            if item["id"] == feedback_id:
                item["status"]      = FeedbackStatus.RESOLVED.value
                item["resolved_at"] = datetime.utcnow().isoformat()
                return item
        raise ValueError(f"Feedback {feedback_id} not found")

    # ── REVISION MARKERS ──────────────────────

    def mark_for_revision(
        self,
        sheet_id:    str,
        element_id:  str,
        note:        str,
        marked_by:   str,
    ) -> dict:
        revision = {
            "id":         f"rev_{secrets.token_urlsafe(8)}",
            "sheet_id":   sheet_id,
            "element_id": element_id,
            "note":       note,
            "marked_by":  marked_by,
            "status":     RevisionStatus.PENDING.value,
            "created_at": datetime.utcnow().isoformat(),
        }
        self._revisions.setdefault(sheet_id, []).append(revision)
        return revision

    def update_revision_status(
        self, sheet_id: str, revision_id: str, status: str
    ) -> dict:
        items = self._revisions.get(sheet_id, [])
        for item in items:
            if item["id"] == revision_id:
                item["status"] = status
                return item
        raise ValueError(f"Revision marker {revision_id} not found")

    def list_revisions(self, sheet_id: str) -> list[dict]:
        return self._revisions.get(sheet_id, [])

    # ── VERSION HISTORY ───────────────────────

    def save_version(
        self,
        sheet_id: str,
        content:  dict,
        saved_by: str,
        label:    Optional[str] = None,
    ) -> dict:
        versions = self._versions.setdefault(sheet_id, [])
        version_no = len(versions) + 1
        entry = {
            "version":    version_no,
            "sheet_id":   sheet_id,
            "content":    content,          # snapshot of elements
            "saved_by":   saved_by,
            "label":      label or f"Version {version_no}",
            "created_at": datetime.utcnow().isoformat(),
        }
        versions.append(entry)
        logger.info("Version %d saved: sheet=%s", version_no, sheet_id)
        return entry

    def list_versions(self, sheet_id: str) -> list[dict]:
        """Return version stubs (without full content payload)."""
        return [
            {k: v for k, v in entry.items() if k != "content"}
            for entry in self._versions.get(sheet_id, [])
        ]

    def restore_version(self, sheet_id: str, version_no: int) -> dict:
        for entry in self._versions.get(sheet_id, []):
            if entry["version"] == version_no:
                logger.info("Restoring version %d: sheet=%s", version_no, sheet_id)
                return {"sheet_id": sheet_id, "content": entry["content"],
                        "restored_from_version": version_no}
        raise ValueError(f"Version {version_no} not found for sheet {sheet_id}")

    # ── TEACHER FEEDBACK WORKFLOW ─────────────

    def send_for_review(
        self,
        sheet_id: str,
        student_id: str,
        reviewer_email: str,
        message: str,
    ) -> dict:
        token = secrets.token_urlsafe(20)
        review_request = {
            "token":          token,
            "sheet_id":       sheet_id,
            "student_id":     student_id,
            "reviewer_email": reviewer_email,
            "message":        message,
            "status":         "pending",
            "review_url":     f"https://cosmofolio.com/review/{token}",
            "created_at":     datetime.utcnow().isoformat(),
        }
        # TODO: send email to reviewer_email with review_url
        logger.info("Review request sent: sheet=%s to=%s", sheet_id, reviewer_email)
        return review_request


# ─────────────────────────────────────────────
# SINGLETON
# ─────────────────────────────────────────────

_collab: SheetCollaborationService | None = None


def get_sheet_collaboration_service() -> SheetCollaborationService:
    global _collab
    if _collab is None:
        _collab = SheetCollaborationService()
    return _collab
