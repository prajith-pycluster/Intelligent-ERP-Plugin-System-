import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\hooks\useInventory.ts'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

old_success = """    onSuccess: (data) => {
      toast.success("Bill generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["billing-history"] });
    },"""

new_success = """    onSuccess: (data) => {
      toast.success("Bill generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["billing-history"] });
      queryClient.invalidateQueries({ queryKey: ["all-billing-history"] });
      queryClient.invalidateQueries({ queryKey: ["billing-product-history"] });
    },"""

if old_success in orig:
    orig = orig.replace(old_success, new_success)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print('Updated onSuccess invalidation logic')
else:
    print('Could not find the target string.')
