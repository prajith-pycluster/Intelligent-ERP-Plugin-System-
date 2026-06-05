import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\backend\app.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

# Replace .order("date", desc=True) with .order("transaction_id", desc=True)
if '.order("date", desc=True)' in orig:
    # only replace the first occurrence which is in get_all_billing_history
    orig = orig.replace('.order("date", desc=True)', '.order("transaction_id", desc=True)', 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print('Order changed to transaction_id desc')
else:
    print('Could not find order statement in backend')
