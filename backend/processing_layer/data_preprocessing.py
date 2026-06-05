import pandas as pd

# 1. Standardize date formats
def standardize_dates(sales, purchases):
    sales["date"] = pd.to_datetime(sales["date"], format="%Y-%m-%d")
    purchases["date"] = pd.to_datetime(purchases["date"], format="%d-%m-%Y")
    return sales, purchases


# 2. Aggregate daily sales
def aggregate_daily_sales(sales):
    daily_sales = (
        sales.groupby(["item_id", "date"])["quantity_sold"]
        .sum()
        .reset_index()
    )
    return daily_sales


# 3. Compute average demand
def compute_average_demand(daily_sales):
    avg_demand = (
        daily_sales.groupby("item_id")["quantity_sold"]
        .mean()
        .reset_index()
    )
    avg_demand.rename(
        columns={"quantity_sold": "avg_daily_demand"},
        inplace=True
    )
    return avg_demand


# 4. Full preprocessing pipeline
def preprocess_pipeline(sales, purchases):
    sales, purchases = standardize_dates(sales, purchases)
    daily_sales = aggregate_daily_sales(sales)
    avg_demand = compute_average_demand(daily_sales)

    return {
        "daily_sales": daily_sales,
        "avg_demand": avg_demand
    }