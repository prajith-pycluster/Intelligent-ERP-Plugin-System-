import sys
import os
from datetime import datetime

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.processing_layer.predictive_inventory import fetch_active_predictive_products, is_date_active

# Test 1: Date Logic
print("Testing Date Logic:")
print(f"01-03 to 30-06 on 15-05: {is_date_active('01-03', '30-06', datetime(2026, 5, 15))}")
print(f"20-12 to 10-01 on 25-12: {is_date_active('20-12', '10-01', datetime(2026, 12, 25))}")
print(f"20-12 to 10-01 on 05-01: {is_date_active('20-12', '10-01', datetime(2026, 1, 5))}")
print(f"01-03 to 30-06 on 15-08: {is_date_active('01-03', '30-06', datetime(2026, 8, 15))}")
print()

# Test 2: Fetch Active
print("Testing Fetch Active (Mock Date: May 15, 2026):")
mock_date = datetime(2026, 5, 15)
active = fetch_active_predictive_products(mock_date)

print(f"\nTotal Active Found: {len(active)}")
if len(active) > 0:
    print("Sample:")
    for a in active[:5]:
        print(f" - {a['product_name']} ({a['source']} - {a['season_or_festival']})")
