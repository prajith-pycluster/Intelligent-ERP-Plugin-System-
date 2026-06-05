import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\app.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

old_logic = """    # Extract historical demand data for the graph
    data = daily_sales[daily_sales["item_id"] == item_id].copy()
    if not data.empty:
        # User requested to ensure date is properly formatted
        data["date"] = pd.to_datetime(data["date"])
        # Front-end expects "month" and "demand" fields
        data["month"] = data["date"].dt.strftime('%b %d')
        data["demand"] = data["quantity_sold"]
        p_dict["history"] = data[["month", "demand"]].to_dict(orient="records")"""

new_logic = """    # Extract historical demand data for the graph
    data = daily_sales[daily_sales["item_id"] == item_id].copy()
    if not data.empty:
        # User requested to ensure date is properly formatted
        data["date"] = pd.to_datetime(data["date"])
        
        # Sort chronologically and take only the latest 30 points to prevent graph clutter
        data = data.sort_values(by="date").tail(30)
        
        # Front-end expects "month" and "demand" fields
        data["month"] = data["date"].dt.strftime('%b %d')
        data["demand"] = data["quantity_sold"]
        p_dict["history"] = data[["month", "demand"]].to_dict(orient="records")"""

if old_logic in orig:
    orig = orig.replace(old_logic, new_logic)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Updated Product History Graph truncating logic successfully.")
else:
    print("Could not find the target string.")
