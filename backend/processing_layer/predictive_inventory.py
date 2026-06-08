import pandas as pd
from datetime import datetime
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from supabase_client import supabase
except ImportError:
    print("Warning: Could not import supabase_client. Supabase connection may fail.")
    supabase = None
def get_predictive_tag(item_id: str) -> str:
    """
    Returns 'PS' for dataset-sourced temporary products (SI*, NI*, FI* prefixes)
    and 'EXPS' for pre-existing inventory products (P* prefix).
    """
    prefix = str(item_id).strip().upper()
    if prefix.startswith("SI") or prefix.startswith("NI") or prefix.startswith("FI"):
        return "PS"
    return "EXPS"


def is_date_active(start_date_str, end_date_str, current_date=None):
    """
    Checks if current_date falls between start_date_str and end_date_str.
    Format expected: dd-mm.
    Handles recurring yearly periods, including cross-year (e.g. 20-12 to 10-01).
    """
    if not start_date_str or not end_date_str:
        return False
        
    try:
        # Normalize delimiters just in case (e.g. 01/03 -> 01-03)
        start_date_str = str(start_date_str).replace("/", "-").strip()
        end_date_str = str(end_date_str).replace("/", "-").strip()
        
        start_parts = start_date_str.split('-')
        end_parts = end_date_str.split('-')
        
        if len(start_parts) != 2 or len(end_parts) != 2:
            return False
            
        start_day, start_month = int(start_parts[0]), int(start_parts[1])
        end_day, end_month = int(end_parts[0]), int(end_parts[1])
        
        if current_date is None:
            current_date = datetime.now()
            
        curr_day, curr_month = current_date.day, current_date.month
        
        def to_ordinal(m, d):
            return m * 100 + d
            
        start_ord = to_ordinal(start_month, start_day)
        end_ord = to_ordinal(end_month, end_day)
        curr_ord = to_ordinal(curr_month, curr_day)
        
        if start_ord <= end_ord:
            # Normal range: e.g. 01-03 to 30-06 (March 1 to June 30)
            return start_ord <= curr_ord <= end_ord
        else:
            # Cross-year range: e.g. 20-12 to 10-01 (Dec 20 to Jan 10)
            return curr_ord >= start_ord or curr_ord <= end_ord
            
    except Exception as e:
        print(f"[ERROR] Date parsing failed for '{start_date_str}' - '{end_date_str}': {e}")
        return False

def fetch_active_predictive_products(current_date=None):
    if not supabase:
        print("[ERROR] Supabase client not found.")
        return []
        
    if current_date is None:
        current_date = datetime.now()
        
    print(f"[DEBUG] Current Date Context: {current_date.strftime('%d-%m-%Y')}")
    
    def safe_fetch(table_name):
        try:
            res = supabase.table(table_name).select("*").execute()
            return res.data if res.data else []
        except Exception as e:
            print(f"[ERROR] Failed to fetch {table_name}: {e}")
            return []

    seasonal_data = safe_fetch("seasonal_inventory")
    festival_data = safe_fetch("festival_inventory")
    national_data = safe_fetch("national_day_inventory")
    
    active_products = []
    
    def process_and_filter(data_list, source_label):
        active_count = 0
        for row in data_list:
            start = row.get("START_DATE") or row.get("start_date") or row.get("EVENT_DATE") or row.get("event_date")
            end = row.get("END_DATE") or row.get("end_date") or start # If end is missing, use start date for 1-day events
            
            if is_date_active(start, end, current_date):
                # Normalize ITEM_ID vs Item ID
                item_id = str(row.get("ITEM_ID") or row.get("Item ID") or row.get("item_id") or "").strip()
                
                demand_level = str(row.get("predicted_demand_level") or row.get("PREDICTED_DEMAND_LEVEL") or row.get("Demand Level") or row.get("DEMAND_LEVEL") or "MEDIUM").upper()
                suggested_qty = int(row.get("suggested_quantity") or row.get("SUGGESTED_QUANTITY") or 0)
                
                season_name = str(row.get("season_or_festival") or row.get("SEASON_OR_FESTIVAL") or row.get("Seasonal Tag") or row.get("FESTIVAL_NAME") or row.get("EVENT_NAME") or source_label)
                
                # Check for product name in different formats
                p_name = str(row.get("product_name") or row.get("PRODUCT_NAME") or row.get("Product Name") or "")
                cat = str(row.get("category") or row.get("CATEGORY") or row.get("Category") or "Uncategorized")
                
                # Fetch unit_price — normalize across all three dataset schemas
                raw_price = (row.get("unit_price") or row.get("UNIT_PRICE") or row.get("Unit Price") or 0)
                try:
                    unit_price = float(raw_price)
                except (TypeError, ValueError):
                    unit_price = 0.0
                
                score = 90 if "HIGH" in demand_level else (70 if "MEDIUM" in demand_level else 50)
                
                active_products.append({
                    "dataset_item_id": item_id,
                    "product_name": p_name,
                    "category": cat,
                    "season_or_festival": season_name,
                    "demand_level": demand_level,
                    "suggested_qty": suggested_qty,
                    "source": source_label,
                    "score": score,
                    "start_date": start,
                    "end_date": end,
                    "unit_price": unit_price
                })
                active_count += 1
        return active_count

    s_count = process_and_filter(seasonal_data, "SEASONAL")
    f_count = process_and_filter(festival_data, "FESTIVAL")
    n_count = process_and_filter(national_data, "NATIONAL_DAY")
    
    print(f"[DEBUG] Active Seasonal Products: {s_count}")
    print(f"[DEBUG] Active Festival Products: {f_count}")
    print(f"[DEBUG] Active National Day Products: {n_count}")
    print(f"[DEBUG] Final Active Predictive Products: {len(active_products)}")
    
    return active_products

