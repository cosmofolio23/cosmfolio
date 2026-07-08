"""Auth dependency - multi-method fallback auth"""
from fastapi import HTTPException, status, Header
import base64
import json
import os
import time
import requests
import jwt
from config import settings

_GOOGLE_CERTS_CACHE = {
    "certs": {},
    "expires_at": 0
}

def _get_google_public_certs() -> dict:
    """Get Google's public certificates for Firebase ID token verification (with caching)"""
    now = time.time()
    if _GOOGLE_CERTS_CACHE["expires_at"] > now and _GOOGLE_CERTS_CACHE["certs"]:
        return _GOOGLE_CERTS_CACHE["certs"]
        
    try:
        res = requests.get(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
            timeout=10
        )
        if res.status_code == 200:
            certs = res.json()
            _GOOGLE_CERTS_CACHE["certs"] = certs
            # Cache for 1 hour
            _GOOGLE_CERTS_CACHE["expires_at"] = now + 3600
            return certs
    except Exception as e:
        print(f"[ERROR] Failed to fetch Google public certs: {e}")
        
    return _GOOGLE_CERTS_CACHE["certs"] or {}


def verify_firebase_token_fallback(token: str) -> dict:
    """
    Verify Firebase ID token cryptographically using public certificates.
    Useful when the Firebase Admin SDK is not initialized.
    """
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise ValueError("Token missing 'kid' header")
            
        certs = _get_google_public_certs()
        cert_str = certs.get(kid)
        if not cert_str:
            raise ValueError(f"Matching certificate for kid {kid} not found")

        project_id = os.getenv("FIREBASE_PROJECT_ID", "cosmo-folio-62c7f")

        # Google returns X.509 *certificates*, but PyJWT needs a public KEY — passing
        # the certificate string straight to jwt.decode fails on every token. Extract
        # the public key from the certificate first.
        from cryptography.x509 import load_pem_x509_certificate
        public_key = load_pem_x509_certificate(cert_str.encode("utf-8")).public_key()

        decoded = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=project_id,
            issuer=f"https://securetoken.google.com/{project_id}",
            leeway=120
        )
        return {
            "user_id": decoded.get("sub") or decoded.get("uid"),
            "email": decoded.get("email", ""),
            "auth": "firebase_verified_fallback"
        }
    except Exception as e:
        raise ValueError(f"Token verification failed: {e}")


def _decode_jwt_payload(token: str) -> dict:
    """Decode JWT payload without verification - ONLY used in local DEBUG mode"""
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



def _resolve_db_user(token_uid: str, email: str) -> str:
    """Ensure we use the existing database ID if the email already exists."""
    if not email:
        return token_uid
    try:
        from database import supabase
        if not supabase: return token_uid
        res = supabase.table("users").select("id").eq("email", email).execute()
        if res.data:
            return res.data[0]["id"]
        supabase.table("users").upsert({"id": token_uid, "email": email, "updated_at": __import__('datetime').datetime.utcnow().isoformat()}).execute()
        return token_uid
    except Exception as e:
        print(f"[AUTH WARNING] DB sync failed: {e}")
        return token_uid

def get_current_user(authorization: str = Header(None)):

    """Extract and verify token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token"
        )

    token = authorization[7:].strip()
    last_error = "Unknown auth error"
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty token"
        )

    # METHOD 0: Headless Token Bypass (Internal PDF export)
    try:
        unverified_header = jwt.get_unverified_header(token)
        if unverified_header.get('alg') == 'HS256':
            HEADLESS_SECRET = os.environ.get("HEADLESS_SECRET", "super-secret-headless-key")
            payload = jwt.decode(token, HEADLESS_SECRET, algorithms=["HS256"])
            exp = payload.get("exp")
            if exp and time.time() < exp:
                return {
                    "user_id": str(payload.get("user_id")),
                    "email": "headless@internal",
                    "auth": "headless_bypass"
                }
    except Exception:
        pass

    # METHOD 1: Firebase verification (if Firebase is initialized)
    try:
        from firebase_config import firebase_app
        if firebase_app:
            from firebase_admin import auth as firebase_auth
            decoded = firebase_auth.verify_id_token(token)
            token_uid = decoded.get("uid") or decoded.get("sub")
            email = decoded.get("email", "")
            return {
                "user_id": _resolve_db_user(token_uid, email),
                "email": email,
                "auth": "firebase"
            }
    except Exception:
        pass

    # METHOD 2: Firebase Cryptographic Fallback (using Google's certificates directly)
    try:
        verified_user = verify_firebase_token_fallback(token)
        token_uid = verified_user["user_id"]
        email = verified_user.get("email", "")
        return {
            "user_id": _resolve_db_user(token_uid, email),
            "email": email,
            "auth": "firebase_verified_fallback"
        }
    except Exception as e:
        last_error = f"Firebase Fallback Error: {e}"
        print(f"[AUTH ERROR] {last_error}")
        pass

    # METHOD 3: Supabase auth.get_user
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
    except Exception as e:
        last_error = f"{last_error} | Supabase Error: {e}"

    # METHOD 4: Decode JWT payload manually (DEBUG fallback ONLY)
    if settings.DEBUG or os.getenv("DEBUG", "").lower() in ("true", "1", "t"):
        try:
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
            email = payload.get("email", "")

            if user_id and str(user_id) not in ("", "undefined", "null"):
                return {
                    "user_id": str(user_id),
                    "email": email,
                    "auth": "jwt_decoded_debug_fallback"
                }
        except Exception as e:
            last_error = str(e)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Could not validate credentials. Reason: {last_error}"
    )

def get_current_user_optional(authorization: str = Header(None)):
    if not authorization:
        return None
    try:
        return get_current_user(authorization)
    except Exception:
        return None
