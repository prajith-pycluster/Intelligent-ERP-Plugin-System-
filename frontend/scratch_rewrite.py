import sys
path = r'c:\\Users\\praji\\Pictures\\Mini Project\\mini code\\frontend\\src\\pages\\Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    original = f.read()

imports = '''import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart, CheckCircle2, Loader2, IndianRupee, Trash2, User, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { useProducts, useDraftBill, useCreateBill, useAddBillItem, useRemoveBillItem, useCheckoutBill, useBillingProductHistory, useBillingHistory, useBillDetails } from "@/hooks/useInventory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
'''

tabs_components = '''
const ItemHistoryTab = () => {
  const [searchId, setSearchId] = useState("");
  const [fetchId, setFetchId] = useState<string | null>(null);
  const { data: history = [], isLoading } = useBillingProductHistory(fetchId);
  const totalSold = history.reduce((acc: number, item: any) => acc + item.quantity_sold, 0);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3">
        <Input 
          placeholder="Enter Product ID (e.g., P001)" 
          value={searchId} 
          onChange={(e) => setSearchId(e.target.value.toUpperCase())} 
          className="max-w-xs"
        />
        <Button onClick={() => setFetchId(searchId)} variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          Fetch History
        </Button>
      </div>
      {fetchId && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
             <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : history.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground">No history found for {fetchId}</div>
          ) : (
            <>
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="font-semibold text-lg">Billing History: {fetchId}</h3>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-md font-medium">Total Sold: {totalSold}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="font-medium text-primary">{fetchId}</TableCell>
                      <TableCell>{record.quantity_sold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CustomerHistoryTab = () => {
  const [searchName, setSearchName] = useState("");
  const [fetchName, setFetchName] = useState("");
  const { data: bills = [], isLoading } = useBillingHistory(fetchName);
  
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const { data: billDetails, isLoading: isDetailsLoading } = useBillDetails(selectedBillId);

  return (
    <div className="space-y-6">
       <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3">
        <Input 
          placeholder="Enter Customer Name" 
          value={searchName} 
          onChange={(e) => setSearchName(e.target.value)} 
          className="max-w-xs"
        />
        <Button onClick={() => setFetchName(searchName)} variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          Fetch Bills
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No bills found.</div>
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
              {bills.map((bill: any) => (
                <TableRow key={bill.bill_id} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedBillId(bill.bill_id)}>
                  <TableCell className="font-medium text-primary">{bill.bill_id.substring(0, 8)}...</TableCell>
                  <TableCell>{bill.customer_name || "Unknown Customer"}</TableCell>
                  <TableCell>{new Date(bill.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-semibold">₹{bill.total_amount}</TableCell>
                </TableRow>
              ))}
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

export default function Billing() {'''

old_imports_boundary = original.find('export default function Billing() {')
if old_imports_boundary == -1: sys.exit(1)

new_content = imports + '\n' + tabs_components + '\n' + original[old_imports_boundary + len('export default function Billing() {'):]

# Now replace the return wrapper
old_return = '''  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Billing System
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Multi-item billing with stock integration</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Draft Bill ID</p>
          <p className="font-mono text-sm">{localBillId ? localBillId.substring(0, 8) + '...' : <Loader2 className="animate-spin h-4 w-4" />}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">'''

new_return = '''  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Billing System
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage operations and analyze billing history.</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="active">Active Billing</TabsTrigger>
          <TabsTrigger value="item-history">Item History</TabsTrigger>
          <TabsTrigger value="customer-history">Customer History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="animate-in fade-in duration-300">
          <div className="space-y-6">
            <div className="flex justify-end">
              <div className="text-right bg-card p-3 rounded-lg border border-border shadow-sm w-fit">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Draft Bill ID</p>
                <p className="font-mono text-sm font-semibold text-primary">{localBillId ? localBillId.substring(0, 8) + '...' : <Loader2 className="animate-spin h-4 w-4" />}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">'''

new_content = new_content.replace(old_return, new_return)

old_end = '''      </div>
    </div>
  );
}'''

new_end = '''            </div>
          </div>
        </TabsContent>

        <TabsContent value="item-history" className="animate-in fade-in duration-300">
           <ItemHistoryTab />
        </TabsContent>

        <TabsContent value="customer-history" className="animate-in fade-in duration-300">
           <CustomerHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}'''

new_content = new_content.replace(old_end, new_end)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Successfully modified Billing.tsx')
