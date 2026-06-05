import pandas as pd

# 1. Demand variability (standard deviation)
def compute_demand_variability(daily_sales):
    demand_variability = (
        daily_sales.groupby("item_id")["quantity_sold"]
        .std()
        .reset_index()
    )
    demand_variability.rename(
        columns={"quantity_sold": "demand_std_dev"},
        inplace=True
    )
    return demand_variability

# 2. Rolling demand (recent trend)
def compute_rolling_demand(daily_sales, window=30):
    # get latest date in dataset
    latest_date = daily_sales["date"].max()

    # filter last N days
    filtered_data = daily_sales[
        daily_sales["date"] >= latest_date - pd.Timedelta(days=window)
    ]

    rolling_demand = (
        filtered_data.groupby("item_id")["quantity_sold"]
        .mean()
        .reset_index()
    )

    rolling_demand.rename(
        columns={"quantity_sold": f"rolling_{window}_day_demand"},
        inplace=True
    )
    return rolling_demand

def compute_hybrid_demand(avg_demand, rolling_30):
    df = avg_demand.merge(rolling_30, on="item_id", how="left").fillna(0)
    df["final_demand"] = (
        0.7 * df.get("rolling_30_day_demand", 0) +
        0.3 * df.get("avg_daily_demand", 0)
    )
    return df[["item_id", "final_demand"]]


# 3. Full demand analysis pipeline
def demand_analysis_pipeline(daily_sales,avg_demand):
    std_dev = compute_demand_variability(daily_sales)
    rolling_30 = compute_rolling_demand(daily_sales, window=30)
    hybrid_demand = compute_hybrid_demand(avg_demand, rolling_30)

    return {
        "std_dev": std_dev,
        "rolling_30": rolling_30,
        "final_demand": hybrid_demand
        
    }


