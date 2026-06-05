import re

path = 'app.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

match = re.search(r'@app\.get\("/billing/all-history"\).*?except Exception as e:\n        raise HTTPException\(status_code=500, detail=f"Error fetching global history: \{str\(e\)\}"\)\n', orig, re.DOTALL)

if match:
    all_history_block = match.group(0)
    # remove it from its current location
    orig = orig.replace(all_history_block, '')
    
    # inject it before @app.get("/billing/{bill_id}")
    target = '@app.get("/billing/{bill_id}")'
    if target in orig:
        orig = orig.replace(target, all_history_block + '\n' + target)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(orig)
        print('Successfully moved /billing/all-history')
    else:
        print('Could not find /billing/{bill_id}')
else:
    print('Could not find /billing/all-history block')
