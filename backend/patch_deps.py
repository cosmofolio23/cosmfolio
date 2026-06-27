import re
with open('routes/deps.py', 'r') as f:
    content = f.read()

new_logic = '''
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
'''

content = content.replace('def get_current_user(authorization: str = Header(None)):', new_logic)

content = content.replace('''            decoded = firebase_auth.verify_id_token(token)
            return {
                "user_id": decoded.get("uid") or decoded.get("sub"),
                "email": decoded.get("email", ""),
                "auth": "firebase"
            }''', '''            decoded = firebase_auth.verify_id_token(token)
            token_uid = decoded.get("uid") or decoded.get("sub")
            email = decoded.get("email", "")
            return {
                "user_id": _resolve_db_user(token_uid, email),
                "email": email,
                "auth": "firebase"
            }''')

content = content.replace('''        verified_user = verify_firebase_token_fallback(token)
        # Lazy sync user to ensure foreign keys don't fail
        try:
            from database import supabase
            if supabase:
                supabase.table("users").upsert({
                    "id": verified_user["user_id"],
                    "email": verified_user.get("email", ""),
                    "updated_at": __import__('datetime').datetime.utcnow().isoformat()
                }).execute()
        except Exception as e:
            print(f"[AUTH WARNING] Lazy sync failed: {e}")
        return verified_user''', '''        verified_user = verify_firebase_token_fallback(token)
        token_uid = verified_user["user_id"]
        email = verified_user.get("email", "")
        return {
            "user_id": _resolve_db_user(token_uid, email),
            "email": email,
            "auth": "firebase_verified_fallback"
        }''')

with open('routes/deps.py', 'w') as f:
    f.write(content)
