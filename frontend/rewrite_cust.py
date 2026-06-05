import sys
import re

path = r'c:\Users\praji\Pictures\Mini Project\mini code\frontend\src\pages\Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

start_str = 'const CustomerHistoryTab = () => {'

# I will find the end of CustomerHistoryTab which is the next component 'export default function Billing'
end_str = 'export default function Billing() {'
start_idx = orig.find(start_str)
end_idx = orig.find(end_str)

new_tab = '''const CustomerHistoryTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: bills = [], isLoading } = useBillingHistory(""); // fetch all globally
  
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const { data: billDetails, isLoading: isDetailsLoading } = useBillDetails(selectedBillId);

  const filteredBills = useMemo(() => {
    if (!bills) return [];
    if (!searchQuery.trim()) return bills;
    const lowerQuery = searchQuery.toLowerCase();
    return bills.filter((b: any) => {
      const dateStr = new Date(b.created_at).toLocaleDateString();
      const dateStrGB = new Date(b.created_at).toLocaleDateString('en-GB'); // dd/mm/yyyy
      const dateStrParts = b.created_at.split('T')[0].split('-');
      const dateDMY = `${dateStrParts[2]}-${dateStrParts[1]}-${dateStrParts[0]}`;
      
      return (
        (b.customer_name && b.customer_name.toLowerCase().includes(lowerQuery)) ||
        (b.bill_id && b.bill_id.toLowerCase().includes(lowerQuery)) ||
        dateStr.includes(lowerQuery) ||
        dateStrGB.includes(lowerQuery) ||
        dateDMY.includes(lowerQuery)
      );
    });
  }, [bills, searchQuery]);

  return (
    <div className="space-y-6">
       <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3">
        <Input 
          placeholder="Search by Customer Name, Bill ID, or Date..." 
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
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
             <User className="h-12 w-12 opacity-20" />
             <p>No bills found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill: any) => {
                const dateParts = bill.created_at.split('T')[0].split('-');
                const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                return (
                <TableRow key={bill.bill_id} className="cursor-pointer hover:bg-muted transition-colors" onClick={() => setSelectedBillId(bill.bill_id)}>
                  <TableCell className="font-medium text-primary">{bill.bill_id.substring(0, 8)}...</TableCell>
                  <TableCell>{bill.customer_name || "Unknown Customer"}</TableCell>
                  <TableCell>{formattedDate}</TableCell>
                  <TableCell className="text-right font-semibold">₹{bill.total_amount}</TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!selectedBillId} onOpenChange={(open) => !open && setSelectedBillId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details - {selectedBillId?.substring(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isDetailsLoading ? (
               <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : billDetails?.items?.length > 0 ? (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Item ID</TableHead>
                     <TableHead>Quantity</TableHead>
                     <TableHead>Price</TableHead>
                     <TableHead className="text-right">Total</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {billDetails.items.map((item: any) => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium">{item.item_id}</TableCell>
                       <TableCell>{item.quantity}</TableCell>
                       <TableCell>₹{item.unit_price}</TableCell>
                       <TableCell className="text-right font-semibold">₹{item.total_price}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            ) : (
               <div className="py-8 text-center text-muted-foreground">No items in this bill.</div>
            )}
            
            <div className="mt-6 flex justify-end p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold text-lg mr-4">Grand Total:</span>
                <span className="font-bold text-lg text-primary">₹{billDetails?.master?.total_amount}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'''

if start_idx != -1 and end_idx != -1:
    orig = orig[:start_idx] + new_tab + orig[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(orig)
    print("Updated CustomerHistoryTab successfully.")
else:
    print("Could not find start or end index for CustomerHistoryTab")
