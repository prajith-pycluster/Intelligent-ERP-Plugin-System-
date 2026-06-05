import sys
import re

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\pages\ProductManagement.tsx'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

# Add ShoppingCart icon import and useMarketBasket 
orig = orig.replace('import { useProducts, useRecycleBin }', 'import { useProducts, useRecycleBin, useMarketBasket }')
if 'ShoppingCart' not in orig:
    orig = orig.replace('ArchiveRestore', 'ArchiveRestore, ShoppingCart, Search')

# Create MarketBasketTab component text
market_basket_component = """
const MarketBasketTab = () => {
  const [searchId, setSearchId] = useState("");
  const [fetchId, setFetchId] = useState<string | null>(null);
  const { data: recommendations = [], isLoading } = useMarketBasket(fetchId || "");

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center bg-card p-4 rounded-xl border border-border shadow-sm max-w-md">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Enter Product ID</label>
          <Input 
            placeholder="e.g., P001" 
            value={searchId} 
            onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && setFetchId(searchId)}
          />
        </div>
        <Button onClick={() => setFetchId(searchId)} className="mt-5">
          <Search className="h-4 w-4 mr-2" />
          Get Recommendations
        </Button>
      </div>

      {fetchId && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
             <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : recommendations.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
               <ShoppingCart className="h-10 w-10 opacity-20 mb-3" />
               <p>No associated products found</p>
             </div>
          ) : (
            <div className="p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-6 border-b border-border pb-4">
                <ShoppingCart className="h-5 w-5 text-primary" />
                🛒 Frequently Bought Together
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec: any, idx: number) => (
                   <div key={idx} className="flex justify-between items-center bg-muted/50 p-4 rounded-lg border border-border">
                     <span className="font-bold text-foreground text-lg">{rec.item_id}</span>
                     <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-md">
                       {rec.confidence}% Confidence
                     </span>
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
"""

# Insert MarketBasketTab after RecycleBinTab
if 'const RecycleBinTab =' in orig:
    # Just insert it before `export default function ProductManagement() {`
    orig = orig.replace('export default function ProductManagement() {', market_basket_component + '\nexport default function ProductManagement() {')

# Adjust TabsList
old_tabs_list = """<TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Active Products</TabsTrigger>
          <TabsTrigger value="recycle-bin">Recycle Bin</TabsTrigger>
        </TabsList>"""

new_tabs_list = """<TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="active">Active Products</TabsTrigger>
          <TabsTrigger value="recycle-bin">Recycle Bin</TabsTrigger>
          <TabsTrigger value="market-basket">Market Basket</TabsTrigger>
        </TabsList>"""

orig = orig.replace(old_tabs_list, new_tabs_list)

# Add TabsContent for Market Basket
new_tab_content = """      <TabsContent value="market-basket" className="animate-in fade-in duration-300">
        <MarketBasketTab />
      </TabsContent>"""

if '</TabsContent>' in orig:
    # Find the last TabsContent which is probably recycle-bin and add it below
    orig = orig.replace('      </TabsContent>\n    </div>', '      </TabsContent>\n' + new_tab_content + '\n    </div>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(orig)

print("ProductManagement UI updated successfully.")
