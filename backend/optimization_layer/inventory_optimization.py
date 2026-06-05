import pandas as pd

def calculate_inventory_metrics(final_demand, std_dev, inventory):

    # Merge all required data
    df = inventory.merge(final_demand, on="item_id", how="left")
    df = df.merge(std_dev, on="item_id", how="left")

    # ✅ handle missing values FIRST
    df["demand_std_dev"] = df["demand_std_dev"].fillna(0)
    df["final_demand"] = df["final_demand"].fillna(0)

    # Use lead time
    lead_time = df["lead_time_days"]

    # 1. Safety Stock
    df["safety_stock"] = df["demand_std_dev"] * (lead_time ** 0.5)

    # 2. Reorder Point
    df["reorder_point"] = (
        df["final_demand"] * lead_time +
        df["safety_stock"]
    )

    # 3. Reorder Decision
    df["reorder_needed"] = df["current_stock"] < df["reorder_point"]

    # 4. Reorder Quantity
    minimum_order_quantity = 30
    
    # Calculate base quantities
    df["gap"] = df["reorder_point"] - df["current_stock"]
    df["max_stock_limit"] = df["reorder_point"] * 1.5
    df["allowed_addition"] = df["max_stock_limit"] - df["current_stock"]

    def calculate_qty(row):
        gap = row["gap"]
        allowed = row["allowed_addition"]
        current = row["current_stock"]
        limit = row["max_stock_limit"]
        
        if pd.isna(gap):
            return minimum_order_quantity
            
        if current >= limit:
            return 0
            
        return max(0, round(min(max(gap, minimum_order_quantity), allowed)))

    df["reorder_quantity"] = df.apply(calculate_qty, axis=1)
    
    # Cleanup temporary columns
    df = df.drop(columns=["gap", "max_stock_limit", "allowed_addition"])

    return df