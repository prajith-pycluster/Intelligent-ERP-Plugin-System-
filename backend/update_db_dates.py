import sys
import os
import time
sys.path.append(r'c:\Users\praji\Pictures\Mini Project\mini code\backend')
from supabase_client import supabase

def update_dates():
    updated = 0
    while True:
        # Fetch up to 1000 records with 2025 dates
        res = supabase.table('sales_transactions').select('transaction_id, date').like('date', '2025-%').limit(1000).execute()
        records = res.data or []
        
        if not records:
            break
            
        print(f"Fetched {len(records)} records. Updating...")
        
        # We need to update them. Supabase python client doesn't support batch update well, 
        # but we can do a loop or upsert if we select all fields. 
        # Alternatively, we could update one by one, but that's slow.
        # It's better to fetch all fields, change the date, and upsert.
        # Wait, sales_transactions primary key is transaction_id. Upserting with same transaction_id will overwrite it!
        
        # Let's fetch all fields for the 1000 records
        full_res = supabase.table('sales_transactions').select('*').like('date', '2025-%').limit(1000).execute()
        full_records = full_res.data or []
        
        # Modify the date
        for r in full_records:
            r['date'] = r['date'].replace('2025-', '2026-')
            
        # Upsert
        up_res = supabase.table('sales_transactions').upsert(full_records).execute()
        
        updated += len(full_records)
        print(f"Updated {updated} records so far...")
        
        if len(records) < 1000:
            break
            
    print(f"Finished updating {updated} total records!")

if __name__ == '__main__':
    update_dates()
