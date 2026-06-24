import os
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

from database import engine
from sqlalchemy import text

def run_migration():
    print("Running Monitoring DB Migration...")
    
    with open(backend_dir / 'migrations_monitoring.sql', 'r') as file:
        sql_commands = file.read()
        
    with engine.begin() as conn:
        conn.execute(text(sql_commands))
        
    print("Monitoring Migration successful!")

if __name__ == "__main__":
    run_migration()
