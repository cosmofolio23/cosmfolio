from fastapi import APIRouter, HTTPException, status, Header, Depends
from .deps import get_current_user as get_current_user_from_deps
from pydantic import BaseModel
from datetime import datetime
import json
import os
import re
import requests
from firebase_config import verify_firebase_token, firebase_app
from config import settings
from models import UserResponse
from database import supabase

router = APIRouter()


def _sanitize_key(value: str | None) -> str:
    """Strip BOM / non-printable chars that can corrupt an API key when it was
    set via PowerShell (a leading U+FEFF yields 'API key not valid')."""
    return re.sub(r"[^\x20-\x7E]", "", value or "").strip()


class SignInRequest(BaseModel):
    email: str
    password: str
    # Firebase Web API key is a public identifier (already shipped in the
    # frontend bundle). The client may pass it so the backend can proxy the
    # Identity Toolkit call; falls back to the server's configured key.
    api_key: str | None = None


class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str | None = None
    college_name: str | None = None
    state: str | None = None
    year_of_passing: str | None = None
    stream: str | None = None
    api_key: str | None = None

# ==================== Helper Functions ====================

def _decode_jwt_payload(token: str) -> dict:
    """Decode JWT payload without verification"""
    import base64
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        payload_b64 = parts[1]
        payload_b64 += "=" * (4 - len(payload_b64) % 4)
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return {}


