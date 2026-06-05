import sys
import re

aq_path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\query_layer\analytical_queries.py'

with open(aq_path, 'r', encoding='utf-8') as f:
    aq_orig = f.read()

old_func_regex = r'def get_demand_trend\(daily_sales.*?return "Stable"\n'
new_func = """def get_demand_trend(daily_sales, item_id):
    import pandas as pd
    
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
"""

aq_new = re.sub(old_func_regex, new_func, aq_orig, flags=re.DOTALL)
with open(aq_path, 'w', encoding='utf-8') as f:
    f.write(aq_new)

print("Updated demand trend logic successfully.")
