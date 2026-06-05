import sys
import re
import os

aq_path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\query_layer\analytical_queries.py'
app_path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\app.py'

# 1. Update analytical_queries.py
with open(aq_path, 'r', encoding='utf-8') as f:
    aq_orig = f.read()

old_func_regex = r'def get_demand_trend\(df, item_id\):.*?return "Stable"\n'
new_func = """def get_demand_trend(daily_sales, item_id):
    import pandas as pd
    
    # Use daily_sales data
    df = daily_sales[daily_sales["item_id"] == item_id].copy()
    
    if df.empty:
        return "New"

    # Sort by date
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(by="date", ascending=False)
    
    # If insufficient data
    if len(df) < 3: 
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
"""

aq_new = re.sub(old_func_regex, new_func, aq_orig, flags=re.DOTALL)
with open(aq_path, 'w', encoding='utf-8') as f:
    f.write(aq_new)

# 2. Update app.py
with open(app_path, 'r', encoding='utf-8') as f:
    app_orig = f.read()

# Replace get_demand_trend(final_df, x) -> get_demand_trend(daily_sales, x)
app_new = app_orig.replace('get_demand_trend(final_df, ', 'get_demand_trend(daily_sales, ')

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_new)

print("Updated demand trend logic successfully.")
