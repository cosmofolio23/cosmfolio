"""
Entitlements — the access gate for the three products.

Model (confirmed with product owner):
  • Portfolio (standalone purchase) — portfolios saved to dashboard, per-product uploads.
  • Sheet     (standalone purchase) — sheets saved to dashboard, per-product uploads.
  • Library   (premium)            — SUPERSET: includes Portfolio + Sheet, and everything
                                     created lives in the unified project store.

Billing does not exist yet. So:
  • This module is the real gate (routes depend on it), but
  • when a user has no `user_entitlements` row, we DEFAULT-GRANT (controlled by
    DEFAULT_ENTITLEMENTS_GRANT_ALL) so nothing breaks before a paywall ships.
  • When billing arrives, write rows into `user_entitlements` and flip the env flag
    to "false" — no route changes needed.
"""

import os
from functools import lru_cache
from fastapi import Depends, HTTPException, status

from database import supabase
from routes.deps import get_current_user

# Pre-paywall default. Set to "false" once real billing populates user_entitlements.
_GRANT_ALL_BY_DEFAULT = os.getenv("DEFAULT_ENTITLEMENTS_GRANT_ALL", "true").lower() == "true"

Entitlements = dict  # {"portfolio": bool, "sheet": bool, "library": bool}


def _default_entitlements() -> Entitlements:
    g = _GRANT_ALL_BY_DEFAULT
    return {"portfolio": g, "sheet": g, "library": g}


def get_user_entitlements(user_id: str) -> Entitlements:
    """Resolve a user's effective entitlements, applying the superset rule
    (library implies portfolio + sheet). Falls back to default-grant when there
    is no row (pre-paywall) or when the lookup fails (fail-open by design — we are
    not gating revenue yet and must not lock people out)."""
    if not user_id:
        return _default_entitlements()

    try:
        resp = (
            supabase.table("user_entitlements")
            .select("has_portfolio, has_sheet, has_library")
            .eq("user_id", user_id)
            .execute()
        )
    except Exception:
        # table may not exist yet in some environments, or transient error
        return _default_entitlements()

    if not resp.data:
        return _default_entitlements()

    row = resp.data[0]
    has_library = bool(row.get("has_library"))
    return {
        # library is a superset — it unlocks both generators
        "portfolio": bool(row.get("has_portfolio")) or has_library,
        "sheet": bool(row.get("has_sheet")) or has_library,
        "library": has_library,
    }


def require_entitlement(feature: str):
    """FastAPI dependency factory. Usage:

        @router.post(..., dependencies=[Depends(require_entitlement("library"))])

    or to also receive the user:

        user = Depends(get_current_user)
        _gate = Depends(require_entitlement("library"))
    """

    def _checker(current_user: dict = Depends(get_current_user)) -> dict:
        ent = get_user_entitlements(current_user["user_id"])
        if not ent.get(feature, False):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "entitlement_required",
                    "feature": feature,
                    "message": f"This feature requires the {feature.capitalize()} plan.",
                },
            )
        return current_user

    return _checker


# Convenience pre-built dependencies
require_library = require_entitlement("library")
require_portfolio = require_entitlement("portfolio")
require_sheet = require_entitlement("sheet")
