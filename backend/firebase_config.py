import firebase_admin
from firebase_admin import credentials, auth
from config import settings
import os
import json

# Firebase service account key from environment
firebase_key = None

try:
    # Try to load from environment variable
    firebase_key_str = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')

    if firebase_key_str:
        # Clean up the string in case it's wrapped in quotes
        firebase_key_str = firebase_key_str.strip()
        if (firebase_key_str.startswith("'") and firebase_key_str.endswith("'")) or \
           (firebase_key_str.startswith('"') and firebase_key_str.endswith('"')):
            firebase_key_str = firebase_key_str[1:-1]
        
        # If the string contains literal '\n' characters, json.loads handles it natively if it's properly escaped.
        # However, Render sometimes injects real newlines into JSON strings. json.loads natively handles both.
        try:
            firebase_key = json.loads(firebase_key_str)
        except json.JSONDecodeError as e:
            print(f"[WARNING] JSONDecodeError parsing Firebase key: {e}")
            # Try to fix unescaped newlines in private_key
            import re
            fixed_str = re.sub(r'\\n', r'\\\\n', firebase_key_str)
            try:
                firebase_key = json.loads(fixed_str)
            except Exception as e2:
                print(f"[WARNING] Secondary parse failed: {e2}")
    else:
        print("[WARNING] FIREBASE_SERVICE_ACCOUNT_KEY not set")
except Exception as e:
    print(f"[WARNING] Error loading Firebase key: {e}")

# Initialize Firebase Admin SDK
firebase_app = None

try:
    if firebase_key:
        cred = credentials.Certificate(firebase_key)
        firebase_app = firebase_admin.initialize_app(cred)
        print("[OK] Firebase Admin SDK initialized")
    else:
        print("[WARNING] Firebase Admin SDK not initialized - FIREBASE_SERVICE_ACCOUNT_KEY not provided")
except Exception as e:
    print(f"[ERROR] Firebase initialization failed: {e}")
    import traceback
    traceback.print_exc()

def get_firebase_app():
    return firebase_app

def verify_firebase_token(token: str):
    """Verify Firebase ID token"""
    try:
        if not firebase_app:
            raise Exception("Firebase not initialized")
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise Exception(f"Token verification failed: {e}")
