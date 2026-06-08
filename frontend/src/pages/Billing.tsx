import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart, CheckCircle2, Loader2, IndianRupee, Trash2, User, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { useProducts, useDraftBill, useCreateBill, useAddBillItem, useRemoveBillItem, useCheckoutBill, useBillingProductHistory, useBillingHistory, useBillDetails, useAllBillingHistory, usePredictiveInventory } from "@/hooks/useInventory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const ItemHistoryTab = () => {
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("billing_item_search") || "");
  useEffect(() => { sessionStorage.setItem("billing_item_search", searchQuery); }, [searchQuery]);
  const { data: history = [], isLoading } = useAllBillingHistory();

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (!searchQuery.trim()) return history;
    const lowerQuery = searchQuery.toLowerCase();
    return history.filter((r: any) => {
      const dateParts = r.date ? r.date.split('-') : [];
      const dateKey = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : r.date;
      return (
        (r.item_id && r.item_id.toLowerCase().includes(lowerQuery)) ||
        (r.transaction_id && r.transaction_id.toLowerCase().includes(lowerQuery)) ||
        (dateKey && dateKey.toLowerCase().includes(lowerQuery))
      );
    });
  }, [history, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex gap-3">
        <Input 
          placeholder="Search by Product ID, Transaction ID, or Date..." 
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

const CustomerHistoryTab = () => {
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("billing_customer_search") || "");
  useEffect(() => { sessionStorage.setItem("billing_customer_search", searchQuery); }, [searchQuery]);
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

export default function Billing() {

  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const { data: predictiveData } = usePredictiveInventory();
  const [localBillId, setLocalBillId] = useState<string | null>(() => sessionStorage.getItem("draft_bill_id"));
  
  const { data: draftData, isLoading: isDraftLoading } = useDraftBill(localBillId);
  const createBillMutation = useCreateBill();
  const addItemMutation = useAddBillItem();
  const removeItemMutation = useRemoveBillItem();
  const checkoutMutation = useCheckoutBill();

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("billing_active_tab") || "active");
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("billing_active_search") || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(() => sessionStorage.getItem("billing_active_qty") || "");
  const [customerName, setCustomerName] = useState(() => sessionStorage.getItem("billing_active_customer") || "");

  useEffect(() => { sessionStorage.setItem("billing_active_tab", activeTab); }, [activeTab]);
  useEffect(() => { sessionStorage.setItem("billing_active_search", searchQuery); }, [searchQuery]);
  useEffect(() => { sessionStorage.setItem("billing_active_qty", quantity); }, [quantity]);
  useEffect(() => { sessionStorage.setItem("billing_active_customer", customerName); }, [customerName]);

  // Regular active products (P* series)
  const activeProducts = useMemo(() => {
    return products.filter((p: any) => !p.is_deleted && (p.inventory_mode === "NORMAL" || p.inventory_mode === "PREDICTIVE"));
  }, [products]);

  // Merge predictive active_stocks — only include those physically restocked (current_stock > 0)
  const allBillableProducts = useMemo(() => {
    const predictiveStocks: any[] = (predictiveData?.active_stocks || [])
      .filter((p: any) => Number(p.current_stock) > 0) // Only stocked items are billable
      .map((p: any) => ({
        item_id: p.item_id,
        item_name: p.item_name,
        category: p.category || "Predictive",
        unit_price: p.unit_price || 0,
        current_stock: p.current_stock ?? 0,
        inventory_mode: "PREDICTIVE",
        is_deleted: false,
        _is_predictive: true
      }));
    // Merge: regular products first, then predictive ones not already in the list
    const regularIds = new Set(activeProducts.map((p: any) => p.item_id));
    const uniquePredictive = predictiveStocks.filter(p => !regularIds.has(p.item_id));
    return [...activeProducts, ...uniquePredictive];
  }, [activeProducts, predictiveData]);

  const resolvedItemId = searchQuery.trim();

  const selectedProduct = useMemo(() => {
    return allBillableProducts.find((p: any) => p.item_id === resolvedItemId);
  }, [allBillableProducts, resolvedItemId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toUpperCase());
    setShowDropdown(true);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return allBillableProducts;
    return allBillableProducts.filter((p: any) => 
      p.item_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allBillableProducts, searchQuery]);

  const hasTriedRef = React.useRef(false);

  // Ensure a draft bill exists
  useEffect(() => {
    if (!localBillId && !createBillMutation.isPending && !hasTriedRef.current) {
      hasTriedRef.current = true;
      createBillMutation.mutateAsync().then(data => {
        setLocalBillId(data.bill_id);
        sessionStorage.setItem("draft_bill_id", data.bill_id);
      }).catch(err => {
        console.error(err);
        // Do NOT reset hasTriedRef to false. If the database schema is missing,
        // we want to fail once (showing one toast) and wait for the user to fix it,
        // rather than infinitely spanning requests.
      });
    }
  }, [localBillId, createBillMutation]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localBillId) return;

    const finalItemId = searchQuery.trim();

    if (!finalItemId) {
      toast.error("Please enter or select a product.");
      return;
    }

    const matchedProduct = allBillableProducts.find((p: any) => p.item_id === finalItemId);
    if (!matchedProduct) {
      toast.error(`Product ID '${finalItemId}' not found in active inventory or predictive stocks.`);
      return;
    }
    
    const qtyNum = parseInt(quantity, 10);
    if (!qtyNum || qtyNum <= 0) {
      toast.error("Please enter a valid positive quantity.");
      return;
    }

    if (qtyNum > matchedProduct.current_stock) {
      toast.error(`Insufficient stock! Only ${matchedProduct.current_stock} available.`);
      return;
    }

    try {
      await addItemMutation.mutateAsync({
        bill_id: localBillId,
        item_id: finalItemId,
        quantity: qtyNum
      });
      setSearchQuery("");
      setQuantity("");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (itemIdToRemove: string) => {
    if (!localBillId) return;
    try {
      await removeItemMutation.mutateAsync({ id: itemIdToRemove, bill_id: localBillId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    if (!localBillId) return;
    if (!draftData?.items || draftData.items.length === 0) {
      toast.error("Cannot checkout an empty bill.");
      return;
    }

    try {
      await checkoutMutation.mutateAsync({
        bill_id: localBillId,
        customer_name: customerName.trim()
      });
      // Clear draft locally so a new one is created next
      sessionStorage.removeItem("draft_bill_id");
      setLocalBillId(null);
      setCustomerName("");
    } catch (err) {
      console.error(err);
    }
  };

  const isWorking = isProductsLoading || isDraftLoading || addItemMutation.isPending || removeItemMutation.isPending || checkoutMutation.isPending;
  const billItems = draftData?.items || [];
  const currentTotal = billItems.reduce((acc: number, item: any) => acc + parseFloat(item.total_price), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-[32px] font-bold flex items-center gap-2 text-foreground leading-[40px]">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Billing System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage operations and analyze billing history.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Add Items */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-5 h-fit">
          <h3 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <PlusCircle className="h-4 w-4 text-primary" /> Add Item
          </h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-1.5 relative">
              <label className="text-sm font-medium text-foreground">Select or Type Product ID</label>
              <Input
                placeholder="Search by ID or Name (e.g., P001)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                disabled={isWorking}
                autoComplete="off"
              />
              {showDropdown && (
                <div className="absolute top-16 left-0 right-0 z-50 max-h-60 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-md shadow-md">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">No products found.</div>
                  ) : (
                    filteredProducts.map((p: any) => (
                      <div
                        key={p.item_id}
                        onClick={() => {
                          setSearchQuery(p.item_id);
                          setShowDropdown(false);
                        }}
                        className={`p-2 cursor-pointer text-sm hover:bg-muted ${p.current_stock <= 0 ? "opacity-50" : ""}`}
                      >
                        <span className="font-semibold">{p.item_id}</span> - {p.item_name}
                        {p.current_stock <= 0 && <span className="ml-2 text-destructive text-xs">(Out of Stock)</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="bg-secondary/50 p-3 rounded-lg border border-border flex justify-between gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Price</p>
                  <p className="font-semibold">₹{selectedProduct.unit_price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Stock</p>
                  <p className={`font-semibold ${selectedProduct.current_stock < 10 ? 'text-destructive' : 'text-primary'}`}>
                    {selectedProduct.current_stock}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Quantity</label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.current_stock || undefined}
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!resolvedItemId || isWorking}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isWorking || !resolvedItemId || !quantity || parseInt(quantity) <= 0}>
              {addItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Add to Bill"}
            </Button>
          </form>
        </div>

        {/* RIGHT COLUMN: Current Draft Bill */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm flex flex-col h-full min-h-[500px]">
          <div className="p-6 pb-0 flex justify-between items-center">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" /> Current Bill Details
            </h3>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Customer Name (Optional)" 
                className="h-8 max-w-[200px] text-sm" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                disabled={isWorking}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 pt-4">
            {billItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50 py-12">
                <ShoppingCart className="h-16 w-16" />
                <p>No items added to this bill yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billItems.map((item: any) => {
                    const productDetails = activeProducts.find((p: any) => p.item_id === item.item_id);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.item_id}
                          {productDetails && <p className="text-xs text-muted-foreground">{productDetails.item_name}</p>}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unit_price}</TableCell>
                        <TableCell className="text-right font-semibold">₹{item.total_price}</TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isWorking}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="p-6 bg-muted/30 border-t border-border mt-auto">
            <div className="flex justify-between items-center mb-6">
              <p className="text-lg font-medium text-foreground">Grand Total</p>
              <p className="text-3xl font-bold text-primary flex items-center">
                <IndianRupee className="h-6 w-6 mr-1" />
                {currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleCheckout}
              disabled={isWorking || billItems.length === 0}
            >
              {checkoutMutation.isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing Checkout...</>
              ) : (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> Generate Final Bill</>
              )}
            </Button>
          </div>
        </div>

            </div>
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
}
