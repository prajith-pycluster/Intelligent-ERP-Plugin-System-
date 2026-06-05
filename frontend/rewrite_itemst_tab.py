import sys

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\pages\Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

start_str = 'const ItemHistoryTab = () => {'
end_str = 'const CustomerHistoryTab = () => {'

start_idx = orig.find(start_str)
end_idx = orig.find(end_str)

new_tab = '''const ItemHistoryTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: history = [], isLoading } = useAllBillingHistory();

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (!searchQuery.trim()) return history;
    const lowerQuery = searchQuery.toLowerCase();
    return history.filter((r: any) => 
      (r.item_id && r.item_id.toLowerCase().includes(lowerQuery)) ||
      (r.item_name && r.item_name.toLowerCase().includes(lowerQuery)) ||
      (r.transaction_id && r.transaction_id.toLowerCase().includes(lowerQuery))
    );
  }, [history, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3">
        <Input 
          placeholder="Search by Product ID, Name, or Transaction..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="max-w-md"
        />
        <Button variant="secondary" className="pointer-events-none">
          <Search className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
           <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filteredHistory.length === 0 ? (
           <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p>No billing history found.</p>
           </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Global Sales Ledger
              </h3>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((record: any, idx: number) => {
                  const dateParts = record.date ? record.date.split('-') : [];
                  const dateKey = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : record.date;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{dateKey || "Unknown"}</TableCell>
                      <TableCell>{record.transaction_id || "-"}</TableCell>
                      <TableCell className="text-primary font-semibold">{record.item_id}</TableCell>
                      <TableCell>{record.item_name || "Unknown Product"}</TableCell>
                      <TableCell>{record.quantity_sold}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
    print("UI Refactored to Sheet Format")
else:
    print("Could not find start or end index for ItemHistoryTab")
