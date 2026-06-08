import pandas as pd

def get_safety_stock(df, item_id):
    row = df[df["item_id"] == item_id]
    if row.empty:
        return "Item not found"

    return round(row["safety_stock"].values[0], 2)


def get_demand_trend(daily_sales, item_id, final_df=None):
    import pandas as pd
    
    # Check if this item is healthy (overstock -> NO, stockout -> NO). If so, trend is Stable.
    target_df = None
    if final_df is not None:
        target_df = final_df
    elif daily_sales is not None and hasattr(daily_sales, "columns") and "reorder_needed" in daily_sales.columns:
        target_df = daily_sales

    if target_df is not None:
        from query_layer.boolean_queries import get_stockout_risk, get_overstock_risk
        try:
            stockout = get_stockout_risk(target_df, item_id)
            overstock = get_overstock_risk(target_df, item_id)
            if stockout == "NO" and overstock == "NO":
                return "Stable"
        except Exception:
            pass

    # Use daily_sales data
    df = daily_sales[daily_sales["item_id"] == item_id].copy()
    
    if df.empty or df["quantity_sold"].sum() == 0:
        return "New"

    # Sort by date
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(by="date", ascending=True)
    
    # If insufficient data
    if len(df) < 5: 
        return "Stable"

    # Take last 7 days
    recent_data = df.tail(7)
    
    # Split into two halves
    first_half = recent_data.head(3)
    second_half = recent_data.tail(3)

    # Compute averages
    past_avg = first_half["quantity_sold"].mean()
    recent_avg = second_half["quantity_sold"].mean()
    
    # Trend rules
    if recent_avg > past_avg * 1.1:
        return "Increasing"
    elif recent_avg < past_avg * 0.9:
        return "Decreasing"
    else:
        return "Stable"

    # Split into recent (last 5 sales days) and past (previous 5-10 sales days)
    recent = df.head(5)
    past = df.iloc[5:10]
    
    if past.empty:
        return "Stable"

    # Compute averages
    recent_avg = recent["quantity_sold"].mean()
    past_avg = past["quantity_sold"].mean()
    
    # Trend rules
    if recent_avg > past_avg * 1.1:
        return "Increasing"
    elif recent_avg < past_avg * 0.9:
        return "Decreasing"
    else:
        return "Stable"
        
    # Check if the product has zero baseline history
    if row["avg_daily_demand"].values[0] == 0.0 and row["rolling_30_day_demand"].values[0] == 0.0:
        return "New"

    # Handle missing values safely
    if "final_demand" not in df.columns or pd.isna(row["final_demand"].values[0]):
        return "Stable"

    item_demand = row["final_demand"].values[0]
    overall_avg = df["final_demand"].mean()

    # Match frontend dashboard logic for High vs Low demand
    if item_demand > overall_avg:
        return "Increasing"
    elif item_demand < (overall_avg * 0.7):
        return "Decreasing"
    else:
        return "Stable"