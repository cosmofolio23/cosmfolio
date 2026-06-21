import os
from supabase import create_client

supabase = create_client('https://rjobifgysmovmcvhdlnd.supabase.co', 'sb_secret_fake_key_for_testing')
try:
    supabase.table('users').select('*').execute()
except Exception as e:
    print("TYPE:", type(e))
    print("REPR:", repr(e))
    print("STR:", str(e))