def get_current_user_from_token(authorization: str = None):
    """Extract and verify Firebase token from Authorization header (with secure cryptographic fallback)"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Empty token")

    # Method 1: Verify with Firebase Admin SDK
    try:
        from firebase_config import firebase_app
        if firebase_app:
            decoded = verify_firebase_token(token)
            return decoded
    except Exception:
        pass

    # Method 2: Firebase Cryptographic Fallback (using Google's certificates directly)
    try:
        from .deps import verify_firebase_token_fallback
        verified_user = verify_firebase_token_fallback(token)
        return {
            "uid": verified_user["user_id"],
            "email": verified_user["email"],
            "name": ""
        }
    except Exception:
        pass

    # Method 3: Fallback to decoding JWT payload manually (DEBUG fallback ONLY)
    if settings.DEBUG or os.getenv("DEBUG", "").lower() in ("true", "1", "t"):
        try:
            import time
            payload = _decode_jwt_payload(token)
            
            # Check expiration
            exp = payload.get("exp")
            if exp and time.time() > exp:
                raise ValueError("Token has expired")

            user_id = (
                payload.get("sub") or
                payload.get("user_id") or
                payload.get("uid") or
                payload.get("id")
            )
            if user_id and str(user_id) not in ("", "undefined", "null"):
                return {
                    "uid": str(user_id),
                    "email": payload.get("email", ""),
                    "name": payload.get("name", "")
                }
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )

# ==================== Routes ====================

@router.post("/signup")
async def signup(
    email: str,
    password: str,
    name: str = None,
    college_name: str = None,
    state: str = None,
    year_of_passing: str = None,
    stream: str = None,
    authorization: str = Header(None)
):
    """
    Register new user with Firebase Auth
    Note: User creation with password should be done on frontend with Firebase SDK
    This endpoint expects the frontend to have already created the Firebase user
    and sent the ID token in the next request
    """
    try:
        # Get user from authorization header
        decoded_token = get_current_user_from_token(authorization)
        user_id = decoded_token["uid"]

        # Store user info in Supabase database
        if supabase:
            supabase.table("users").insert({
                "id": user_id,
                "email": email,
                "name": name,
                "college_name": college_name,
                "state": state,
                "year_of_passing": year_of_passing,
                "stream": stream,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()

        return {
            "success": True,
            "message": "User created successfully",
            "user_id": user_id,
            "email": email
        }
    except Exception as e:
        error_msg = str(e)
        if "email-already-exists" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

@router.post("/register")
async def register(body: SignUpRequest):
    """
    Server-side email/password registration (Firebase Identity Toolkit proxy).

    Fallback for when the Firebase JS SDK's createUserWithEmailAndPassword is
    blocked by a browser extension / ad blocker (auth/network-request-failed).
    Creates the Firebase user and returns a valid ID token, mirroring the
    /signin fallback.
    """
    api_key = _sanitize_key(body.api_key) or _sanitize_key(settings.FIREBASE_API_KEY)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase API key not configured",
        )

    try:
        resp = requests.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:signUp",
            params={"key": api_key},
            json={
                "email": body.email,
                "password": body.password,
                "returnSecureToken": True,
            },
            timeout=20,
        )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Auth provider unreachable: {e}",
        )

    data = resp.json()

    if resp.status_code != 200:
        msg = (data.get("error", {}) or {}).get("message", "SIGNUP_FAILED")
        if msg == "EMAIL_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists",
            )
        if msg.startswith("WEAK_PASSWORD"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password should be at least 6 characters",
            )
        if msg == "INVALID_EMAIL":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email address",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    user_id = data.get("localId")
    email = data.get("email")
    token = data.get("idToken")

    # Best-effort: create the users row (non-fatal).
    if supabase:
        try:
            supabase.table("users").insert({
                "id": user_id,
                "email": email,
                "name": body.name,
                "college_name": body.college_name,
                "state": body.state,
                "year_of_passing": body.year_of_passing,
                "stream": body.stream,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }).execute()
        except Exception as e:
            print(f"[WARN] register user sync failed (non-fatal): {e}")

    return {
        "success": True,
        "token": token,
        "user_id": user_id,
        "email": email,
        "name": body.name,
        "expires_in": data.get("expiresIn"),
    }


@router.post("/signin")
async def signin(body: SignInRequest):
    """
    Server-side email/password sign-in (Firebase Identity Toolkit proxy).

    The frontend normally signs in directly with the Firebase JS SDK. When a
    user's browser extension / ad blocker blocks the call to
    identitytoolkit.googleapis.com, the SDK throws auth/network-request-failed.
    This endpoint lets the frontend fall back to signing in through the backend
    (which is not behind any client-side blocker), returning a valid Firebase
    ID token the rest of the app already understands.
    """
    api_key = _sanitize_key(body.api_key) or _sanitize_key(settings.FIREBASE_API_KEY)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Firebase API key not configured",
        )

    try:
        resp = requests.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
            params={"key": api_key},
            json={
                "email": body.email,
                "password": body.password,
                "returnSecureToken": True,
            },
            timeout=20,
        )
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Auth provider unreachable: {e}",
        )

    data = resp.json()

    if resp.status_code != 200:
        msg = (data.get("error", {}) or {}).get("message", "SIGNIN_FAILED")
        if msg in ("INVALID_LOGIN_CREDENTIALS", "EMAIL_NOT_FOUND",
                   "INVALID_PASSWORD", "INVALID_EMAIL"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if msg.startswith("TOO_MANY_ATTEMPTS"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please try again later.",
            )
        if msg == "USER_DISABLED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been disabled.",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    user_id = data.get("localId")
    email = data.get("email")
    token = data.get("idToken")

    # Best-effort: ensure a users row exists (non-fatal).
    name = None
    if supabase:
        try:
            existing = supabase.table("users").select("*").eq("id", user_id).execute()
            if existing.data:
                name = existing.data[0].get("name")
            else:
                supabase.table("users").insert({
                    "id": user_id,
                    "email": email,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                }).execute()
        except Exception as e:
            print(f"[WARN] signin user sync failed (non-fatal): {e}")

    return {
        "success": True,
        "token": token,
        "user_id": user_id,
        "email": email,
        "name": name,
        "expires_in": data.get("expiresIn"),
    }


@router.post("/verify-token")
async def verify_token(token: str, display_name: str = None):
    """
    Verify Firebase token and upsert user.
    Accepts optional display_name (from Google profile) so Google sign-in
    users get their real name saved, not NULL.
    """
    try:
        decoded_token = verify_firebase_token(token)
        user_id = decoded_token.get("uid")
        email = decoded_token.get("email")
        # Google tokens carry the profile name in 'name' claim
        token_name = decoded_token.get("name") or display_name

        if supabase:
            user_data = supabase.table("users").select("*").eq("id", user_id).execute()
            if user_data.data:
                existing = user_data.data[0]
                # Backfill name if it was previously NULL
                if token_name and not existing.get("name"):
                    supabase.table("users").update({
                        "name": token_name,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", user_id).execute()
                    existing["name"] = token_name
                return {
                    "success": True,
                    "user": {
                        "id": existing["id"],
                        "email": existing["email"],
                        "name": existing.get("name"),
                        "created_at": existing.get("created_at")
                    }
                }

            # New user — insert with name from Google profile
            supabase.table("users").insert({
                "id": user_id,
                "email": email,
                "name": token_name,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()

        return {
            "success": True,
            "user": {
                "id": user_id,
                "email": email,
                "name": token_name,
                "created_at": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.get("/me")
async def get_current_user(authorization: str = Header(None)):
    """Get current user info from Firebase token"""
    try:
        decoded_token = get_current_user_from_token(authorization)
        user_id = decoded_token.get("uid")
        email = decoded_token.get("email")

        if supabase:
            user_data = supabase.table("users").select("*").eq("id", user_id).execute()
            if user_data.data:
                user = user_data.data[0]
                return UserResponse(
                    id=user["id"],
                    email=user["email"],
                    name=user.get("name"),
                    created_at=datetime.fromisoformat(user.get("created_at"))
                )

        return UserResponse(
            id=user_id,
            email=email,
            name=None,
            created_at=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/logout")
async def logout(authorization: str = Header(None)):
    """Logout (frontend handles token removal)"""
    try:
        get_current_user_from_token(authorization)
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/admin/users")
async def get_admin_users(current_user: dict = Depends(get_current_user_from_deps)):
    """
    Get all registered users for admin dashboard.
    Gated strictly for boseraj001@gmail.com
    """
    if not current_user or current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin access only"
        )
    
    try:
        if not supabase:
            raise Exception("Database connection not available")
            
        # Get users sorted by creation date (newest first)
        result = supabase.table("users").select("*").order("created_at", desc=True).execute()
        return result.data
        
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.post("/admin/users/{user_id}/reset-exports")
async def reset_user_exports(user_id: str, current_user: dict = Depends(get_current_user_from_deps)):
    """Admin only: Reset a user's export count to 0"""
    if not current_user or current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access only")
    try:
        supabase.table("users").update({"export_count": 0}).eq("id", user_id).execute()
        return {"success": True, "message": "Export count reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/admin/users/{user_id}/upgrade")
async def upgrade_user_pro(user_id: str, current_user: dict = Depends(get_current_user_from_deps)):
    """Admin only: Upgrade user to Pro (unlimited exports)"""
    if not current_user or current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access only")
    try:
        supabase.table("users").update({"is_pro": True}).eq("id", user_id).execute()
        return {"success": True, "message": "User upgraded to Pro successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/admin/users/{user_id}/downgrade")
async def downgrade_user_pro(user_id: str, current_user: dict = Depends(get_current_user_from_deps)):
    """Admin only: Downgrade user to Free"""
    if not current_user or current_user.get("email") != "boseraj001@gmail.com":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access only")
    try:
        supabase.table("users").update({"is_pro": False}).eq("id", user_id).execute()
        return {"success": True, "message": "User downgraded successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
