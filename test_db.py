import os
import sys
import jwt
import time
from dotenv import load_dotenv

# Load env vars
load_dotenv('backend/.env')

from supabase import create_client

supabase = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])

# Generate a fake token or just test the logic directly in auth.py
import requests
import json
print("Let's look at the logic...")
