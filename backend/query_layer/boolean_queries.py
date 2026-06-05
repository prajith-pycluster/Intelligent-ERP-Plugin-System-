def get_stockout_risk(df, item_id):
    row = df[df["item_id"] == item_id]
    if row.empty:
        return "Item not found"

    # New Product Check
    if row["avg_daily_demand"].values[0] == 0.0 and row["rolling_30_day_demand"].values[0] == 0.0:
        return "NO"

    return "YES" if row["reorder_needed"].values[0] else "NO"


def get_overstock_risk(df, item_id):
    row = df[df["item_id"] == item_id]
    if row.empty:
        return "Item not found"

    # New Product Check
    if row["avg_daily_demand"].values[0] == 0.0 and row["rolling_30_day_demand"].values[0] == 0.0:
        return "NO"

    current_stock = row["current_stock"].values[0]
    reorder_point = row["reorder_point"].values[0]

    return "YES" if current_stock > (1.5 * reorder_point) else "NO"
