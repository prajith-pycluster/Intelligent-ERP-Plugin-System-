import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\pages\Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

# Replace the import
orig = orig.replace(
    'useBillingProductHistory, useBillingHistory, useBillDetails',
    'useBillingProductHistory, useBillingHistory, useBillDetails, useAllBillingHistory'
)

start_str = 'const ItemHistoryTab = () => {'
end_str = 'const CustomerHistoryTab = () => {'

start_idx = orig.find(start_str)
end_idx = orig.find(end_str)

new_tab = '''const ItemHistoryTab = () => {
  const { data: history = [], isLoading } = useAllBillingHistory();

  const groupedHistory = useMemo(() => {
    if (!history || history.length === 0) return { groups: {}, sortedKeys: [] };
    const groups: Record<string, Record<string, number>> = {};
    
    // Group by Date, then aggregate by Item ID
    history.forEach((record: any) => {
      const dateParts = record.date.split('-');
      const dateKey = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : record.date;
      
      if (!groups[dateKey]) groups[dateKey] = {};
      if (!groups[dateKey][record.item_id]) groups[dateKey][record.item_id] = 0;
      
      groups[dateKey][record.item_id] += record.quantity_sold;
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aParts = a.split('-');
      const bParts = b.split('-');
      const aStr = aParts.length === 3 ? `${aParts[2]}-${aParts[1]}-${aParts[0]}` : a;
      const bStr = bParts.length === 3 ? `${bParts[2]}-${bParts[1]}-${bParts[0]}` : b;
      return bStr.localeCompare(aStr);
    });
    
    return { groups, sortedKeys };
  }, [history]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
           <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
           <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p>No billing history available</p>
           </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Global Sales Ledger
              </h3>
            </div>
            
            <div className="space-y-8">
              {groupedHistory.sortedKeys.map((dateKey) => {
                const dayItems = groupedHistory.groups[dateKey];
                const itemKeys = Object.keys(dayItems);
                const dayTotal = itemKeys.reduce((acc: number, itemId: string) => acc + dayItems[itemId], 0);
                
                return (
                  <div key={dateKey} className="space-y-4">
                    <div className="bg-muted px-4 py-2 rounded-md border border-border inline-flex items-center shadow-sm">
                      <span className="font-bold text-foreground">📅 {dateKey}</span>
                      <span className="text-muted-foreground font-medium ml-2 text-sm">(Total: {dayTotal} items)</span>
                    </div>
                    
                    <div className="pl-6 space-y-3 border-l-2 border-primary/20 ml-4 relative">
                      {itemKeys.map((itemId: string, idx: number) => (
                         <div key={idx} className="bg-card border border-border rounded-lg p-4 shadow-sm w-full max-w-sm relative before:absolute before:content-[''] before:w-6 before:h-px before:bg-primary/20 before:-left-6 before:top-1/2">
                           <div className="flex justify-between items-center">
                             <span className="text-muted-foreground text-sm">Product ID: <span className="font-bold text-foreground">{itemId}</span></span>
                             <span className="font-medium bg-secondary/50 px-2 py-0.5 rounded text-sm">Quantity: {dayItems[itemId]}</span>
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

'''

if start_idx != -1 and end_idx != -1:
    new_content = orig[:start_idx] + new_tab + orig[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Could not find start or end index for ItemHistoryTab")
