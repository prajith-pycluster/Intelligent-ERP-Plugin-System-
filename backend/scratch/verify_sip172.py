import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import final_df, _is_erp_product, _is_predictive_id

def inspect_sip172():
    print("Columns in final_df:", list(final_df.columns))
    
    # Try finding item_id matching SIP172
    matches = final_df[final_df["item_id"].str.upper().str.strip() == "SIP172"]
    if matches.empty:
        print("No exact match found for SIP172 in final_df.")
        # Print items starting with SI
        si_items = final_df[final_df["item_id"].str.startswith("SI")]
        print(f"Items starting with SI: {list(si_items['item_id'].unique())}")
        return
        
    row = matches.iloc[0]
    print("\n--- SIP172 data ---")
    for col in final_df.columns:
        print(f"{col}: {row[col]}")
        
    print("\n--- Evaluation ---")
    print("is_predictive_id:", _is_predictive_id("SIP172"))
    print("is_erp_product:", _is_erp_product(row))

if __name__ == "__main__":
    inspect_sip172()
