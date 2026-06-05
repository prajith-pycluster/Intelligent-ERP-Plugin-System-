import collections
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules

MANUAL_ASSOCIATIONS = {
    "Bread": ["Butter", "Jam", "Milk"],
    "Butter": ["Bread", "Jam"],
    "Soap": ["Shampoo", "Conditioner"],
    "Rice": ["Dal", "Oil"],
    "Tea": ["Sugar", "Milk"],
    "Biscuits": ["Tea", "Coffee"],
    "Noodles": ["Sauce", "Soft Drink"]
}

def compute_market_basket():
    from supabase_client import supabase
    print("[DEBUG] Generating Global Market Basket Associations using Hybrid Engine...")
    
    # Fetch product mappings
    try:
        prod_res = supabase.table("product_table").select("item_id, item_name").execute()
        name_to_id = {p["item_name"]: p["item_id"] for p in (prod_res.data or [])}
    except Exception as e:
        print(f"[ERROR] Failed to fetch product_table: {e}")
        return

    # Generate Manual Seed List
    manual_results = []
    for src_name, target_names in MANUAL_ASSOCIATIONS.items():
        src_id = name_to_id.get(src_name)
        if not src_id:
            continue
        for tgt_name in target_names:
            tgt_id = name_to_id.get(tgt_name)
            if not tgt_id:
                continue
            manual_results.append({
                "item_id": src_id,
                "recommended_item_id": tgt_id,
                "confidence": 75,
                "support": 0.20,
                "lift": 1.9,
                "source": "manual_seed"
            })
            
    # Fetch billing data for Apriori
    all_data = []
    offset = 0
    limit = 1000
    while True:
        try:
            res = supabase.table("billing_items").select("bill_id, item_id").range(offset, offset + limit - 1).execute()
            if not res.data:
                break
            all_data.extend(res.data)
            if len(res.data) < limit:
                break
            offset += limit
        except Exception as e:
            print(f"[ERROR] Failed to fetch billing_items for market basket computation: {e}")
            break
            
    apriori_results = []
    if all_data:
        baskets = collections.defaultdict(list)
        for row in all_data:
            baskets[row["bill_id"]].append(row["item_id"])
            
        basket_list = list(baskets.values())
        print(f"[DEBUG] Total baskets (unique bills): {len(basket_list)}")
        
        if len(basket_list) >= 20:
            try:
                te = TransactionEncoder()
                te_ary = te.fit(basket_list).transform(basket_list)
                encoded_df = pd.DataFrame(te_ary, columns=te.columns_)
                
                frequent_items = apriori(encoded_df, min_support=0.01, use_colnames=True)
                
                if not frequent_items.empty:
                    rules = association_rules(frequent_items, metric="lift", min_threshold=1.1)
                    
                    if not rules.empty:
                        rules["antecedent_len"] = rules["antecedents"].apply(lambda x: len(x))
                        rules["consequent_len"] = rules["consequents"].apply(lambda x: len(x))
                        
                        filtered_rules = rules[
                            (rules["antecedent_len"] == 1) &
                            (rules["consequent_len"] == 1) &
                            (rules["confidence"] >= 0.15)
                        ]
                        
                        filtered_rules = filtered_rules.sort_values(by=["lift", "confidence"], ascending=[False, False])
                        
                        grouped = filtered_rules.groupby("antecedents")
                        
                        for antecedents, group in grouped:
                            item_id = list(antecedents)[0]
                            top_5 = group.head(5)
                            
                            for _, row in top_5.iterrows():
                                recommended_item_id = list(row["consequents"])[0]
                                apriori_results.append({
                                    "item_id": item_id,
                                    "recommended_item_id": recommended_item_id,
                                    "confidence": int(round(row["confidence"] * 100)),
                                    "support": round(row["support"], 4),
                                    "lift": round(row["lift"], 4),
                                    "source": "apriori"
                                })
            except Exception as e:
                print(f"[ERROR] Failed during Apriori generation: {e}")
        else:
            print("[DEBUG] Insufficient transaction data for Apriori analysis (needs >= 20 baskets).")

    # Merge Results
    final_results = {}
    
    # 1. Add all Apriori results first
    for res in apriori_results:
        key = (res["item_id"], res["recommended_item_id"])
        final_results[key] = res
        
    # 2. Add manual results if they don't exist
    for res in manual_results:
        key = (res["item_id"], res["recommended_item_id"])
        if key not in final_results:
            final_results[key] = res
            
    # 3. Limit final recommendations to top 5 per product
    grouped_final = collections.defaultdict(list)
    for res in final_results.values():
        grouped_final[res["item_id"]].append(res)
        
    results_to_insert = []
    for item_id, recs in grouped_final.items():
        # Sort by lift DESC, then confidence DESC
        sorted_recs = sorted(recs, key=lambda x: (x["lift"], x["confidence"]), reverse=True)
        # Keep top 5
        results_to_insert.extend(sorted_recs[:5])

    print(f"[DEBUG] Manual Seed Rules: {len(manual_results)}")
    print(f"[DEBUG] Apriori Rules: {len(apriori_results)}")
    print(f"[DEBUG] Final Hybrid Rules: {len(results_to_insert)}")

    # 9. Flush and Insert via Batch
    try:
        supabase.table("market_basket_recommendations").delete().neq("item_id", "invalid_id_placeholder_force_all").execute()
    except Exception as e:
        pass 
        
    if results_to_insert:
        try:
            batch_size = 500
            for i in range(0, len(results_to_insert), batch_size):
                supabase.table("market_basket_recommendations").insert(results_to_insert[i:i+batch_size]).execute()
            print("[DEBUG] Successfully stored Global Market Basket rules.")
        except Exception as e:
            print(f"[ERROR] Failed to insert market_basket_recommendations: {e}")

if __name__ == "__main__":
    compute_market_basket()
