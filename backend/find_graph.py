import sys
import re

path = 'app.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'@app\.get\("/product/\{item_id\}"\).*?def get_product\(item_id: str\):.*?return p_dict', text, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("Not found")
