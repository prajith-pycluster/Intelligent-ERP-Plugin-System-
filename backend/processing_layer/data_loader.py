import pandas as pd
import sys
import os

# Ensure backend directory is in path to import supabase_client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from supabase_client import supabase
except ImportError:
    print("Warning: Could not import supabase_client. Supabase connection may fail.")

def validate_columns(df, table_name, expected_columns):
    for col in expected_columns:
        if col not in df.columns:
            raise ValueError(f"CRITICAL ERROR: Table '{table_name}' is missing required column '{col}'.")
    return df

def fetch_table(table_name, expected_columns, filter_deleted=False):
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
            raise ValueError(f"\n[CRITICAL ERROR] Table '{table_name}' does not exist in your Supabase database! Please check spelling or use the provided SQL script to construct it.")
        raise ValueError(f"\n[CRITICAL ERROR] Failed to fetch '{table_name}': {e}")
        
    if not all_data:
        print(f"[WARNING] Table '{table_name}' fetched 0 rows. It is completely empty.")
        return pd.DataFrame(columns=expected_columns)
        
    df = pd.DataFrame(all_data)
    print(f"[DEBUG] Fetched {len(df)} rows from {table_name}")
    
    return validate_columns(df, table_name, expected_columns)

def load_data():
    print("[DEBUG] Starting strict Supabase data extraction...")
    
    product_cols = ["item_id", "item_name", "category", "unit_price", "inventory_mode", "predictive_tag", "predictive_start", "predictive_end", "predictive_reason", "predictive_score"]
    
    # We will ignore missing columns for predictive inventory gracefully since they are newly added
    # But fetch_table validates exactly, so we handle missing explicitly if the user hasn't run SQL yet.
    try:
        products = fetch_table("product_table", product_cols, filter_deleted=True)
    except ValueError as e:
        if "missing required column" in str(e).lower():
            # Fallback to basic columns if SQL hasn't been run
            fallback_cols = ["item_id", "item_name", "category", "unit_price"]
            products = fetch_table("product_table", fallback_cols, filter_deleted=True)
            for col in product_cols[4:]:
                products[col] = "NORMAL" if col == "inventory_mode" else (0 if col == "predictive_score" else None)
        else:
            raise e

    sales_cols = ["date", "item_id", "quantity_sold"]
    sales = fetch_table("sales_transactions", sales_cols)

    purchase_cols = ["date", "item_id", "quantity_purchased"]
    purchases = fetch_table("purchase_table", purchase_cols)

    inventory_cols = ["item_id", "current_stock", "lead_time_days"]
    inventory = fetch_table("inventory_table", inventory_cols, filter_deleted=True)
    
    # Debug startup counts
    print(f"[STARTUP DEBUG] Products Count:  {len(products)}")
    print(f"[STARTUP DEBUG] Sales Count:     {len(sales)}")
    print(f"[STARTUP DEBUG] Inventory Count: {len(inventory)}")
    
    if len(products) == 0 or len(sales) == 0 or len(inventory) == 0:
        print("[WARNING] One or more core tables returned 0 rows! API results may appear empty.")

    return products, sales, purchases, inventory



