import os
from supabase import create_client, Client

url: str = "https://wopsjchfuqjnwvfshgsh.supabase.co"
key: str = "sb_publishable_Tp3TF8WlgnvU3MfBWMWzQA_YaCHi5J3"
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
