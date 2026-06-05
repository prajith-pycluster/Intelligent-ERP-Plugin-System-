import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\app.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

new_api = """@app.get("/market-basket/{item_id}")
def get_market_basket(item_id: str):
    from supabase_client import supabase
    try:
        # Load all billing_items
        all_data = []
        offset = 0
        limit = 1000
        while True:
            res = supabase.table("billing_items").select("bill_id, item_id").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            all_data.extend(res.data)
            if len(res.data) < limit:
                break
            offset += limit
            
        if not all_data:
            return []
            
        import collections
        
        # Build baskets: bill_id -> set of item_id
        baskets = collections.defaultdict(set)
        for row in all_data:
            baskets[row["bill_id"]].add(row["item_id"])
            
        target_item = item_id.strip()
        
        count_A = 0
        co_occurrences = collections.defaultdict(int)
        
        for basket in baskets.values():
            if target_item in basket:
                count_A += 1
                for item in basket:
                    if item != target_item:
                        co_occurrences[item] += 1
                        
        if count_A == 0:
            return []
            
        results = []
        for other_item, count_A_B in co_occurrences.items():
            if count_A_B >= 2: # support >= 2
                confidence = count_A_B / count_A
                if confidence > 0:
                    results.append({"item_id": other_item, "confidence": round(confidence * 100)})
                    
        results.sort(key=lambda x: x["confidence"], desc=True)
        return results[:5]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing market basket: {str(e)}")

"""

# Insert right before `if __name__ == "__main__":`
if 'if __name__ == "__main__":' in orig:
    orig = orig.replace('if __name__ == "__main__":', new_api + 'if __name__ == "__main__":')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Market Basket API added to app.py successfully.")
else:
    print("Could not find the target insertion string.")
