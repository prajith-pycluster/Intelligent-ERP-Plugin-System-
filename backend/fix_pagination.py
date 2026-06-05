import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\processing_layer\data_loader.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

# Replace fetch_table
old_func = """def fetch_table(table_name, expected_columns, filter_deleted=False):
    import pandas as pd
    try:
        # Fetch data
        query = supabase.table(table_name).select("*")
        if filter_deleted:
            query = query.eq("is_deleted", False)
        res = query.execute()
    except Exception as e:
        err_str = str(e).lower()
        if "does not exist" in err_str or "not found" in err_str:
            raise ValueError(f"\\n[CRITICAL ERROR] Table '{table_name}' does not exist in your Supabase database! Please check spelling or use the provided SQL script to construct it.")
        raise ValueError(f"\\n[CRITICAL ERROR] Failed to fetch '{table_name}': {e}")
        
    if not res.data:
        print(f"[WARNING] Table '{table_name}' fetched 0 rows. It is completely empty.")
        return pd.DataFrame(columns=expected_columns)
        
    df = pd.DataFrame(res.data)
    print(f"[DEBUG] Fetched {len(df)} rows from {table_name}")
    
    # We must explicitly ensure all our required column names are correctly mapped from Supabase.
    return validate_columns(df, table_name, expected_columns)"""

new_func = """def fetch_table(table_name, expected_columns, filter_deleted=False):
    import pandas as pd
    try:
        all_data = []
        offset = 0
        limit = 1000
        
        while True:
            query = supabase.table(table_name).select("*")
            if filter_deleted:
                query = query.eq("is_deleted", False)
                
            res = query.range(offset, offset + limit - 1).execute()
            if not res.data:
                break
                
            all_data.extend(res.data)
            if len(res.data) < limit:
                break
            offset += limit
            
    except Exception as e:
        err_str = str(e).lower()
        if "does not exist" in err_str or "not found" in err_str:
            raise ValueError(f"\\n[CRITICAL ERROR] Table '{table_name}' does not exist in your Supabase database! Please check spelling or use the provided SQL script to construct it.")
        raise ValueError(f"\\n[CRITICAL ERROR] Failed to fetch '{table_name}': {e}")
        
    if not all_data:
        print(f"[WARNING] Table '{table_name}' fetched 0 rows. It is completely empty.")
        return pd.DataFrame(columns=expected_columns)
        
    df = pd.DataFrame(all_data)
    print(f"[DEBUG] Fetched {len(df)} rows from {table_name}")
    
    return validate_columns(df, table_name, expected_columns)"""

if old_func in orig:
    orig = orig.replace(old_func, new_func)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Pagination fix applied successfully.")
else:
    print("Could not find the target string.")
