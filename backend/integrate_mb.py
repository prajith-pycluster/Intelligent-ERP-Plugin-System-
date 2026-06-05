import sys
import re

path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\app.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

# 1. Integrate into reload_pipeline
if 'from processing_layer.market_basket import compute_market_basket' not in orig:
    # insert at the end of reload_pipeline
    target = 'print(f"[DEBUG] Final DataFrame computed explicitly. Shape: {final_df.shape}")'
    insertion = """
    print(f"[DEBUG] Final DataFrame computed explicitly. Shape: {final_df.shape}")
    
    # Trigger Market Basket Global Setup
    try:
        from processing_layer.market_basket import compute_market_basket
        compute_market_basket()
    except Exception as e:
        print(f"[ERROR] Failed to run market basket computation: {e}")
"""
    orig = orig.replace(target, insertion)

# 2. Refactor /market-basket/{item_id}
# We use regex to replace everything inside `def get_market_basket(item_id: str):`
old_func_pattern = r'@app\.get\("/market-basket/\{item_id\}"\)\s+def get_market_basket\(item_id: str\):.*?(?=@app\.get|if __name__ == "__main__":)'

new_func = """@app.get("/market-basket/{item_id}")
def get_market_basket(item_id: str):
    from supabase_client import supabase
    try:
        res = supabase.table("market_basket_recommendations").select("recommended_item_id, confidence").eq("item_id", item_id).order("confidence", desc=True).limit(5).execute()
        
        # Format identical to previous frontend expectations
        results = [{"item_id": row["recommended_item_id"], "confidence": row["confidence"]} for row in (res.data or [])]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing market basket: {str(e)}")

"""

orig = re.sub(old_func_pattern, new_func, orig, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(orig)

print("app.py modified successfully for precomputed market basket logic.")