def get_lifecycle_multiplier_and_status(start_date_str, end_date_str, current_date=None):
    if current_date is None:
        current_date = datetime.now()
    try:
        start_date_str = str(start_date_str).replace("/", "-").strip()
        end_date_str = str(end_date_str).replace("/", "-").strip()
        start_parts = start_date_str.split('-')
        end_parts = end_date_str.split('-')
        
        start_day, start_month = int(start_parts[0]), int(start_parts[1])
        end_day, end_month = int(end_parts[0]), int(end_parts[1])
        
        y = current_date.year
        start_dt = datetime(y, start_month, start_day)
        end_dt = datetime(y, end_month, end_day)
        
        if start_month > end_month:
            # Cross year
            if current_date.month <= end_month:
                start_dt = datetime(y - 1, start_month, start_day)
            else:
                end_dt = datetime(y + 1, end_month, end_day)
                
        # Check deadline
        if current_date.date() > end_dt.date():
            return 0.0, True # Expired (Deadline)
            
        total_days = (end_dt - start_dt).days + 1
        if total_days <= 0: return 1.0, False
        
        elapsed = (current_date - start_dt).days
        progress = elapsed / total_days
        
        if progress < 0.33:
            return 1.4, False
        elif progress < 0.66:
            return 1.0, False
        else:
            return 0.6, False
    except Exception as e:
        print(f"[ERROR] Lifecycle multiplier calc failed: {e}")
        return 1.0, False

def get_recent_7_day_sales(daily_sales, item_id, current_date):
    if daily_sales is None or daily_sales.empty:
        return 0
    try:
        # daily_sales usually has 'date' and 'quantity_sold'
        import pandas as pd
        item_sales = daily_sales[daily_sales['item_id'] == item_id].copy()
        if item_sales.empty: return 0
        item_sales['date_obj'] = pd.to_datetime(item_sales['date'])
        recent = item_sales[(item_sales['date_obj'] >= pd.to_datetime(current_date) - pd.Timedelta(days=7)) & 
                            (item_sales['date_obj'] <= pd.to_datetime(current_date))]
        return int(recent['quantity_sold'].sum())
    except Exception as e:
        print(f"[ERROR] 7-day sales calc failed: {e}")
        return 0

