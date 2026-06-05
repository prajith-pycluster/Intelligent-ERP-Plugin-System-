import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\pages\Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

old_filter = '''    return history.filter((r: any) => 
      (r.item_id && r.item_id.toLowerCase().includes(lowerQuery)) ||
      (r.item_name && r.item_name.toLowerCase().includes(lowerQuery)) ||
      (r.transaction_id && r.transaction_id.toLowerCase().includes(lowerQuery))
    );'''

new_filter = '''    return history.filter((r: any) => {
      const dateParts = r.date ? r.date.split('-') : [];
      const dateKey = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : r.date;
      return (
        (r.item_id && r.item_id.toLowerCase().includes(lowerQuery)) ||
        (r.transaction_id && r.transaction_id.toLowerCase().includes(lowerQuery)) ||
        (dateKey && dateKey.toLowerCase().includes(lowerQuery))
      );
    });'''

if old_filter in orig:
    orig = orig.replace(old_filter, new_filter)
    
    old_placeholder = 'placeholder="Search by Product ID, Name, or Transaction..."'
    new_placeholder = 'placeholder="Search by Product ID, Transaction ID, or Date..."'
    orig = orig.replace(old_placeholder, new_placeholder)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Filter updated successfully.")
else:
    print("Could not find the old filter string.")
