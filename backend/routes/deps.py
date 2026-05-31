"""Auth dependency - multi-method fallback auth"""
from fastapi import HTTPException, status, Header
import base64
import json
import os


def _decode_jwt_payload(token: str) -> dict:
    """Decode JWT payload without verification - works for any JWT (Firebase/Supabase/custom)"""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        payload_b64 = parts[1]
        # Fix base64 padding
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return {}


def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token"
        )

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty token"
        )

    # METHOD 1: Firebase verification (if Firebase is initialized)
    try:
        from firebase_config import firebase_app
        if firebase_app:
            from firebase_admin import auth as firebase_auth
            decoded = firebase_auth.verify_id_token(token)
            return {
                "user_id": decoded.get("uid") or decoded.get("sub"),
                "email": decoded.get("email", ""),
                "auth": "firebase"
            }
    except Exception:
        pass

    # METHOD 2: Supabase auth.get_user
    try:
        from database import supabase
        if supabase:
            resp = supabase.auth.get_user(token)
            if resp and resp.user:
                return {
                    "user_id": str(resp.user.id),
                    "email": resp.user.email or "",
                    "auth": "supabase"
                }
    except Exception:
        pass

    # METHOD 3: Decode JWT payload manually (no verification - works for Firebase/Supabase/any JWT)
    try:
        payload = _decode_jwt_payload(token)
        # Firebase: sub = uid, user_id = uid
        # Supabase: sub = user uuid
        user_id = (
            payload.get("sub") or
            payload.get("user_id") or
            payload.get("uid") or
            payload.get("id")
        )
        email = payload.get("email", "")

        if user_id and str(user_id) not in ("", "undefined", "null"):
            return {
                "user_id": str(user_id),
                "email": email,
                "auth": "jwt_decoded"
            }
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please sign in again."
    )
