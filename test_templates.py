import os
import json
from supabase import create_client

supabase = create_client('https://rjobifgysmovmcvhdlnd.supabase.co', 'sb_secret_fake_key_for_testing')
# wait, I can't use a fake key to read because we need RLS bypass or anon key!
