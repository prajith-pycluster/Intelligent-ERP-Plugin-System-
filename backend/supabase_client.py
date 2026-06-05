import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load credentials from .env (never commit .env to git)
load_dotenv()

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

if not url or not key:
    raise RuntimeError(
        "[ERROR] SUPABASE_URL and SUPABASE_KEY must be set in your .env file. "
        "Copy .env.example to .env and fill in your credentials."
    )

supabase: Client = create_client(url, key)

def test_supabase_connection():
    try:
        response = supabase.table("product_table").select("*").limit(1).execute()
        print("[SUCCESS] Connected to Supabase!")
        print(f"[SUCCESS] Sample Row: {response.data}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to connect to Supabase: {e}")
        return False

if __name__ == "__main__":
    test_supabase_connection()
