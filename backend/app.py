import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Pipeline Imports
from processing_layer.data_loader import load_data
from processing_layer.data_preprocessing import preprocess_pipeline
from demand_analysis_layer.demand_analysis import demand_analysis_pipeline
from optimization_layer.inventory_optimization import calculate_inventory_metrics

# Query Imports
from query_layer.decision_queries import get_reorder_quantity, get_reorder_point
from query_layer.boolean_queries import get_stockout_risk, get_overstock_risk
from query_layer.analytical_queries import get_safety_stock, get_demand_trend
from query_layer.exploratory_queries import exploratory_query

app = FastAPI(title="Inventory System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MANUAL_OVERRIDES = {}

# Load data on startup
print("Loading data pipeline...")
def compute_abc_classification(final_df, products):
    import pandas as pd
    df = final_df.merge(products, on="item_id", how="left")
    df["value"] = df["final_demand"] * df.get("unit_price", 1.0)
    df = df.sort_values(by="value", ascending=False)
    total_value = df["value"].sum()
    if total_value > 0:
        df["cumulative"] = df["value"].cumsum() / total_value
    else:
        df["cumulative"] = 0
    def classify(x):
        if x <= 0.7: return "A"
        elif x <= 0.9: return "B"
        else: return "C"
    df["abc_class"] = df["cumulative"].apply(classify)
    return df[["item_id", "abc_class"]]

def compute_inventory_turnover(final_df):
    df = final_df.copy()
    df["inventory_turnover"] = df.apply(
        lambda row: round(row["final_demand"] / row["current_stock"], 2)
        if row.get("current_stock", 0) > 0 else 0,
        axis=1
    )
    return df[["item_id", "inventory_turnover"]]

def reload_pipeline():
    global products, sales, purchases, inventory, daily_sales, avg_demand, std_dev, final_demand, rolling_30, final_df, abc_df, turnover_df
    
    print("[DEBUG] Triggering Pipeline Reload...")
    products, sales, purchases, inventory = load_data()
    print(f"[DEBUG] Shapes - Products: {products.shape}, Sales: {sales.shape}, Inventory: {inventory.shape}")

    processed = preprocess_pipeline(sales, purchases)
    daily_sales = processed["daily_sales"]
    avg_demand = processed["avg_demand"]

    demand_results = demand_analysis_pipeline(daily_sales, avg_demand)
    std_dev = demand_results["std_dev"]
    final_demand = demand_results["final_demand"]
    rolling_30 = demand_results["rolling_30"]

    print(f"[DEBUG] Processed Intermediate Shapes - Daily Sales: {daily_sales.shape}, Final Demand: {final_demand.shape}")

    final_df = calculate_inventory_metrics(final_demand, std_dev, inventory)
    final_df = final_df.merge(avg_demand, on="item_id", how="left").fillna(0)
    final_df = final_df.merge(rolling_30, on="item_id", how="left").fillna(0)
    
    abc_df = compute_abc_classification(final_df, products)
    turnover_df = compute_inventory_turnover(final_df)
    
    final_df = final_df.merge(abc_df, on="item_id", how="left").fillna("C")
    final_df = final_df.merge(turnover_df, on="item_id", how="left").fillna(0)
    
    # Also attach product base info (name, category, price) directly to final_df so /products doesn't need to join
    final_df = final_df.merge(products[["item_id", "item_name", "category", "unit_price", "inventory_mode", "predictive_tag", "predictive_start", "predictive_end", "predictive_reason", "predictive_score"]], on="item_id", how="left")
    final_df["item_name"] = final_df["item_name"].fillna("Unknown")

    
    print(f"[DEBUG] Final DataFrame computed explicitly. Shape: {final_df.shape}")
    
    # Run Predictive Engine (Date-Driven)
    try:
        from processing_layer.predictive_inventory import run_predictive_pipeline
        updates, godown_recs = run_predictive_pipeline(final_df, current_date=None, daily_sales=daily_sales)
        if updates:
            print(f"[DEBUG] Applied {len(updates)} predictive lifecycle updates to memory.")
            for update in updates:
                idx = final_df.index[final_df['item_id'] == update['item_id']]
                if not idx.empty:
                    for k, v in update.items():
                        if k != "item_id":
                            final_df.loc[idx, k] = v
                            
        # Attach godown_recs globally or handle in API?
        # The API currently looks for PI in final_df. Let's append godown_recs to a global variable
        global active_godown_recs
        active_godown_recs = godown_recs
        
        # Apply MANUAL_OVERRIDES to final_df memory
        for m_item_id, m_override in MANUAL_OVERRIDES.items():
            idx = final_df.index[final_df['item_id'] == m_item_id]
            if not idx.empty:
                for k, v in m_override.items():
                    final_df.loc[idx, k] = v
        
    except Exception as e:
        print(f"[ERROR] Failed to run date-driven predictive engine: {e}")

    # Trigger Market Basket Global Setup
    try:
        from processing_layer.market_basket import compute_market_basket
        compute_market_basket()
    except Exception as e:
        print(f"[ERROR] Failed to run market basket computation: {e}")

    
    if final_df.empty:
        print("\n===============================")
        print("    DATA PIPELINE FAILED     ")
        print("===============================\n")
        print("[WARNING] The final_df is entirely empty. Please ensure your Supabase tables have matching item_id rows.\n")

reload_pipeline()

print("Backend running successfully.")

def get_abc_classification(df, item_id):
    res = df[df["item_id"] == item_id]
    return res["abc_class"].iloc[0] if not res.empty else "C"

def get_inventory_turnover(df, item_id):
    res = df[df["item_id"] == item_id]
    return float(res["inventory_turnover"].iloc[0]) if not res.empty else 0.0

# Request Models
class QueryRequest(BaseModel):
    item_id: str
    query_type: str

class ExploreRequest(BaseModel):
    item_id: str
    question: str
    context_data: dict = None

class AddProductRequest(BaseModel):
    item_id: str
    item_name: str
    category: str
    unit_price: float
    current_stock: int
    lead_time_days: int

class CompareRequest(BaseModel):
    item_ids: list[str]

class EditProductRequest(BaseModel):
    item_id: str
    item_name: str
    category: str
    unit_price: float
    current_stock: int
    lead_time_days: int

class BasicProductRequest(BaseModel):
    item_id: str

class SaleRequest(BaseModel):
    item_id: str
    quantity: int

class BillingAddItemRequest(BaseModel):
    bill_id: str
    item_id: str
    quantity: int

class BillingRemoveItemRequest(BaseModel):
    id: str

class BillingCheckoutRequest(BaseModel):
    bill_id: str
    customer_name: str = ""

from typing import List

class BatchRestockItem(BaseModel):
    item_id: str
    quantity_added: int
    product_name: str

class BatchRestockRequest(BaseModel):
    items: List[BatchRestockItem]

class WhatsAppAlertRequest(BaseModel):
    message: str


# Query Mapping
QUERY_MAPPING = {
    "reorder_quantity": get_reorder_quantity,
    "reorder_point": get_reorder_point,
    "safety_stock": get_safety_stock,
    "stockout_risk": get_stockout_risk,
    "overstock_risk": get_overstock_risk,
    "demand_trend": get_demand_trend,
    "abc_classification": get_abc_classification,
    "inventory_turnover": get_inventory_turnover,
}

def _is_predictive_id(item_id: str) -> bool:
    """Returns True for dataset-sourced temporary products (SI*, NI*, FI* prefixes)."""
    uid = str(item_id).strip().upper()
    return uid.startswith("SI") or uid.startswith("NI") or uid.startswith("FI")

def _has_crossed_end_date(start_date_str, end_date_str, current_date=None) -> bool:
    """Checks if current date is past the end date (supporting cross-year intervals)."""
    if not start_date_str or not end_date_str:
        return False
    from datetime import datetime
    if current_date is None:
        current_date = datetime.now()
    try:
        start_date_str = str(start_date_str).replace("/", "-").strip()
        end_date_str = str(end_date_str).replace("/", "-").strip()
        start_parts = start_date_str.split('-')
        end_parts = end_date_str.split('-')
        
        if len(start_parts) != 2 or len(end_parts) != 2:
            return False
            
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
            return True
    except Exception as e:
        print(f"[ERROR] _has_crossed_end_date check failed: {e}")
    return False

def _is_erp_product(row) -> bool:
    """
    Determines if a product should be included in the ERP-wide catalog.
    - If it's a normal inventory product (not SI/NI/FI series), it is always included.
    - If it is a predictive-only product (starts with SI/NI/FI), it is included
      only if it is active, stocked, and has not passed its end_date or been moved to review.
    """
    item_id = str(row["item_id"]).strip().upper() if "item_id" in row else ""
    if not _is_predictive_id(item_id):
        return True
        
    predictive_tag = row.get("predictive_tag") if hasattr(row, "get") else row["predictive_tag"]
    inventory_mode = row.get("inventory_mode") if hasattr(row, "get") else row["inventory_mode"]
    current_stock = row.get("current_stock") if hasattr(row, "get") else row["current_stock"]
    predictive_start = row.get("predictive_start") if hasattr(row, "get") else row["predictive_start"]
    predictive_end = row.get("predictive_end") if hasattr(row, "get") else row["predictive_end"]
    
    is_active_pred = (
        predictive_tag in ["EXPS", "PS"] and
        inventory_mode not in ["REVIEW_MANUAL", "REVIEW_DEADLINE"]
    )
    try:
        has_stock = float(current_stock or 0) > 0
    except (ValueError, TypeError):
        has_stock = False
        
    if not (is_active_pred and has_stock):
        return False
        
    if _has_crossed_end_date(predictive_start, predictive_end):
        return False
        
    if inventory_mode == "REVIEW_DEADLINE":
        return False
        
    return True

@app.get("/dashboard")
def get_dashboard():
    df_copy = final_df.copy().fillna(0)
    # Filter to only active ERP catalog products
    df_copy = df_copy[df_copy.apply(_is_erp_product, axis=1)]
    
    # In case overstock_risk wasn't materialized into final_df from earlier analysis, map it
    if "overstock_risk" not in df_copy.columns:
        df_copy["overstock_risk"] = df_copy["item_id"].apply(lambda x: get_overstock_risk(final_df, x))
        
    overall_avg = df_copy["final_demand"].mean()
    high_demand_count = int((df_copy["final_demand"] > overall_avg).sum())
    low_demand_count = int((df_copy["final_demand"] < (overall_avg * 0.7)).sum())
        
    return {
        "total_products": len(df_copy),
        "stockout_risk_count": int(df_copy["reorder_needed"].sum()),
        "overstock_count": int((df_copy["overstock_risk"] == "YES").sum()),
        "healthy_count": int(((df_copy["reorder_needed"] == False) & (df_copy["overstock_risk"] == "NO")).sum()),
        "high_demand_count": high_demand_count,
        "low_demand_count": low_demand_count
    }

@app.get("/health")
def health_check():
    """Returns the core operational status and row load metrics of the backend's data systems."""
    return {
        "status": "ok",
        "products_loaded": len(products),
        "sales_loaded": len(sales),
        "inventory_loaded": len(inventory),
        "final_df_size": len(final_df)
    }

@app.get("/products")
def get_products():
    if final_df.empty:
        raise HTTPException(status_code=500, detail="No data available from database")
        
    df_copy = final_df.copy().fillna(0)
    # Only include active ERP products
    df_copy = df_copy[df_copy.apply(_is_erp_product, axis=1)]
    
    # Materialize dynamic query-driven columns if they are required by the frontend product table
    if "overstock_risk" not in df_copy.columns:
        df_copy["overstock_risk"] = df_copy["item_id"].apply(lambda x: get_overstock_risk(final_df, x))
    if "stockout_risk" not in df_copy.columns:
        df_copy["stockout_risk"] = df_copy["item_id"].apply(lambda x: get_stockout_risk(final_df, x))
    if "demand_trend" not in df_copy.columns:
        df_copy["demand_trend"] = df_copy["item_id"].apply(lambda x: get_demand_trend(daily_sales, x, df_copy))
        
    return df_copy.fillna(0).to_dict(orient="records")

@app.get("/product/{item_id}")
def get_product(item_id: str):
    product_df = final_df[final_df["item_id"] == item_id]
    
    if product_df.empty or not _is_erp_product(product_df.fillna(0).to_dict(orient="records")[0]):
        raise HTTPException(status_code=404, detail=f"Product with item_id '{item_id}' not found or is inactive.")
        
    p_dict = product_df.fillna(0).to_dict(orient="records")[0]
    
    # Bind custom query metrics to individual specific lookups
    if "overstock_risk" not in p_dict:
        p_dict["overstock_risk"] = get_overstock_risk(final_df, item_id)
    if "stockout_risk" not in p_dict:
        p_dict["stockout_risk"] = get_stockout_risk(final_df, item_id)
    if "demand_trend" not in p_dict:
        p_dict["demand_trend"] = get_demand_trend(daily_sales, item_id, final_df)
        
    import pandas as pd
    # Extract historical demand data for the graph
    data = daily_sales[daily_sales["item_id"] == item_id].copy()
    if not data.empty:
        # User requested to ensure date is properly formatted
        data["date"] = pd.to_datetime(data["date"])
        
        # Sort chronologically and take only the latest 30 points to prevent graph clutter
        data = data.sort_values(by="date").tail(30)
        
        # Front-end expects "month" and "demand" fields
        data["month"] = data["date"].dt.strftime('%b %d')
        data["demand"] = data["quantity_sold"]
        p_dict["history"] = data[["month", "demand"]].to_dict(orient="records")
    else:
        p_dict["history"] = []
        
    import math
    for key, val in p_dict.items():
        if isinstance(val, float) and math.isnan(val):
            p_dict[key] = 0.0
            
    return p_dict

@app.post("/query")
def execute_query(request: QueryRequest):
    item_id = request.item_id
    query_type = request.query_type
    
    # Handle invalid item_id gracefully
    row = final_df[final_df["item_id"] == item_id]
    if row.empty or not _is_erp_product(row.fillna(0).to_dict(orient="records")[0]):
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found or is inactive.")
        
    # Handle invalid query_type gracefully
    if query_type not in QUERY_MAPPING:
        valid_queries = list(QUERY_MAPPING.keys())
        raise HTTPException(status_code=400, detail=f"Invalid query_type. Supported types: {valid_queries}")
        
    # Use existing query functions to compute results
    func = QUERY_MAPPING[query_type]
    try:
        if query_type == "demand_trend":
            result = func(daily_sales, item_id, final_df)
        else:
            result = func(final_df, item_id)
        
        # Return response matching the required output format
        import math
        if isinstance(result, float) and math.isnan(result):
            result = 0.0
            
        return {
            "item_id": item_id,
            "query": query_type,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/explore/recents")
def get_explore_recents():
    from supabase_client import supabase
    try:
        res = supabase.table("exploratory_chat_history").select("item_id, created_at").order("created_at", desc=True).limit(200).execute()
        items = []
        seen = set()
        for row in (res.data or []):
            if row["item_id"] not in seen:
                seen.add(row["item_id"])
                items.append(row["item_id"])
        return items
    except Exception as e:
        return []

@app.get("/explore/history/{item_id}")
def get_explore_history(item_id: str):
    from supabase_client import supabase
    from datetime import date
    try:
        today_str = date.today().isoformat()
        res = supabase.table("exploratory_chat_history").select("question, answer, created_at").eq("item_id", item_id).eq("created_date", today_str).order("created_at", desc=False).limit(50).execute()
        return res.data if res.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_chat")
def get_chat(item_id: str):
    from supabase_client import supabase
    from datetime import date
    try:
        today_str = date.today().isoformat()
        res = supabase.table("exploratory_chat_history").select("question, answer").eq("item_id", item_id).eq("created_date", today_str).order("created_at", desc=False).limit(50).execute()
        
        chat_format = []
        for row in (res.data or []):
            chat_format.append({"role": "user", "content": row["question"]})
            chat_format.append({"role": "assistant", "content": row["answer"]})
            
        return chat_format
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explore")
def explore_inventory(request: ExploreRequest):
    item_id = request.item_id.strip().upper()
    question = request.question
    context_data = request.context_data
    
    if not context_data:
        if item_id not in final_df["item_id"].values:
            raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found.")
        
        # Build the complete dictionary from the database dynamically
        product_df = final_df[final_df["item_id"] == item_id]
        p_dict = product_df.fillna(0).to_dict(orient="records")[0]
        
        p_dict["overstock_risk"] = get_overstock_risk(final_df, item_id)
        p_dict["stockout_risk"] = get_stockout_risk(final_df, item_id)
        p_dict["demand_trend"] = get_demand_trend(daily_sales, item_id, final_df)
        
        context_data = p_dict
            
    response_text = exploratory_query(final_df, item_id, question, context_data=context_data)
    
    return {"response": response_text}

@app.post("/add-product")
def add_product(request: AddProductRequest):
    import pandas as pd
    from supabase_client import supabase
    
    item_id = request.item_id.strip().upper()
    
    # Check if exists dynamically inside the persistence check using Supabase
    try:
        res = supabase.table("product_table").select("item_id").eq("item_id", item_id).execute()
        if res.data:
            raise HTTPException(status_code=400, detail=f"Item ID already exists")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # Product Table append
    try:
        supabase.table("product_table").insert({
            "item_id": item_id,
            "item_name": request.item_name,
            "category": request.category,
            "unit_price": request.unit_price,
            "is_deleted": False
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting product: {str(e)}")

    # Inventory Table append
    try:
        supabase.table("inventory_table").insert({
            "item_id": item_id,
            "current_stock": request.current_stock,
            "lead_time_days": request.lead_time_days,
            "is_deleted": False
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting inventory: {str(e)}")

    # Generate synthetic sales to bootstrap metrics
    try:
        import random
        
        # Discover the highest existing T-formatted transaction ID to maintain schema style
        max_tx_res = supabase.table("sales_transactions").select("transaction_id").like("transaction_id", "T%").order("transaction_id", desc=True).limit(1).execute()
        
        start_idx = 8000 # Fallback
        if max_tx_res.data:
            highest_id = max_tx_res.data[0]['transaction_id']
            try:
                start_idx = int(highest_id[1:])
            except ValueError:
                pass
                
        dates = pd.date_range(end=pd.Timestamp.now(), periods=30)
        synth_sales = []
        for i, d in enumerate(dates):
            synth_sales.append({
                "transaction_id": f"T{start_idx + i + 1:05d}",
                "date": d.strftime("%Y-%m-%d"),
                "item_id": item_id,
                "quantity_sold": 0
            })
        supabase.table("sales_transactions").insert(synth_sales).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting synthetic sales: {str(e)}")

    # Force dynamic pipeline hot-reload
    try:
        import time
        time.sleep(1.5) # Allow database replication/commit to settle
        reload_pipeline()
    except Exception as e:
        print(f"Error reloading pipeline: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh system state: {str(e)}")
    
    return {"message": "Product added successfully", "item_id": item_id}

@app.post("/compare")
def compare_products(request: CompareRequest):
    item_ids = [i.strip().upper() for i in request.item_ids if i.strip()]
    
    if not item_ids:
        raise HTTPException(status_code=400, detail="No item IDs provided.")
        
    if len(item_ids) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 items allowed for comparison.")
    
    filtered_df = final_df[final_df["item_id"].isin(item_ids)]
    # Only compare active ERP products
    filtered_df = filtered_df[filtered_df.apply(_is_erp_product, axis=1)]
    
    if filtered_df.empty:
        raise HTTPException(status_code=404, detail="None of the requested products were found in inventory.")
        
    results = []
    # Fill NaN values for safe rendering
    for p_dict in filtered_df.fillna(0).to_dict(orient="records"):
        item_id = p_dict["item_id"]
        
        # Ensure calculated fields are attached just like /product/{id}
        if "overstock_risk" not in p_dict:
            p_dict["overstock_risk"] = get_overstock_risk(final_df, item_id)
        if "stockout_risk" not in p_dict:
            p_dict["stockout_risk"] = get_stockout_risk(final_df, item_id)
        if "demand_trend" not in p_dict:
            p_dict["demand_trend"] = get_demand_trend(daily_sales, item_id, final_df)
            
            
        import math
        for key, val in p_dict.items():
            if isinstance(val, float) and math.isnan(val):
                p_dict[key] = 0.0
                
        results.append(p_dict)
        
    return results

@app.put("/edit-product")
def edit_product(request: EditProductRequest):
    from supabase_client import supabase
    item_id = request.item_id.strip().upper()

    try:
        supabase.table("product_table").update({
            "item_name": request.item_name,
            "category": request.category,
            "unit_price": request.unit_price
        }).eq("item_id", item_id).execute()

        supabase.table("inventory_table").update({
            "current_stock": request.current_stock,
            "lead_time_days": request.lead_time_days
        }).eq("item_id", item_id).execute()
        
        reload_pipeline()
        return {"message": "Product edited successfully", "item_id": item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error editing product: {str(e)}")

@app.post("/delete-product")
def delete_product(request: BasicProductRequest):
    from supabase_client import supabase
    item_id = request.item_id.strip().upper()

    try:
        supabase.table("product_table").update({"is_deleted": True}).eq("item_id", item_id).execute()
        supabase.table("inventory_table").update({"is_deleted": True}).eq("item_id", item_id).execute()
        reload_pipeline()
        return {"message": "Product moved to recycle bin", "item_id": item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")

@app.get("/recycle-bin")
def get_recycle_bin():
    from supabase_client import supabase
    try:
        res = supabase.table("product_table").select("*").eq("is_deleted", True).execute()
        return res.data if res.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recycle bin: {str(e)}")

@app.post("/restore-product")
def restore_product(request: BasicProductRequest):
    from supabase_client import supabase
    item_id = request.item_id.strip().upper()
    try:
        supabase.table("product_table").update({"is_deleted": False}).eq("item_id", item_id).execute()
        supabase.table("inventory_table").update({"is_deleted": False}).eq("item_id", item_id).execute()
        reload_pipeline()
        return {"message": "Product restored successfully", "item_id": item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restoring product: {str(e)}")

@app.delete("/permanent-delete-product")
def permanent_delete_product(request: BasicProductRequest):
    from supabase_client import supabase
    item_id = request.item_id.strip().upper()
    try:
        supabase.table("sales_transactions").delete().eq("item_id", item_id).execute()
        supabase.table("purchase_table").delete().eq("item_id", item_id).execute()
        supabase.table("inventory_table").delete().eq("item_id", item_id).execute()
        supabase.table("product_table").delete().eq("item_id", item_id).execute()
        reload_pipeline()
        return {"message": "Product permanently deleted", "item_id": item_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error permanently deleting product: {str(e)}")

@app.post("/billing/create")
def create_bill():
    from supabase_client import supabase
    try:
        res = supabase.table("billing_master").insert({"status": "draft"}).execute()
        return {"bill_id": res.data[0]["bill_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating draft bill: {str(e)}")

@app.post("/billing/add-item")
def add_bill_item(request: BillingAddItemRequest):
    from supabase_client import supabase
    
    item_id = request.item_id.strip().upper()
    quantity = request.quantity
    
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        
    row = final_df[final_df["item_id"] == item_id]
    if row.empty or not _is_erp_product(row.fillna(0).to_dict(orient="records")[0]):
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found or is inactive.")
        
    # Get unit price from product_table or final_df
    try:
        product_res = supabase.table("product_table").select("unit_price").eq("item_id", item_id).execute()
        unit_price = float(product_res.data[0]["unit_price"]) if product_res.data else 0.0
        
        # Check if item already in this bill
        existing = supabase.table("billing_items").select("*").eq("bill_id", request.bill_id).eq("item_id", item_id).execute()
        if existing.data:
            existing_row = existing.data[0]
            new_quantity = existing_row["quantity"] + quantity
            new_total = new_quantity * unit_price
            supabase.table("billing_items").update({
                "quantity": new_quantity,
                "total_price": new_total
            }).eq("id", existing_row["id"]).execute()
        else:
            total_price = quantity * unit_price
            supabase.table("billing_items").insert({
                "bill_id": request.bill_id,
                "item_id": item_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": total_price
            }).execute()
            
        return {"message": "Item added to bill successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding item to bill: {str(e)}")

@app.get("/billing/all-history")
def get_all_billing_history():
    from supabase_client import supabase
    try:
        res = supabase.table("sales_transactions").select("date, item_id, quantity_sold, transaction_id").order("transaction_id", desc=True).limit(2000).execute()
        sales = res.data or []
        
        sales = [s for s in sales if s.get("quantity_sold", 0) > 0]
        
        prod_res = supabase.table("product_table").select("item_id, item_name").execute()
        prod_map = {p["item_id"]: p.get("item_name", "Unknown") for p in (prod_res.data or [])}
        
        for s in sales:
            s["item_name"] = prod_map.get(s["item_id"], "Unknown Product")
            
        return sales
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching global history: {str(e)}")

@app.get("/billing/history")
def get_billing_history(customer_name: str = None):
    from supabase_client import supabase
    try:
        q = supabase.table("billing_master").select("*").eq("status", "completed").order("created_at", desc=True).limit(50)
        if customer_name:
            q = q.ilike("customer_name", f"%{customer_name}%")
        res = q.execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.get("/billing/product-history/{item_id}")
def get_billing_product_history(item_id: str):
    from supabase_client import supabase
    try:
        res = supabase.table("sales_transactions").select("date, quantity_sold").eq("item_id", item_id).order("date", desc=True).limit(30).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching product history: {str(e)}")

@app.get("/billing/{bill_id}")
def get_bill(bill_id: str):
    from supabase_client import supabase
    try:
        master_res = supabase.table("billing_master").select("*").eq("bill_id", bill_id).execute()
        if not master_res.data:
            raise HTTPException(status_code=404, detail="Bill not found")
            
        items_res = supabase.table("billing_items").select("*").eq("bill_id", bill_id).execute()
        
        return {
            "master": master_res.data[0],
            "items": items_res.data or []
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error fetching bill: {str(e)}")

@app.delete("/billing/remove-item")
def remove_bill_item(request: BillingRemoveItemRequest):
    from supabase_client import supabase
    try:
        supabase.table("billing_items").delete().eq("id", request.id).execute()
        return {"message": "Item removed from bill"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing item: {str(e)}")

@app.post("/billing/checkout")
def checkout_bill(request: BillingCheckoutRequest):
    import datetime
    from supabase_client import supabase
    
    bill_id = request.bill_id
    customer_name = request.customer_name

    try:
        items_res = supabase.table("billing_items").select("*").eq("bill_id", bill_id).execute()
        bill_items = items_res.data
        if not bill_items:
            raise HTTPException(status_code=400, detail="Cannot checkout an empty bill.")

        total_amount = sum(float(i["total_price"]) for i in bill_items)
        
        # 1. Validation phase (Stock & Active check)
        for item in bill_items:
            product_df = final_df[final_df["item_id"] == item["item_id"]]
            if product_df.empty or not _is_erp_product(product_df.fillna(0).to_dict(orient="records")[0]):
                raise HTTPException(status_code=400, detail=f"Product {item['item_id']} is no longer active.")
                
            inv_res = supabase.table("inventory_table").select("current_stock").eq("item_id", item["item_id"]).execute()
            current_stock = inv_res.data[0]["current_stock"] if inv_res.data else 0
            if current_stock < item["quantity"]:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {item['item_id']}. Available: {current_stock}")

        # 2. Execution phase
        
        # Get start index for transaction ID
        max_tx_res = supabase.table("sales_transactions").select("transaction_id").like("transaction_id", "T%").order("transaction_id", desc=True).limit(1).execute()
        start_idx = 0
        if max_tx_res.data:
            highest_id = max_tx_res.data[0]['transaction_id']
            try: start_idx = int(highest_id[1:])
            except: pass

        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        new_transactions = []
        
        for i, item in enumerate(bill_items):
            item_id = item["item_id"]
            qty = item["quantity"]
            
            # Reduce inventory (direct update)
            inv_res = supabase.table("inventory_table").select("current_stock").eq("item_id", item_id).execute()
            if inv_res.data:
                new_stock = inv_res.data[0]["current_stock"] - qty
                supabase.table("inventory_table").update({"current_stock": new_stock}).eq("item_id", item_id).execute()

            new_tx_id = f"T{start_idx + i + 1:05d}"
            new_transactions.append({
                "transaction_id": new_tx_id,
                "date": date_str,
                "item_id": item_id,
                "quantity_sold": qty
            })
            
        supabase.table("sales_transactions").insert(new_transactions).execute()
        
        # Mark master as completed
        supabase.table("billing_master").update({
            "status": "completed",
            "customer_name": customer_name,
            "total_amount": total_amount
        }).eq("bill_id", bill_id).execute()
        
        reload_pipeline()
        
        return {
            "message": "Bill generated successfully",
            "bill_id": bill_id,
            "total_amount": total_amount
        }
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=f"Error executing checkout: {str(e)}")





@app.get("/market-basket/top-groups")
def get_top_market_basket_groups():
    from supabase_client import supabase
    try:
        # Fetch top 100 recommendations by lift to populate dashboard and filters
        res = supabase.table("market_basket_recommendations").select("item_id, recommended_item_id, confidence, support, lift, source").order("lift", desc=True).order("confidence", desc=True).limit(100).execute()
        
        if not res.data:
            return []
            
        # Extract unique item IDs to resolve names
        all_ids = set()
        for row in res.data:
            all_ids.add(row["item_id"])
            all_ids.add(row["recommended_item_id"])
            
        prod_res = supabase.table("product_table").select("item_id, item_name, category, unit_price").in_("item_id", list(all_ids)).execute()
        prod_map = {p["item_id"]: p for p in (prod_res.data or [])}
        
        results = []
        for row in res.data:
            item_a_id = row["item_id"]
            item_b_id = row["recommended_item_id"]
            
            p_a = prod_map.get(item_a_id, {})
            p_b = prod_map.get(item_b_id, {})
            
            a_name = p_a.get("item_name", item_a_id)
            b_name = p_b.get("item_name", item_b_id)
            
            lift_val = row.get("lift", 1.0)
            
            strength_label = "Weak"
            if lift_val >= 3.0:
                strength_label = "Very Strong"
            elif lift_val >= 2.0:
                strength_label = "Strong"
            elif lift_val >= 1.5:
                strength_label = "Moderate"
                
            desc = f"Customers buying {a_name} are {lift_val}x more likely to buy {b_name}."
            
            results.append({
                "item_id": item_a_id,
                "item_name": a_name,
                "recommended_item_id": item_b_id,
                "recommended_item_name": b_name,
                "category": p_b.get("category", "Uncategorized"),
                "unit_price": p_b.get("unit_price", 0.0),
                "confidence": row.get("confidence", 0),
                "support": row.get("support", 0.0),
                "lift": lift_val,
                "strength_label": strength_label,
                "description": desc,
                "source": row.get("source", "apriori")
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top market basket groups: {str(e)}")

@app.get("/market-basket/{item_id}")
def get_market_basket(item_id: str):
    from supabase_client import supabase
    try:
        # Fetch the item's name for the description
        orig_res = supabase.table("product_table").select("item_name").eq("item_id", item_id).execute()
        orig_name = orig_res.data[0]["item_name"] if orig_res.data else item_id
        
        # Order by lift as per new logic
        res = supabase.table("market_basket_recommendations").select("recommended_item_id, confidence, support, lift, source").eq("item_id", item_id).order("lift", desc=True).limit(5).execute()
        
        if not res.data:
            return []
            
        recommended_ids = [row["recommended_item_id"] for row in res.data]
        
        prod_res = supabase.table("product_table").select("item_id, item_name, category, unit_price").in_("item_id", recommended_ids).execute()
        
        prod_map = {p["item_id"]: p for p in (prod_res.data or [])}
        
        results = []
        for row in res.data:
            rec_id = row["recommended_item_id"]
            p_info = prod_map.get(rec_id, {})
            rec_name = p_info.get("item_name", "Unknown Product")
            
            lift_val = row.get("lift", 1.0)
            
            desc = f"Customers buying {orig_name} are {lift_val}x more likely to buy {rec_name}."
            
            results.append({
                "item_id": rec_id,  # keep for backward compatibility
                "recommended_item_id": rec_id,
                "recommended_item_name": rec_name,
                "category": p_info.get("category", "Uncategorized"),
                "unit_price": p_info.get("unit_price", 0.0),
                "confidence": row.get("confidence", 0),
                "support": row.get("support", 0.0),
                "lift": lift_val,
                "description": desc,
                "source": row.get("source", "apriori")
            })
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing market basket: {str(e)}")

@app.post("/restock")
def restock_inventory(request: BatchRestockRequest):
    import datetime
    from supabase_client import supabase
    
    try:
        if not request.items:
            raise HTTPException(status_code=400, detail="Cannot restock an empty batch.")
            
        for item in request.items:
            # Check inventory limit or existence
            inv_res = supabase.table("inventory_table").select("current_stock").eq("item_id", item.item_id).execute()
            if not inv_res.data:
                continue # Skip or raise? usually skip or init.
                
            current_stock = inv_res.data[0]["current_stock"]
            new_stock = current_stock + item.quantity_added
            
            # Update Stock
            supabase.table("inventory_table").update({"current_stock": new_stock}).eq("item_id", item.item_id).execute()
            
            # Insert History
            supabase.table("item_history").insert({
                "item_id": item.item_id,
                "product_name": item.product_name,
                "quantity_added": item.quantity_added,
                "type": "RESTOCK"
            }).execute()

        import time
        time.sleep(1.5) # Settle database connections/replication before heavily querying for reload

        # Recalculate metrics by reloading global state or local logic.
        # Since reload_pipeline fully mirrors Supabase table state to memory, we use it natively.
        reload_pipeline()
        
        return {"message": "Batch restock completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete restock: {str(e)}")

@app.get("/restock-history")
def get_restock_history():
    from supabase_client import supabase
    try:
        res = supabase.table("item_history").select("*").order("created_at", desc=True).limit(100).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch restock history: {str(e)}")

@app.post("/alert/whatsapp")
def send_whatsapp_alert(request: WhatsAppAlertRequest):
    import os
    from dotenv import load_dotenv
    
    try:
        import pywhatkit
    except ImportError:
        raise HTTPException(status_code=500, detail="pywhatkit is not installed. Please install it on the backend.")

    load_dotenv(override=True)
    phone_number = os.getenv("GODOWN_PHONE_NUMBER")
    
    if not phone_number or phone_number.strip() == "":
        raise HTTPException(status_code=500, detail="GODOWN_PHONE_NUMBER is not set in .env")
        
    try:
        pywhatkit.sendwhatmsg_instantly(phone_number, request.message, 15, True, 3)
        return {"message": "WhatsApp alert sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send WhatsApp message: {str(e)}")

@app.get("/predictive-inventory")
def get_predictive_inventory():
    try:
        df_copy = final_df.copy().fillna(0)
        # Active Predictive Stocks (Excluding those in Review Window)
        active_stocks = df_copy[
            ((df_copy["predictive_tag"] == "EXPS") | (df_copy["predictive_tag"] == "PS")) & 
            (~df_copy["inventory_mode"].isin(["REVIEW_MANUAL", "REVIEW_DEADLINE"]))
        ].to_dict(orient="records")
        
        # Godown Recommendations (PS logic)
        raw_godown_recs = globals().get("active_godown_recs", [])
        
        # Filter out items that are in the review window
        reverted_ids = set(df_copy[df_copy["inventory_mode"].isin(["REVIEW_MANUAL", "REVIEW_DEADLINE"])]["item_id"])
        godown_recs = [rec for rec in raw_godown_recs if rec["item_id"] not in reverted_ids]
        
        # Predictive Review Window
        review_deadline = df_copy[df_copy["inventory_mode"] == "REVIEW_DEADLINE"].to_dict(orient="records")
        review_manual = df_copy[df_copy["inventory_mode"] == "REVIEW_MANUAL"].to_dict(orient="records")
        
        # Fetch unapproved expired items dynamically
        try:
            from processing_layer.predictive_inventory import fetch_expired_predictive_products
            unapproved_expired = fetch_expired_predictive_products()
            existing_ids = set(df_copy["item_id"])
            unapproved_expired_filtered = [item for item in unapproved_expired if item["item_id"] not in existing_ids]
            review_deadline.extend(unapproved_expired_filtered)
        except Exception as e:
            print(f"[ERROR] Failed to fetch unapproved expired products: {e}")
        
        return {
            "active_stocks": active_stocks,
            "godown_recommendations": godown_recs,
            "review_deadline": review_deadline,
            "review_manual": review_manual
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predictive/run")
def manual_predictive_run():
    try:
        reload_pipeline()
        return {"message": "Predictive Engine run successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PredictiveActionRequest(BaseModel):
    item_id: str
    action: str # "KEEP", "NORMAL", "DISCONTINUE"

@app.post("/predictive/review")
def predictive_review_action(request: PredictiveActionRequest):
    from supabase_client import supabase
    try:
        # Check if product exists
        res = supabase.table("product_table").select("item_id").eq("item_id", request.item_id).execute()
        if not res.data:
            # Look up metadata from expired items
            from processing_layer.predictive_inventory import fetch_expired_predictive_products
            all_expired = fetch_expired_predictive_products()
            matching_item = next((item for item in all_expired if item["item_id"] == request.item_id), None)
            
            item_name = matching_item["item_name"] if matching_item else "Unknown"
            category = matching_item["category"] if matching_item else "General"
            unit_price = matching_item["unit_price"] if matching_item else 0.0
            
            new_prod = {
                "item_id": request.item_id,
                "item_name": item_name,
                "category": category,
                "unit_price": unit_price,
                "inventory_mode": "EXCLUDED" if request.action == "EXCLUDE" else "NORMAL",
                "predictive_tag": "",
                "predictive_score": 0
            }
            try:
                supabase.table("product_table").insert(new_prod).execute()
            except Exception as e:
                err_str = str(e).lower()
                if "pgrst204" in err_str or "could not find" in err_str:
                    basic_prod = {k: v for k, v in new_prod.items() if k in ["item_id", "item_name", "category", "unit_price"]}
                    supabase.table("product_table").insert(basic_prod).execute()
                    MANUAL_OVERRIDES[request.item_id] = {"inventory_mode": new_prod["inventory_mode"], "predictive_tag": "", "predictive_score": 0}
                else: raise e
                
            try:
                supabase.table("inventory_table").insert({
                    "item_id": request.item_id,
                    "current_stock": 0,
                    "lead_time_days": 2
                }).execute()
            except Exception as e:
                print(f"[ERROR] Failed to insert to inventory_table: {e}")
        else:
            if request.action == "NORMAL":
                try:
                    supabase.table("product_table").update({"inventory_mode": "NORMAL", "predictive_tag": "", "predictive_score": 0}).eq("item_id", request.item_id).execute()
                except Exception as e:
                    if "pgrst204" in str(e).lower() or "could not find" in str(e).lower():
                        MANUAL_OVERRIDES[request.item_id] = {"inventory_mode": "NORMAL", "predictive_tag": "", "predictive_score": 0}
                    else: raise e
            elif request.action == "EXCLUDE":
                try:
                    supabase.table("product_table").update({"inventory_mode": "EXCLUDED", "predictive_tag": "", "predictive_score": 0}).eq("item_id", request.item_id).execute()
                except Exception as e:
                    if "pgrst204" in str(e).lower() or "could not find" in str(e).lower():
                        MANUAL_OVERRIDES[request.item_id] = {"inventory_mode": "EXCLUDED", "predictive_tag": "", "predictive_score": 0}
                    else: raise e
            elif request.action == "DISCONTINUE":
                supabase.table("product_table").update({"is_deleted": True}).eq("item_id", request.item_id).execute()
                supabase.table("inventory_table").update({"is_deleted": True}).eq("item_id", request.item_id).execute()
            elif request.action == "PREDICTIVE":
                try:
                    supabase.table("product_table").update({"inventory_mode": "PREDICTIVE"}).eq("item_id", request.item_id).execute()
                except Exception as e:
                    if "pgrst204" in str(e).lower() or "could not find" in str(e).lower():
                        MANUAL_OVERRIDES[request.item_id] = {"inventory_mode": "PREDICTIVE"}
                    else: raise e
        
        reload_pipeline()
        return {"message": f"Action {request.action} applied to {request.item_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BasicProductRequest(BaseModel):
    item_id: str
    item_name: str = "Unknown"
    category: str = "Unknown"
    unit_price: float = 0.0

@app.post("/predictive/revert")
def predictive_revert(request: BasicProductRequest):
    from supabase_client import supabase
    try:
        # Check if product exists first
        res = supabase.table("product_table").select("item_id").eq("item_id", request.item_id).execute()
        if not res.data:
            # Insert product if it doesn't exist
            new_prod = {
                "item_id": request.item_id,
                "item_name": request.item_name,
                "category": request.category,
                "unit_price": request.unit_price,
                "inventory_mode": "REVIEW_MANUAL"
            }
            try:
                supabase.table("product_table").insert(new_prod).execute()
            except Exception as e:
                err_str = str(e).lower()
                if "pgrst204" in err_str or "could not find" in err_str:
                    basic_prod = {k: v for k, v in new_prod.items() if k in ["item_id", "item_name", "category", "unit_price"]}
                    supabase.table("product_table").insert(basic_prod).execute()
                    MANUAL_OVERRIDES[request.item_id] = {"inventory_mode": "REVIEW_MANUAL"}
                else: raise e
                
            # Also insert to inventory_table with 0 stock
            supabase.table("inventory_table").insert({
                "item_id": request.item_id,
                "current_stock": 0,
                "lead_time_days": 2
            }).execute()
        else:
            try:
                supabase.table("product_table").update({
                    "inventory_mode": "REVIEW_MANUAL"
                }).eq("item_id", request.item_id).execute()
            except Exception as e:
                err_str = str(e).lower()
                if "pgrst204" in err_str or "could not find" in err_str:
                    MANUAL_OVERRIDES[request.item_id] = {"inventory_mode": "REVIEW_MANUAL"}
                else:
                    raise e
                
        reload_pipeline()
        return {"message": f"Product {request.item_id} moved to Review Window (Manual)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ApproveRequest(BaseModel):
    item_id: str
    item_name: str
    category: str
    unit_price: float = 0.0
    suggested_qty: int = 0
    predictive_score: int = 0
    predictive_reason: str = ""

@app.post("/predictive/approve")
def predictive_approve(request: ApproveRequest):
    from supabase_client import supabase
    from datetime import datetime
    try:
        # Check if product exists to avoid duplicates
        existing = supabase.table("product_table").select("item_id").eq("item_id", request.item_id).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update existing — also update unit_price if provided
            db_update = {
                "inventory_mode": "PREDICTIVE",
                "predictive_tag": "PS",
                "predictive_score": request.predictive_score,
                "predictive_reason": request.predictive_reason,
                "approval_timestamp": datetime.now().isoformat()
            }
            if request.unit_price and request.unit_price > 0:
                db_update["unit_price"] = request.unit_price
            try:
                supabase.table("product_table").update(db_update).eq("item_id", request.item_id).execute()
            except Exception as e:
                err_str = str(e).lower()
                if "approval_timestamp" in err_str:
                    del db_update["approval_timestamp"]
                    try:
                        supabase.table("product_table").update(db_update).eq("item_id", request.item_id).execute()
                    except Exception as e2:
                        if "pgrst204" in str(e2).lower() or "could not find" in str(e2).lower():
                            MANUAL_OVERRIDES[request.item_id] = db_update
                        else: raise e2
                elif "pgrst204" in err_str or "could not find" in err_str:
                    MANUAL_OVERRIDES[request.item_id] = db_update
                else: raise e
        else:
            # Insert new
            new_prod = {
                "item_id": request.item_id,
                "item_name": request.item_name,
                "category": request.category,
                "unit_price": request.unit_price if request.unit_price and request.unit_price > 0 else 0,
                "inventory_mode": "PREDICTIVE",
                "predictive_tag": "PS",
                "predictive_score": request.predictive_score,
                "predictive_reason": request.predictive_reason,
                "approval_timestamp": datetime.now().isoformat()
            }
            try:
                supabase.table("product_table").insert(new_prod).execute()
            except Exception as e:
                err_str = str(e).lower()
                if "approval_timestamp" in err_str:
                    del new_prod["approval_timestamp"]
                    try:
                        supabase.table("product_table").insert(new_prod).execute()
                    except Exception as e2:
                        if "pgrst204" in str(e2).lower() or "could not find" in str(e2).lower():
                            basic_prod = {k: v for k, v in new_prod.items() if k in ["item_id", "item_name", "category", "unit_price"]}
                            supabase.table("product_table").insert(basic_prod).execute()
                            MANUAL_OVERRIDES[request.item_id] = {k: v for k, v in new_prod.items() if k not in ["item_id", "item_name", "category", "unit_price"]}
                        else: raise e2
                elif "pgrst204" in err_str or "could not find" in err_str:
                    basic_prod = {k: v for k, v in new_prod.items() if k in ["item_id", "item_name", "category", "unit_price"]}
                    supabase.table("product_table").insert(basic_prod).execute()
                    MANUAL_OVERRIDES[request.item_id] = {k: v for k, v in new_prod.items() if k not in ["item_id", "item_name", "category", "unit_price"]}
                else: raise e
            
            # Also insert to inventory_table with 0 stock
            supabase.table("inventory_table").insert({
                "item_id": request.item_id,
                "current_stock": 0,
                "lead_time_days": 1,
                "is_deleted": False
            }).execute()

        reload_pipeline()
        return {"message": f"Product {request.item_id} approved."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================================
# CUSTOMER PORTAL INTEGRATION (DATABASE MODELS, FALLBACKS & ENDPOINTS)
# =====================================================================
import os
import json
import uuid
import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scratch", "orders_db.json")

def load_local_db():
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"customers": [], "orders": [], "order_items": []}

def save_local_db(data):
    try:
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving local DB: {e}")

def table_exists_in_supabase(table_name):
    from supabase_client import supabase
    try:
        supabase.table(table_name).select("count", count="exact").limit(1).execute()
        return True
    except Exception as e:
        err_str = str(e).lower()
        if "does not exist" in err_str or "not found" in err_str or "404" in err_str or "pgrst204" in err_str:
            return False
        return False

def db_get_customers():
    from supabase_client import supabase
    res = supabase.table("customers").select("*").execute()
    return res.data or []

def db_add_customer(customer_name):
    customers = db_get_customers()
    for c in customers:
        if c["customer_name"].lower() == customer_name.strip().lower():
            return c

    cust_id = str(uuid.uuid4())
    new_c = {
        "customer_id": cust_id,
        "customer_name": customer_name.strip(),
        "created_at": datetime.datetime.now().isoformat()
    }
    
    from supabase_client import supabase
    res = supabase.table("customers").insert(new_c).execute()
    if res.data:
        return res.data[0]
    raise HTTPException(status_code=500, detail="Failed to insert customer to Supabase")

def db_get_orders(customer_id=None, customer_name=None):
    from supabase_client import supabase
    query = supabase.table("orders").select("*").order("created_at", desc=True)
    if customer_id:
        query = query.eq("customer_id", customer_id)
    elif customer_name:
        query = query.eq("customer_name", customer_name)
    res = query.execute()
    return res.data or []

def db_get_order_items(order_id):
    from supabase_client import supabase
    res = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
    return res.data or []

def db_create_order(order_id, customer_id, customer_name, total_amount, status, items):
    new_order = {
        "order_id": order_id,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "total_amount": float(total_amount),
        "status": status,
        "created_at": datetime.datetime.now().isoformat()
    }
    
    new_items = []
    for it in items:
        new_items.append({
            "order_item_id": str(uuid.uuid4()),
            "order_id": order_id,
            "product_id": it.product_id,
            "quantity": int(it.quantity),
            "price": float(it.price),
            "subtotal": float(it.subtotal),
            "created_at": datetime.datetime.now().isoformat()
        })
        
    from supabase_client import supabase
    supabase.table("orders").insert(new_order).execute()
    supabase.table("order_items").insert(new_items).execute()
    return new_order, new_items

def db_update_order_status(order_id, status):
    from supabase_client import supabase
    res = supabase.table("orders").update({"status": status}).eq("order_id", order_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found to update status")
    return True

# Pydantic request models
class CustomerLoginRequest(BaseModel):
    customer_name: str

class OrderItemInput(BaseModel):
    product_id: str
    quantity: int
    price: float
    subtotal: float

class CreateOrderRequest(BaseModel):
    customer_name: str
    total_amount: float
    items: list[OrderItemInput]

class UpdateOrderStatusRequest(BaseModel):
    status: str

@app.post("/customer/login")
def customer_login(request: CustomerLoginRequest):
    if not request.customer_name.strip():
        raise HTTPException(status_code=400, detail="Customer name is required.")
    customer = db_add_customer(request.customer_name)
    return {
        "customer_id": customer["customer_id"],
        "customer_name": customer["customer_name"]
    }

@app.get("/customer/orders")
def get_customer_orders(customer_name: str):
    orders = db_get_orders(customer_name=customer_name)
    results = []
    for order in orders:
        items = db_get_order_items(order["order_id"])
        
        # Attach product details for convenience
        details_items = []
        for it in items:
            p_dict = {}
            p_info = final_df[final_df["item_id"] == it["product_id"]]
            if not p_info.empty:
                p_dict = p_info.fillna(0).to_dict(orient="records")[0]
            details_items.append({
                **it,
                "product_name": p_dict.get("item_name", it["product_id"])
            })
            
        results.append({
            **order,
            "items": details_items
        })
    return results

@app.post("/customer/orders")
def place_customer_order(request: CreateOrderRequest):
    # 1. Validate Stock
    for it in request.items:
        product_df = final_df[final_df["item_id"] == it.product_id]
        if product_df.empty or not _is_erp_product(product_df.fillna(0).to_dict(orient="records")[0]):
            raise HTTPException(status_code=400, detail=f"Product '{it.product_id}' not found or is inactive.")
        current_stock = float(product_df["current_stock"].values[0])
        if it.quantity > current_stock:
            raise HTTPException(status_code=400, detail=f"Insufficient Stock for '{product_df['item_name'].values[0] or it.product_id}'. Available: {int(current_stock)}")

    # 2. Get Customer details
    customer = db_add_customer(request.customer_name)
    customer_id = customer["customer_id"]

    # 3. Generate Order ID: ORD-YYYYMMDD-Sequence
    today_str = datetime.datetime.now().strftime("%Y%m%d")
    existing_orders = db_get_orders()
    today_orders = [o for o in existing_orders if o["order_id"].startswith(f"ORD-{today_str}-")]
    
    seq = 1
    if today_orders:
        suffixes = []
        for o in today_orders:
            try:
                suffixes.append(int(o["order_id"].split("-")[-1]))
            except ValueError:
                pass
        if suffixes:
            seq = max(suffixes) + 1
            
    order_id = f"ORD-{today_str}-{seq:03d}"

    # 4. Save Order records
    order, items = db_create_order(order_id, customer_id, request.customer_name, request.total_amount, "Confirmed", request.items)

    # 5. Reduce stock in inventory_table
    from supabase_client import supabase
    for it in request.items:
        product_id = it.product_id
        qty = it.quantity
        
        # Deduct local memory final_df
        idx = final_df.index[final_df["item_id"] == product_id]
        if not idx.empty:
            final_df.loc[idx, "current_stock"] -= qty
            
        # Deduct in database inventory_table
        try:
            inv_res = supabase.table("inventory_table").select("current_stock").eq("item_id", product_id).execute()
            if inv_res.data:
                new_stock = inv_res.data[0]["current_stock"] - qty
                supabase.table("inventory_table").update({"current_stock": new_stock}).eq("item_id", product_id).execute()
        except Exception as e:
            print(f"Supabase stock deduction failed for {product_id}: {e}")

    # 6. Generate Billing Record
    bill_id = str(uuid.uuid4())
    billing_success = False
    try:
        supabase.table("billing_master").insert({
            "bill_id": bill_id,
            "customer_name": request.customer_name,
            "total_amount": float(request.total_amount),
            "status": "completed"
        }).execute()
        
        for it in request.items:
            supabase.table("billing_items").insert({
                "bill_id": bill_id,
                "item_id": it.product_id,
                "quantity": int(it.quantity),
                "unit_price": float(it.price),
                "total_price": float(it.subtotal)
            }).execute()
        billing_success = True
    except Exception as e:
        print(f"Supabase billing record creation failed: {e}")

    # 7. Generate Sales Transaction for Forecasting
    try:
        max_tx_res = supabase.table("sales_transactions").select("transaction_id").like("transaction_id", "T%").order("transaction_id", desc=True).limit(1).execute()
        start_idx = 8000
        if max_tx_res.data:
            highest_id = max_tx_res.data[0]['transaction_id']
            try:
                start_idx = int(highest_id[1:])
            except:
                pass
        
        date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        new_txs = []
        for idx, it in enumerate(request.items):
            new_txs.append({
                "transaction_id": f"T{start_idx + idx + 1:05d}",
                "date": date_str,
                "item_id": it.product_id,
                "quantity_sold": int(it.quantity)
            })
        supabase.table("sales_transactions").insert(new_txs).execute()
    except Exception as e:
        print(f"Supabase sales transaction failed: {e}")

    # Reload pipeline to refresh forecasting state with the new transactions
    try:
        reload_pipeline()
    except Exception as e:
        print(f"Pipeline reload failed: {e}")

    return {
        "message": "Order Placed Successfully",
        "order_id": order_id,
        "status": "Confirmed",
        "total_amount": request.total_amount,
        "items": [
            {
                "product_id": it.product_id,
                "quantity": it.quantity,
                "price": it.price,
                "subtotal": it.subtotal
            } for it in request.items
        ]
    }

@app.get("/customer/recommendations/{product_id}")
def get_customer_recommendations(product_id: str, strict: bool = False):
    recommendations = []
    
    # 1. Fetch from market_basket_recommendations
    if table_exists_in_supabase("market_basket_recommendations"):
        try:
            from supabase_client import supabase
            res = supabase.table("market_basket_recommendations").select("recommended_item_id, confidence, lift").eq("item_id", product_id).order("lift", desc=True).limit(20).execute()
            if res.data:
                for row in res.data:
                    lift_val = row.get("lift", 1.0)
                    if strict and lift_val < 1.5:
                        continue
                    p_info = final_df[final_df["item_id"] == row["recommended_item_id"]]
                    if not p_info.empty:
                        p_dict = p_info.fillna(0).to_dict(orient="records")[0]
                        if _is_erp_product(p_dict):
                            try:
                                has_stock = float(p_dict.get("current_stock", 0)) > 0
                            except (ValueError, TypeError):
                                has_stock = False
                            
                            if has_stock:
                                p_dict["lift"] = lift_val
                                p_dict["confidence"] = row.get("confidence", 0)
                                recommendations.append(p_dict)
                                if len(recommendations) >= 5:
                                    break
        except Exception as e:
            print(f"[ERROR] customer recommendations: {e}")
            
    # 2. Fallback: products from same category
    if not strict and not recommendations:
        p_info = final_df[final_df["item_id"] == product_id]
        if not p_info.empty:
            cat = p_info["category"].values[0]
            related = final_df[(final_df["category"] == cat) & (final_df["item_id"] != product_id)]
            for _, r_row in related.iterrows():
                r_dict = r_row.to_dict()
                if _is_erp_product(r_dict):
                    try:
                        has_stock = float(r_dict.get("current_stock", 0)) > 0
                    except (ValueError, TypeError):
                        has_stock = False
                    if has_stock:
                        recommendations.append(r_dict)
                        if len(recommendations) >= 3:
                            break
                
    # 3. Final Fallback: any 3 products
    if not strict and not recommendations:
        related = final_df[final_df["item_id"] != product_id]
        for _, r_row in related.iterrows():
            r_dict = r_row.to_dict()
            if _is_erp_product(r_dict):
                try:
                    has_stock = float(r_dict.get("current_stock", 0)) > 0
                except (ValueError, TypeError):
                    has_stock = False
                if has_stock:
                    recommendations.append(r_dict)
                    if len(recommendations) >= 3:
                        break
            
    return recommendations

@app.get("/admin/orders")
def get_admin_orders():
    orders = db_get_orders()
    results = []
    for order in orders:
        items = db_get_order_items(order["order_id"])
        
        details_items = []
        for it in items:
            p_dict = {}
            p_info = final_df[final_df["item_id"] == it["product_id"]]
            if not p_info.empty:
                p_dict = p_info.fillna(0).to_dict(orient="records")[0]
            details_items.append({
                **it,
                "product_name": p_dict.get("item_name", it["product_id"])
            })
            
        results.append({
            **order,
            "items": details_items
        })
    return results

@app.put("/admin/orders/{order_id}")
def update_admin_order(order_id: str, request: UpdateOrderStatusRequest):
    if request.status not in ["Pending", "Confirmed", "Processing", "Delivered", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status option.")
    db_update_order_status(order_id, request.status)
    return {
        "message": "Order status updated successfully",
        "order_id": order_id,
        "status": request.status
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
