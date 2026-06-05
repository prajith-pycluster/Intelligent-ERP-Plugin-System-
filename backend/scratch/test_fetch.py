import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.processing_layer.data_loader import fetch_predictive_datasets

try:
    seasonal, festival, national = fetch_predictive_datasets()
    print("Fetch successful!")
    print(f"seasonal_inventory rows: {len(seasonal)}")
    print(f"festival_inventory rows: {len(festival)}")
    print(f"national_day_inventory rows: {len(national)}")
except Exception as e:
    print(f"Fetch failed: {e}")
