import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\hooks\useInventory.ts'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

new_hook = """export const useMarketBasket = (itemId: string) => {
  return useQuery({
    queryKey: ["market-basket", itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const res = await fetch(`${BASE_URL}/market-basket/${encodeURIComponent(itemId)}`);
      if (!res.ok) throw new Error("Failed to fetch market basket recommendations");
      return res.json();
    },
    enabled: !!itemId,
    retry: false
  });
};

"""

if "useMarketBasket" not in orig:
    orig += "\n" + new_hook
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Added useMarketBasket hook successfully.")
else:
    print("Hook already exists.")
