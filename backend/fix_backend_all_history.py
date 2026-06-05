import re

path = 'app.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

match = re.search(r'@app\.get\("/billing/all-history"\).*?def get_all_billing_history\(\):\n.*?(?=@app|$)', orig, re.DOTALL)
if match:
    old_block = match.group(0)
    
    new_block = '''@app.get("/billing/all-history")
def get_all_billing_history():
    from supabase_client import supabase
    try:
        res = supabase.table("sales_transactions").select("date, item_id, quantity_sold, transaction_id").order("date", desc=True).limit(2000).execute()
        sales = res.data or []
        
        sales = [s for s in sales if s.get("quantity_sold", 0) > 0]
        
        prod_res = supabase.table("product_table").select("item_id, item_name").execute()
        prod_map = {p["item_id"]: p.get("item_name", "Unknown") for p in (prod_res.data or [])}
        
        for s in sales:
            s["item_name"] = prod_map.get(s["item_id"], "Unknown Product")
            
        return sales
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching global history: {str(e)}")

'''
    
    new_code = orig.replace(old_block, new_block)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_code)
    print('Backend updated successfully')
else:
    print('Could not find all-history block')