def run_predictive_pipeline(final_df, current_date=None, daily_sales=None):
    """
    Main orchestrator for Predictive Inventory lifecycle.
    """
    if current_date is None:
        current_date = datetime.now()
        
    date_str = current_date.strftime("%Y-%m-%d")
    
    # 1. Fetch active products based on dates
    active_predictive = fetch_active_predictive_products(current_date)
    
    updates_to_push = []
    godown_recommendations = []
    
    # Track which active items have been matched to existing products
    matched_active_names = set()
    
    # 2. Iterate existing products to assign EXPI or manage lifecycle
    for _, product in final_df.iterrows():
        item_id = product["item_id"]
        p_name = str(product.get("item_name", "")).upper()
        p_cat = str(product.get("category", "")).upper()
        curr_mode = product.get("inventory_mode", "NORMAL")
        curr_tag = product.get("predictive_tag", "")
        
        # Check if product matches any ACTIVE predictive rule
        matched_rule = None
        for rule in active_predictive:
            # Match by explicitly provided ID, or by exact Name
            if rule["dataset_item_id"] and rule["dataset_item_id"].upper() == str(item_id).upper():
                matched_rule = rule
                break
            if rule["product_name"] and rule["product_name"].upper() in p_name:
                matched_rule = rule
                break

        if matched_rule:
            matched_active_names.add(matched_rule["product_name"])
            
            # Respect manual revert, deadline state, or excluded state
            if curr_mode in ["REVIEW_MANUAL", "REVIEW_DEADLINE", "EXCLUDED"]:
                continue
            
            curr_stock = product.get("current_stock", 0)
            base_qty = matched_rule["suggested_qty"]
            if base_qty <= 0:
                base_qty = int(matched_rule["score"] * 2.88)
                
            multiplier, is_expired = get_lifecycle_multiplier_and_status(matched_rule.get("start_date", ""), matched_rule.get("end_date", ""), current_date)
            recent_sales = get_recent_7_day_sales(daily_sales, item_id, current_date)
            
            dynamic_demand = int((base_qty * multiplier) + recent_sales)
            predicted_demand = dynamic_demand
            
            # additional_qty = how much more is needed beyond current stock
            # If current stock already meets or exceeds predicted demand, no restock needed
            additional_qty = max(0, predicted_demand - curr_stock)
            
            # Check expiration directly since we parsed the rule
            if is_expired:
                # Move to Review Deadline
                updates_to_push.append({
                    "item_id": item_id,
                    "inventory_mode": "REVIEW_DEADLINE",
                    "predictive_tag": get_predictive_tag(item_id),
                    "predictive_reason": "Season ended - Deadline",
                    "predictive_score": 0,
                    "predictive_start": matched_rule.get("start_date"),
                    "predictive_end": matched_rule.get("end_date")
                })
                continue
                
            # Since it exists, tag depends on item_id prefix (SI/NI/FI = PS, P = EXPS)
            p_tag = get_predictive_tag(item_id)
            updates_to_push.append({
                "item_id": item_id,
                "inventory_mode": "PREDICTIVE",
                "predictive_tag": p_tag,
                "predictive_reason": f"Active {matched_rule['season_or_festival']} demand",
                "predictive_score": matched_rule["score"],
                "predictive_start": date_str,
                "predictive_end": None,
                "predicted_demand": predicted_demand,
                "additional_qty": additional_qty
            })
            
            if additional_qty > 0:
                godown_recommendations.append({
                    "item_id": item_id,
                    "item_name": p_name,
                    "category": p_cat,
                    "predictive_tag": p_tag,
                    "predictive_reason": f"Active {matched_rule['season_or_festival']} demand",
                    "predictive_score": matched_rule["score"],
                    "suggested_qty": additional_qty,
                    "predicted_demand": predicted_demand,
                    "additional_qty": additional_qty,
                    "unit_price": matched_rule.get("unit_price", 0.0)
                })
            
        else:
            # It's NOT currently active. Manage Lifecycle.
            # If product is currently EXPS/PS or PREDICTIVE but no longer active in rules,
            # it should go to REVIEW_DEADLINE. Preserve the correct tag based on item_id prefix.
            if curr_tag in ["EXPS", "PS"] or curr_mode == "PREDICTIVE":
                if curr_mode not in ["REVIEW_DEADLINE", "REVIEW_MANUAL"]:
                    updates_to_push.append({
                        "item_id": item_id,
                        "inventory_mode": "REVIEW_DEADLINE",
                        "predictive_tag": get_predictive_tag(item_id),
                        "predictive_reason": "Season ended - Deadline",
                        "predictive_score": 0,
                        "predictive_start": product.get("predictive_start"),
                        "predictive_end": product.get("predictive_end")
                    })

    # 3. Handle PS (New Temporary Products)
    # Any active rule that didn't match an existing product becomes a Godown Recommendation (PS)
    for rule in active_predictive:
        if rule["product_name"] not in matched_active_names:
            base_qty = rule["suggested_qty"]
            if base_qty <= 0:
                base_qty = int(rule["score"] * 2.88)
                
            multiplier, is_expired = get_lifecycle_multiplier_and_status(rule.get("start_date", ""), rule.get("end_date", ""), current_date)
            # recent sales is 0 since it's a new temporary product
            dynamic_demand = int(base_qty * multiplier)
            predicted_demand = dynamic_demand
            
            if is_expired:
                continue # Don't recommend expired temporary products
                
            additional_qty = predicted_demand # current_stock = 0
            
            godown_recommendations.append({
                "item_id": rule["dataset_item_id"] or f"TEMP-{rule['product_name'].replace(' ', '').upper()[:5]}",
                "item_name": rule["product_name"],
                "category": rule["category"],
                "predictive_tag": "PS",
                "predictive_score": rule["score"],
                "predictive_reason": f"Upcoming {rule['season_or_festival']}",
                "suggested_qty": additional_qty,
                "predicted_demand": predicted_demand,
                "additional_qty": additional_qty,
                "unit_price": rule.get("unit_price", 0.0)
            })

    # 4. Push updates to DB
    if updates_to_push and supabase:
        print(f"[DEBUG] Pushing {len(updates_to_push)} predictive lifecycle updates to DB...")
        try:
            for update in updates_to_push:
                db_update = {
                    "inventory_mode": update.get("inventory_mode", "NORMAL"),
                    "predictive_tag": update.get("predictive_tag", ""),
                    "predictive_reason": update.get("predictive_reason", ""),
                    "predictive_score": update.get("predictive_score", 0),
                    "predictive_start": update.get("predictive_start", None),
                    "predictive_end": update.get("predictive_end", None)
                }
                supabase.table("product_table").update(db_update).eq("item_id", update["item_id"]).execute()
        except Exception as e:
            print(f"[ERROR] Failed DB update: {e}")

    # Return updates so app.py can update final_df in memory, plus godown_recs for the API
    return updates_to_push, godown_recommendations


