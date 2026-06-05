def get_reorder_quantity(df, item_id):
    row = df[df["item_id"] == item_id]
    if row.empty:
        return "Item not found"
    return int(row["reorder_quantity"].values[0])


def get_reorder_point(df, item_id):
    row = df[df["item_id"] == item_id]
    if row.empty:
        return "Item not found"
    return round(row["reorder_point"].values[0], 2)


def get_lead_time_demand(df, item_id):
    row = df[df["item_id"] == item_id]
    if row.empty:
        return "Item not found"

    lead_time = row["lead_time_days"].values[0]
    demand = row["final_demand"].values[0]

    return round(lead_time * demand, 2)