import re

path = 'app.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

# find the get_billing_history block
match_history = re.search(r'@app\.get\("/billing/history"\).*?def get_billing_history.*?except Exception as e:\n        raise HTTPException\(status_code=500, detail=f"Error fetching history: \{str\(e\)\}"\)\n', orig, re.DOTALL)

# find the get_billing_product_history block
match_prod_history = re.search(r'@app\.get\("/billing/product-history/\{item_id\}"\).*?def get_billing_product_history.*?except Exception as e:\n        raise HTTPException\(status_code=500, detail=f"Error fetching product history: \{str\(e\)\}"\)\n', orig, re.DOTALL)

target = '@app.get("/billing/{bill_id}")'

if match_history and target in orig:
    hist_block = match_history.group(0)
    orig = orig.replace(hist_block, '')
    orig = orig.replace(target, hist_block + '\n' + target)
    
if match_prod_history and target in orig:
    prod_block = match_prod_history.group(0)
    orig = orig.replace(prod_block, '')
    orig = orig.replace(target, prod_block + '\n' + target)

with open(path, 'w', encoding='utf-8') as f:
    f.write(orig)
print('Fixed routing order')