def fetch_expired_predictive_products(current_date=None):
    if not supabase:
        print("[ERROR] Supabase client not found.")
        return []
        
    if current_date is None:
        current_date = datetime.now()
        
    def safe_fetch(table_name):
        try:
            res = supabase.table(table_name).select("*").execute()
            return res.data if res.data else []
        except Exception as e:
            print(f"[ERROR] Failed to fetch {table_name}: {e}")
            return []

    seasonal_data = safe_fetch("seasonal_inventory")
    festival_data = safe_fetch("festival_inventory")
    national_data = safe_fetch("national_day_inventory")
    
    expired_products = []
    
    def process_and_filter_expired(data_list, source_label):
        for row in data_list:
            try:
                start = row.get("START_DATE") or row.get("start_date") or row.get("EVENT_DATE") or row.get("event_date")
                end = row.get("END_DATE") or row.get("end_date") or start
                
                if not start or not end:
                    continue
                    
                start_date_str = str(start).replace("/", "-").strip()
                end_date_str = str(end).replace("/", "-").strip()
                
                start_parts = start_date_str.split('-')
                end_parts = end_date_str.split('-')
                
                if len(start_parts) != 2 or len(end_parts) != 2:
                    continue
                    
                start_day, start_month = int(start_parts[0]), int(start_parts[1])
                end_day, end_month = int(end_parts[0]), int(end_parts[1])
                
                y = current_date.year
                start_dt = datetime(y, start_month, start_day)
                end_dt = datetime(y, end_month, end_day)
                
                if start_month > end_month:
                    # Cross year
                    if current_date.month <= end_month:
                        start_dt = datetime(y - 1, start_month, start_day)
                    else:
                        end_dt = datetime(y + 1, end_month, end_day)
                
                if current_date.date() > end_dt.date():
                    item_id = str(row.get("ITEM_ID") or row.get("Item ID") or row.get("item_id") or "").strip()
                    p_name = str(row.get("product_name") or row.get("PRODUCT_NAME") or row.get("Product Name") or "")
                    cat = str(row.get("category") or row.get("CATEGORY") or row.get("Category") or "Uncategorized")
                    
                    raw_price = (row.get("unit_price") or row.get("UNIT_PRICE") or row.get("Unit Price") or 0)
                    try:
                        unit_price = float(raw_price)
                    except (TypeError, ValueError):
                        unit_price = 0.0
                        
                    expired_products.append({
                        "item_id": item_id,
                        "item_name": p_name,
                        "category": cat,
                        "unit_price": unit_price,
                        "current_stock": 0,
                        "inventory_mode": "REVIEW_DEADLINE",
                        "predictive_tag": "PS",
                        "predictive_start": start,
                        "predictive_end": end,
                        "predictive_reason": f"Season ended - Deadline ({source_label})",
                        "predictive_score": 0
                    })
            except Exception as e:
                print(f"[ERROR] Expired parsing failed for item {row}: {e}")
                
    process_and_filter_expired(seasonal_data, "SEASONAL")
    process_and_filter_expired(festival_data, "FESTIVAL")
    process_and_filter_expired(national_data, "NATIONAL_DAY")
    
    return expired_products

